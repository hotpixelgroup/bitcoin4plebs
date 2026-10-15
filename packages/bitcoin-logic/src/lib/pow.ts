/**
 * Proof-of-work math, translated from src/pow.cpp at the pinned commit.
 * Exact BigInt arithmetic throughout.
 */

/** The compact difficulty bits of the genesis block (and Bitcoin's easiest-ever target). */
export const GENESIS_BITS = 0x1d00ffff;

/** The genesis block's hash — note the leading zeros. */
export const GENESIS_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

/**
 * Decode Bitcoin's "compact bits" encoding into the full 256-bit target —
 * the same expansion `arith_uint256::SetCompact` performs inside
 * DeriveTarget (src/pow.cpp:146).
 */
export function bitsToTarget(bits: number): bigint {
  if (!Number.isInteger(bits) || bits < 0 || bits > 0xffffffff)
    throw new RangeError('compact target must be uint32');
  const exponent = bits >>> 24;
  const word = bits & 0x007fffff;
  const overflow =
    word !== 0 &&
    (exponent > 34 ||
      (word > 0xff && exponent > 33) ||
      (word > 0xffff && exponent > 32));
  if ((word !== 0 && (bits & 0x00800000) !== 0) || overflow)
    throw new RangeError('negative or overflowing compact target');
  const target =
    exponent <= 3
      ? BigInt(word) >> (8n * BigInt(3 - exponent))
      : BigInt(word) << (8n * BigInt(exponent - 3));
  if (target <= 0n) throw new RangeError('zero target');
  return target;
}

/**
 * The whole rule of mining, from CheckProofOfWorkImpl (src/pow.cpp:167):
 * the block hash, read as a 256-bit number, must not exceed the target.
 */
/** Display-order big-endian hash comparison only; does not check expected nBits or network powLimit. */
export function hashMeetsTarget(hashHex: string, target: bigint): boolean {
  if (
    !/^[0-9a-fA-F]{64}$/.test(hashHex) ||
    target <= 0n ||
    target >= 1n << 256n
  )
    return false;
  return BigInt('0x' + hashHex) <= target;
}

/** A practice target: all hashes with at least `zeroBits` leading zero bits. */
export function targetForZeroBits(zeroBits: number): bigint {
  if (!Number.isInteger(zeroBits) || zeroBits < 0 || zeroBits > 255)
    throw new RangeError('zeroBits must be 0–255');
  return (1n << (256n - BigInt(zeroBits))) - 1n;
}

/** Count leading zero bits of a 256-bit hash hex string (for display). */
export function leadingZeroBits(hashHex: string): number {
  const value = BigInt('0x' + hashHex);
  if (value === 0n) return 256;
  return 256 - value.toString(2).length;
}

/**
 * Bitcoin's hash function for blocks: SHA-256 applied twice.
 * Uses the browser/Node WebCrypto implementation.
 */
export async function doubleSha256Hex(
  input: string | Uint8Array,
): Promise<string> {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const once = await crypto.subtle.digest(
    'SHA-256',
    bytes as Uint8Array<ArrayBuffer>,
  );
  const twice = await crypto.subtle.digest('SHA-256', once);
  return Array.from(new Uint8Array(twice), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
