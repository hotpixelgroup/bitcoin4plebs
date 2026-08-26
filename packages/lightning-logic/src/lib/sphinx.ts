import { bytesToHex, hexToBytes } from '@bitcoin4plebs/bitcoin-logic';
import { pseudoRandomStream, xorInto } from './chacha20.js';
import { asciiBytes, concatBytes, hmacSha256, sha256 } from './crypto.js';
import { compress, decompress, mod, multiply, publicKey, G, N } from './secp256k1.js';

/**
 * Sphinx: the onion BOLT #4 wraps every Lightning payment in.
 *
 * The idea in one sentence: the sender builds a fixed-size packet with one
 * encrypted layer per hop, where each hop's key unwraps exactly one layer, * revealing where to send it next and nothing else. No hop learns the
 * sender, the recipient, or its own position in the route.
 *
 * The packet is ALWAYS 1366 bytes, whether the route is two hops or twenty.
 * That fixed size is the privacy: a shrinking packet would leak how far
 * along the route you are, so every hop re-pads what it forwards with
 * deterministic filler the sender pre-computed. That filler is the subtle
 * part, and it is why this file is worth reading twice.
 *
 * Every function here is checked against the Lightning specification's own
 * test vector (bolt04/onion-test.json) at the site's pinned commit, in CI,
 * on every push. See sphinx.spec.ts.
 */

/** The onion's routing-information field is always exactly this long. */
export const ROUTING_INFO_SIZE = 1300;

/** version byte + 33-byte ephemeral pubkey + routing info + 32-byte HMAC. */
export const ONION_PACKET_SIZE = 1 + 33 + ROUTING_INFO_SIZE + 32;

const HMAC_SIZE = 32;

/**
 * BOLT #4's four key types, each an ASCII string used as an HMAC key.
 * The spec is explicit that there is no trailing zero byte: "rho" is
 * three bytes, not four.
 */
export type KeyType = 'rho' | 'mu' | 'um' | 'pad';

/** Derive one of the per-hop keys from a shared secret. */
export function deriveKey(
  type: KeyType,
  sharedSecret: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  return hmacSha256(asciiBytes(type), sharedSecret);
}

/** Everything the sender computes for one hop, exposed so a reader can watch it. */
export interface HopKeys {
  /** The hop's node id, compressed hex. */
  nodeId: string;
  /** The ephemeral public key THIS hop will see in the packet. */
  ephemeralPubkey: string;
  /** ECDH output, hashed, the secret only sender and this hop share. */
  sharedSecret: string;
  /** What multiplies the ephemeral key on the way to the next hop. */
  blindingFactor: string;
}

/**
 * Walk the route forward, deriving a shared secret with each hop.
 *
 * The sender has one ephemeral key. For each hop it does ECDH with that
 * hop's node id, then *blinds* the ephemeral key, multiplies it by a
 * factor derived from what it just computed, before moving on. So every
 * hop sees a different ephemeral key and none of them can be linked, yet
 * each hop can re-derive its own shared secret from its own private key.
 */
export async function deriveHopKeys(
  sessionKey: string,
  hopNodeIds: readonly string[]
): Promise<HopKeys[]> {
  let ephemeralPrivate = BigInt('0x' + sessionKey);
  const keys: HopKeys[] = [];

  for (const nodeId of hopNodeIds) {
    const ephemeralPublic = publicKey(ephemeralPrivate);
    const ephemeralHex = compress(ephemeralPublic);

    // ECDH: the hop's public key scaled by our ephemeral private key. The
    // hop reaches the same point from the other side, with its own private
    // key and our ephemeral public key. That symmetry is the whole trick.
    const shared = multiply(decompress(nodeId), ephemeralPrivate);
    if (!shared) throw new Error(`degenerate ECDH for hop ${nodeId}`);
    const sharedSecret = await sha256(hexToBytes(compress(shared)));

    const blinding = await sha256(concatBytes(hexToBytes(ephemeralHex), sharedSecret));

    keys.push({
      nodeId,
      ephemeralPubkey: ephemeralHex,
      sharedSecret: bytesToHex(sharedSecret),
      blindingFactor: bytesToHex(blinding),
    });

    ephemeralPrivate = mod(ephemeralPrivate * BigInt('0x' + bytesToHex(blinding)), N);
  }

  return keys;
}

/** How far the packet shifts to make room for one hop's payload plus its HMAC. */
function shiftSize(payload: Uint8Array): number {
  return payload.length + HMAC_SIZE;
}

/**
 * The filler: the padding each forwarding hop will append, pre-computed.
 *
 * When a hop processes the packet it pads the routing info with 1300 zero
 * bytes and XORs a 2600-byte keystream across the whole thing, then shifts
 * its own payload off the front. The tail it forwards is therefore
 * keystream, not zeros and since the HMACs commit to the whole packet,
 * the sender must reproduce that exact tail in advance or every HMAC after
 * the first will fail. The last hop forwards nothing, so it contributes none.
 */
async function generateFiller(
  hopKeys: readonly HopKeys[],
  payloads: readonly Uint8Array[]
): Promise<Uint8Array<ArrayBuffer>> {
  let position = 0;
  let filler = new Uint8Array(0);

  for (let i = 0; i < hopKeys.length - 1; i++) {
    const skip = ROUTING_INFO_SIZE - position;
    position += shiftSize(payloads[i]);

    const grown = new Uint8Array(position);
    grown.set(filler, 0);
    filler = grown;

    const rho = await deriveKey('rho', hexToBytes(hopKeys[i].sharedSecret));
    const stream = pseudoRandomStream(rho, 2 * ROUTING_INFO_SIZE);
    xorInto(filler, stream.subarray(skip, skip + position));
  }

  return filler;
}

export interface OnionRequest {
  /** 32-byte hex; one per payment, never reused. */
  sessionKey: string;
  /** The route: each hop's node id and the payload only that hop can read. */
  hops: readonly { nodeId: string; payload: string }[];
  /** Data the packet commits to without carrying, usually the payment hash. */
  associatedData: string;
}

export interface OnionResult {
  /** The 1366-byte packet, hex. */
  onion: string;
  /** Per-hop intermediate values, for showing the reader the machinery. */
  hopKeys: HopKeys[];
}

/**
 * Build the onion. Layers are applied in REVERSE route order, the final
 * recipient's layer goes on first and ends up innermost, exactly like
 * wrapping a parcel from the inside out.
 */
export async function constructOnion(request: OnionRequest): Promise<OnionResult> {
  const { sessionKey, hops, associatedData } = request;
  const payloads = hops.map((h) => hexToBytes(h.payload));
  const assoc = hexToBytes(associatedData);
  const hopKeys = await deriveHopKeys(
    sessionKey,
    hops.map((h) => h.nodeId)
  );

  const filler = await generateFiller(hopKeys, payloads);

  // Start from 1300 bytes of keystream rather than zeros, so that the
  // unused tail of a short route is indistinguishable from real layers.
  const padKey = await deriveKey('pad', hexToBytes(sessionKey));
  let routingInfo = pseudoRandomStream(padKey, ROUTING_INFO_SIZE);
  let hmac = new Uint8Array(HMAC_SIZE);

  for (let i = hops.length - 1; i >= 0; i--) {
    const sharedSecret = hexToBytes(hopKeys[i].sharedSecret);
    const rho = await deriveKey('rho', sharedSecret);
    const mu = await deriveKey('mu', sharedSecret);
    const payload = payloads[i];
    const shift = shiftSize(payload);

    // Right-shift to make room, dropping whatever falls off the 1300-byte end.
    const shifted = new Uint8Array(ROUTING_INFO_SIZE);
    shifted.set(routingInfo.subarray(0, ROUTING_INFO_SIZE - shift), shift);
    // This hop's payload (which already carries its own length prefix),
    // followed by the HMAC this hop will hand to the next one.
    shifted.set(payload, 0);
    shifted.set(hmac, payload.length);
    routingInfo = shifted;

    xorInto(routingInfo, pseudoRandomStream(rho, ROUTING_INFO_SIZE));

    // Innermost layer only: overwrite the tail with the pre-computed filler.
    if (i === hops.length - 1) {
      routingInfo.set(filler, ROUTING_INFO_SIZE - filler.length);
    }

    hmac = await hmacSha256(mu, concatBytes(routingInfo, assoc));
  }

  const onion = concatBytes(
    new Uint8Array([0x00]), // version
    hexToBytes(hopKeys[0].ephemeralPubkey),
    routingInfo,
    hmac
  );

  return { onion: bytesToHex(onion), hopKeys };
}

/** BOLT #1's bigsize: one byte under 253, otherwise a tagged wider integer. */
function readBigsize(bytes: Uint8Array): { value: number; size: number } {
  if (bytes[0] < 0xfd) return { value: bytes[0], size: 1 };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes[0] === 0xfd) return { value: view.getUint16(1), size: 3 };
  if (bytes[0] === 0xfe) return { value: view.getUint32(1), size: 5 };
  throw new Error('payload length exceeds what an onion can carry');
}

export interface PeeledOnion {
  /** This hop's payload, including its length prefix, hex. */
  payload: string;
  /** The shared secret this hop derived on its own. */
  sharedSecret: string;
  /** True when the next HMAC is all zeros: the spec's "you are the recipient" flag. */
  isFinal: boolean;
  /** The 1366-byte packet to forward. Meaningless when isFinal. */
  nextOnion: string;
}

/**
 * Unwrap exactly one layer, as a routing node does.
 *
 * The HMAC check comes first and is not optional: it proves the packet
 * reached this hop unmodified. Only then does the hop learn its payload, * and all it can see beyond that is 1300 bytes of noise it must pass on.
 */
export async function peelOnion(
  onion: string,
  nodePrivateKey: string,
  associatedData: string
): Promise<PeeledOnion> {
  const packet = hexToBytes(onion);
  if (packet.length !== ONION_PACKET_SIZE) {
    throw new Error(`onion must be ${ONION_PACKET_SIZE} bytes, got ${packet.length}`);
  }
  const assoc = hexToBytes(associatedData);

  const ephemeral = bytesToHex(packet.subarray(1, 34));
  const routingInfo = packet.slice(34, 34 + ROUTING_INFO_SIZE);
  const packetHmac = bytesToHex(packet.subarray(34 + ROUTING_INFO_SIZE));

  const shared = multiply(decompress(ephemeral), BigInt('0x' + nodePrivateKey));
  if (!shared) throw new Error('degenerate ECDH while peeling');
  const sharedSecret = await sha256(hexToBytes(compress(shared)));

  const mu = await deriveKey('mu', sharedSecret);
  const expected = bytesToHex(await hmacSha256(mu, concatBytes(routingInfo, assoc)));
  if (expected !== packetHmac) {
    throw new Error('HMAC mismatch: this packet was altered in flight');
  }

  // Pad to 2600 and XOR the whole thing: this deobfuscates our own layer
  // and simultaneously obfuscates the zeros we just appended, which is
  // what keeps the forwarded packet a constant 1300 bytes.
  const widened = concatBytes(routingInfo, new Uint8Array(ROUTING_INFO_SIZE));
  const rho = await deriveKey('rho', sharedSecret);
  xorInto(widened, pseudoRandomStream(rho, 2 * ROUTING_INFO_SIZE));

  const { value: length, size } = readBigsize(widened);
  const payloadEnd = size + length;
  const payload = widened.subarray(0, payloadEnd);
  const nextHmac = widened.subarray(payloadEnd, payloadEnd + HMAC_SIZE);
  const shift = payloadEnd + HMAC_SIZE;

  const blinding = await sha256(concatBytes(hexToBytes(ephemeral), sharedSecret));
  const nextEphemeral = multiply(decompress(ephemeral), BigInt('0x' + bytesToHex(blinding)));
  if (!nextEphemeral) throw new Error('degenerate blinding while peeling');

  const nextOnion = concatBytes(
    new Uint8Array([0x00]),
    hexToBytes(compress(nextEphemeral)),
    widened.subarray(shift, shift + ROUTING_INFO_SIZE),
    nextHmac
  );

  return {
    payload: bytesToHex(payload),
    sharedSecret: bytesToHex(sharedSecret),
    isFinal: nextHmac.every((b) => b === 0),
    nextOnion: bytesToHex(nextOnion),
  };
}

/** The generator point, re-exported so callers need not reach into the curve module. */
export { G };

/**
 * BOLT #4's own published onion test vector, transcribed so the browser
 * can rebuild it without a network fetch.
 *
 * sphinx.spec.ts re-reads bolt04/onion-test.json out of the PINNED
 * specification and fails if anything here has drifted, so the packet a
 * reader reproduces on the page is provably the specification's own.
 */
export const ONION_VECTOR = {
  sessionKey: '4141414141414141414141414141414141414141414141414141414141414141',
  associatedData: '4242424242424242424242424242424242424242424242424242424242424242',
  hops: [
    {
      nodeId: '02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
      payload:
        '1202023a98040205dc06080000000000000001',
    },
    {
      nodeId: '0324653eac434488002cc06bbfb7f10fe18991e35f9fe4302dbea6d2353dc0ab1c',
      payload:
        '52020236b00402057806080000000000000002fd02013c0102030405060708090a0b0c0d0e0f0102030405060708090a0b0c0d0e0f0102030405060708090a0b0c0d0e0f0102030405060708090a0b0c0d0e0f',
    },
    {
      nodeId: '027f31ebc5462c1fdce1b737ecff52d37d75dea43ce11c74d25aa297165faa2007',
      payload:
        '12020230d4040204e206080000000000000003',
    },
    {
      nodeId: '032c0b7cf95324a07d05398b240174dc0c2be444d96b159aa6c7f7b1e668680991',
      payload:
        '1202022710040203e806080000000000000004',
    },
    {
      nodeId: '02edabbd16b41c8371b92ef2f04c1185b4f03b6dcd52ba9b78d9d7c89c8f221145',
      payload:
        'fd011002022710040203e8082224a33562c54507a9334e79f0dc4f17d407e6d7c61f0e2f3d0d38599502f617042710fd012de02a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a',
    },
  ],
  onion:
    '0002eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619f7f3416a5aa36dc7eeb3ec6d421e9615471ab870a33ac07fa5d5a51df0a8823aabe3fea3f90d387529d4f72837f9e687230371ccd8d263072206dbed0234f6505e21e282abd8c0e4f5b9ff8042800bbab065036eadd0149b37f27dde664725a49866e052e809d2b0198ab9610faa656bbf4ec516763a59f8f42c171b179166ba38958d4f51b39b3e98706e2d14a2dafd6a5df808093abfca5aeaaca16eded5db7d21fb0294dd1a163edf0fb445d5c8d7d688d6dd9c541762bf5a5123bf9939d957fe648416e88f1b0928bfa034982b22548e1a4d922690eecf546275afb233acf4323974680779f1a964cfe687456035cc0fba8a5428430b390f0057b6d1fe9a8875bfa89693eeb838ce59f09d207a503ee6f6299c92d6361bc335fcbf9b5cd44747aadce2ce6069cfdc3d671daef9f8ae590cf93d957c9e873e9a1bc62d9640dc8fc39c14902d49a1c80239b6c5b7fd91d05878cbf5ffc7db2569f47c43d6c0d27c438abff276e87364deb8858a37e5a62c446af95d8b786eaf0b5fcf78d98b41496794f8dcaac4eef34b2acfb94c7e8c32a9e9866a8fa0b6f2a06f00a1ccde569f97eec05c803ba7500acc96691d8898d73d8e6a47b8f43c3d5de74458d20eda61474c426359677001fbd75a74d7d5db6cb4feb83122f133206203e4e2d293f838bf8c8b3a29acb321315100b87e80e0edb272ee80fda944e3fb6084ed4d7f7c7d21c69d9da43d31a90b70693f9b0cc3eac74c11ab8ff655905688916cfa4ef0bd04135f2e50b7c689a21d04e8e981e74c6058188b9b1f9dfc3eec6838e9ffbcf22ce738d8a177c19318dffef090cee67e12de1a3e2a39f61247547ba5257489cbc11d7d91ed34617fcc42f7a9da2e3cf31a94a210a1018143173913c38f60e62b24bf0d7518f38b5bab3e6a1f8aeb35e31d6442c8abb5178efc892d2e787d79c6ad9e2fc271792983fa9955ac4d1d84a36c024071bc6e431b625519d556af38185601f70e29035ea6a09c8b676c9d88cf7e05e0f17098b584c4168735940263f940033a220f40be4c85344128b14beb9e75696db37014107801a59b13e89cd9d2258c169d523be6d31552c44c82ff4bb18ec9f099f3bf0e5b1bb2ba9a87d7e26f98d294927b600b5529c47e04d98956677cbcee8fa2b60f49776d8b8c367465b7c626da53700684fb6c918ead0eab8360e4f60edd25b4f43816a75ecf70f909301825b512469f8389d79402311d8aecb7b3ef8599e79485a4388d87744d899f7c47ee644361e17040a7958c8911be6f463ab6a9b2afacd688ec55ef517b38f1339efc54487232798bb25522ff4572ff68567fe830f92f7b8113efce3e98c3fffbaedce4fd8b50e41da97c0c08e423a72689cc68e68f752a5e3a9003e64e35c957ca2e1c48bb6f64b05f56b70b575ad2f278d57850a7ad568c24a4d32a3d74b29f03dc125488bc7c637da582357f40b0a52d16b3b40bb2c2315d03360bc24209e20972c200566bcf3bbe5c5b0aedd83132a8a4d5b4242ba370b6d67d9b67eb01052d132c7866b9cb502e44796d9d356e4e3cb47cc527322cd24976fe7c9257a2864151a38e568ef7a79f10d6ef27cc04ce382347a2488b1f404fdbf407fe1ca1c9d0d5649e34800e25e18951c98cae9f43555eef65fee1ea8f15828807366c3b612cd5753bf9fb8fced08855f742cddd6f765f74254f03186683d646e6f09ac2805586c7cf11998357cafc5df3f285329366f475130c928b2dceba4aa383758e7a9d20705c4bb9db619e2992f608a1ba65db254bb389468741d0502e2588aeb54390ac600c19af5c8e61383fc1bebe0029e4474051e4ef908828db9cca13277ef65db3fd47ccc2179126aaefb627719f421e20',
  nodeKeys: [
    '4141414141414141414141414141414141414141414141414141414141414141',
    '4242424242424242424242424242424242424242424242424242424242424242',
    '4343434343434343434343434343434343434343434343434343434343434343',
    '4444444444444444444444444444444444444444444444444444444444444444',
    '4545454545454545454545454545454545454545454545454545454545454545',
  ],
} as const;
