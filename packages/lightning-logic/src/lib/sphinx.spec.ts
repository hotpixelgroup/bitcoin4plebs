import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes } from '@bitcoin4plebs/bitcoin-logic';
import { chacha20Stream, ZERO_NONCE } from './chacha20.js';
import { add, compress, decompress, G, multiply, N, publicKey } from './secp256k1.js';
import { constructOnion, ONION_PACKET_SIZE, ONION_VECTOR, peelOnion } from './sphinx.js';

/**
 * "Don't trust, verify" applied to our own cryptography.
 *
 * The Lightning specification ships machine-readable test vectors. That is
 * a stronger position than the Bitcoin site enjoys: we do not merely quote
 * the spec, we run OUR implementation against the SPEC'S OWN expected
 * output and require a byte-for-byte match.
 *
 * Point BOLTS_SRC at a lightning/bolts checkout at the pinned commit:
 *
 *   BOLTS_SRC=~/bolts npx nx test @bitcoin4plebs/lightning-logic
 *
 * Note what this proves. The onion only comes out byte-identical if the
 * hand-rolled secp256k1, the hand-rolled ChaCha20, the key derivation, the
 * blinding chain AND the filler accumulation are all exactly right. One
 * wrong bit anywhere and the packet diverges. There is no partial credit.
 */

const BOLTS_SRC = process.env['BOLTS_SRC'];
const boltsAvailable = !!BOLTS_SRC && existsSync(BOLTS_SRC);

describe('secp256k1', () => {
  it('has a generator point that is actually on the curve', () => {
    expect((G.y * G.y - G.x ** 3n - 7n) % (2n ** 256n - 2n ** 32n - 977n)).toBe(0n);
  });

  it('multiplying by one is the identity, and by the group order wraps to infinity', () => {
    expect(multiply(G, 1n)).toEqual(G);
    // (N-1)·G + G === N·G === the point at infinity.
    expect(add(multiply(G, N - 1n), G)).toBeNull();
  });

  it('round-trips through compressed serialization', () => {
    for (const k of [1n, 2n, 12345n, N - 1n]) {
      const point = publicKey(k);
      expect(decompress(compress(point))).toEqual(point);
    }
  });
});

describe('ChaCha20', () => {
  it('matches the RFC 8439 all-zero keystream block', () => {
    const stream = chacha20Stream(new Uint8Array(32), ZERO_NONCE, 64);
    expect(bytesToHex(stream)).toBe(
      '76b8e0ada0f13d90405d6ae55386bd28bdd219b8a08ded1aa836efcc8b770dc7' +
        'da41597c5157488d7724e03fb8d84a376a43b8f41518a11cc387b669b2ee6586'
    );
  });
});

describe('the BOLT vector check itself', () => {
  it('cannot be silently skipped in CI', () => {
    // Locally the vectors are optional (point BOLTS_SRC at a pinned
    // checkout). In CI the workflow fetches them, so their absence there
    // would mean this package's core integrity claim has stopped running.
    if (process.env['CI']) {
      expect(boltsAvailable, 'CI must set BOLTS_SRC to a lightning/bolts checkout').toBe(true);
    }
  });
});

interface OnionVector {
  comment: string;
  generate: {
    session_key: string;
    associated_data: string;
    hops: { pubkey: string; payload: string }[];
  };
  onion: string;
  decode: string[];
}

// Read lazily: vitest executes a suite body even when it is skipped, so a
// top-level read would break the whole file on a machine without the checkout.
let cached: OnionVector | undefined;
const loadVector = (): OnionVector =>
  (cached ??= JSON.parse(
    readFileSync(join(BOLTS_SRC as string, 'bolt04/onion-test.json'), 'utf8')
  ));

describe.skipIf(!boltsAvailable)("BOLT #4: the specification's own onion test vector", () => {
  it('has not drifted from the vector the browser rebuilds', () => {
    // The finale rebuilds the transcribed copy; this keeps it honest.
    const vector = loadVector();
    expect(ONION_VECTOR.sessionKey).toBe(vector.generate.session_key);
    expect(ONION_VECTOR.associatedData).toBe(vector.generate.associated_data);
    expect(ONION_VECTOR.onion).toBe(vector.onion);
    expect(ONION_VECTOR.nodeKeys).toEqual(vector.decode);
    expect(ONION_VECTOR.hops.map((h) => h.nodeId)).toEqual(
      vector.generate.hops.map((h) => h.pubkey)
    );
    expect(ONION_VECTOR.hops.map((h) => h.payload)).toEqual(
      vector.generate.hops.map((h) => h.payload)
    );
  });

  it('constructs the exact 1366-byte packet the spec expects', async () => {
    const vector = loadVector();
    const { onion } = await constructOnion({
      sessionKey: vector.generate.session_key,
      hops: vector.generate.hops.map((h) => ({ nodeId: h.pubkey, payload: h.payload })),
      associatedData: vector.generate.associated_data,
    });

    expect(onion.length / 2).toBe(ONION_PACKET_SIZE);
    expect(onion).toBe(vector.onion);
  });

  it('peels layer by layer, each hop recovering only its own payload', async () => {
    const vector = loadVector();
    let packet = vector.onion;
    const hops = vector.generate.hops;

    for (const [i, nodePrivateKey] of vector.decode.entries()) {
      const peeled = await peelOnion(packet, nodePrivateKey, vector.generate.associated_data);

      expect(peeled.payload, `hop ${i} payload`).toBe(hops[i].payload);
      // Only the last hop sees the all-zero HMAC that means "this is for you".
      expect(peeled.isFinal, `hop ${i} finality`).toBe(i === hops.length - 1);
      // Every forwarded packet is the same size as the one that arrived.
      expect(peeled.nextOnion.length / 2, `hop ${i} forwarded size`).toBe(ONION_PACKET_SIZE);

      packet = peeled.nextOnion;
    }
  });

  it('refuses a packet whose routing information was altered', async () => {
    // Flip one bit in the middle of the routing info and the HMAC must fail.
    const vector = loadVector();
    const bytes = hexToBytes(vector.onion);
    bytes[600] ^= 0x01;
    await expect(
      peelOnion(bytesToHex(bytes), vector.decode[0], vector.generate.associated_data)
    ).rejects.toThrow(/HMAC mismatch/);
  });

  it('refuses the right packet under the wrong associated data', async () => {
    const vector = loadVector();
    await expect(
      peelOnion(vector.onion, vector.decode[0], '00'.repeat(32))
    ).rejects.toThrow(/HMAC mismatch/);
  });
});
