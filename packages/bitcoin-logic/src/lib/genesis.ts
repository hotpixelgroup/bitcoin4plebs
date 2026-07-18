import { GENESIS_BITS, doubleSha256Hex } from './pow.js';

/**
 * The genesis block, mirrored 1:1 from src/kernel/chainparams.cpp at the
 * pinned commit. These four numbers plus two well-known hashes are ALL it
 * takes to reconstruct block zero's 80-byte header and recompute the most
 * famous hash in Bitcoin — which genesis.spec.ts does on every CI run.
 */

/** Genesis timestamp — chainparams.cpp:158 (1231006505 = 2009-01-03 18:15:05 UTC). */
export const GENESIS_TIME = 1231006505;

/** The winning nonce Satoshi found — chainparams.cpp:158. */
export const GENESIS_NONCE = 2083236893;

/** Genesis block version — chainparams.cpp:158. */
export const GENESIS_VERSION = 1;

/** Merkle root of the single genesis transaction, display order — chainparams.cpp:161. */
export const GENESIS_MERKLE_ROOT = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

/**
 * The genesis coinbase scriptSig, byte for byte, as printed in the
 * developers' own comment at chainparams.cpp:65. Its final push is 69
 * ASCII bytes: the front page of The Times, 3 January 2009.
 */
export const GENESIS_COINBASE_SCRIPTSIG_HEX =
  '04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73';

/** Serialize an unsigned 32-bit number the way Bitcoin does: 4 bytes, little-endian. */
export function uint32ToLeHex(value: number): string {
  let hex = '';
  for (let i = 0; i < 4; i++) {
    hex += ((value >>> (8 * i)) & 0xff).toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Flip a hex string's byte order. Bitcoin serializes hashes little-endian
 * but displays them big-endian — this one flip is why the famous genesis
 * hash "starts" with zeros on explorers while the raw digest ends with them.
 */
export function reverseHexBytes(hex: string): string {
  const pairs = hex.match(/../g) ?? [];
  return pairs.reverse().join('');
}

/** Decode a hex string into raw bytes. */
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Assemble the genesis block's 80-byte header exactly as CreateGenesisBlock
 * does (chainparams.cpp:47-54): version, previous-block hash (all zeros —
 * there is nothing before this), merkle root, time, bits, nonce.
 */
export function buildGenesisHeaderHex(): string {
  return (
    uint32ToLeHex(GENESIS_VERSION) +
    '00'.repeat(32) +
    reverseHexBytes(GENESIS_MERKLE_ROOT) +
    uint32ToLeHex(GENESIS_TIME) +
    uint32ToLeHex(GENESIS_BITS) +
    uint32ToLeHex(GENESIS_NONCE)
  );
}

/**
 * Double SHA-256 the assembled header and flip to display order — the
 * same computation `genesis.GetHash()` performs before the startup assert
 * at chainparams.cpp:160. Must equal {@link import('./pow.js').GENESIS_HASH}.
 */
export async function computeGenesisHash(): Promise<string> {
  const digest = await doubleSha256Hex(hexToBytes(buildGenesisHeaderHex()));
  return reverseHexBytes(digest);
}

/**
 * Split a script's raw pushes (opcodes 0x01-0x4b push that many bytes).
 * The genesis coinbase is three pushes: the difficulty bits, the number 4,
 * and 69 bytes of newspaper.
 */
export function decodeScriptPushes(scriptHex: string): string[] {
  const pushes: string[] = [];
  let i = 0;
  while (i + 2 <= scriptHex.length) {
    const op = parseInt(scriptHex.slice(i, i + 2), 16);
    i += 2;
    if (op >= 1 && op <= 75) {
      pushes.push(scriptHex.slice(i, i + op * 2));
      i += op * 2;
    }
  }
  return pushes;
}

/** Decode the human-readable message from a coinbase scriptSig: its last push, as ASCII. */
export function decodeCoinbaseMessage(scriptSigHex: string): string {
  const pushes = decodeScriptPushes(scriptSigHex);
  const last = pushes[pushes.length - 1] ?? '';
  return new TextDecoder().decode(hexToBytes(last));
}
