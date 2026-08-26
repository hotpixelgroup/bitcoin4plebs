/**
 * ChaCha20 (RFC 8439), the stream cipher Lightning uses to obfuscate onion
 * payloads. Hand-rolled for the same reason as the curve math: the browser
 * gives you AES and SHA for free, but not this, and a black box would break
 * the promise that you can read everything that matters.
 *
 * A stream cipher is simpler than it sounds. It turns a key into an endless
 * deterministic river of bytes; you XOR your data with the river to hide it,
 * and XOR again with the same river to get it back. BOLT #4 uses it purely
 * as that river, "generate N pseudo-random bytes from this key".
 */

const ROUNDS = 20;

/** Rotate a 32-bit word left, the one operation that does the mixing. */
function rotateLeft(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

/**
 * The quarter-round: four words in, thoroughly stirred, four words out.
 * Twenty rounds of this over a 16-word state is the whole cipher.
 */
function quarterRound(state: Uint32Array, a: number, b: number, c: number, d: number): void {
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotateLeft(state[d] ^ state[a], 16);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotateLeft(state[b] ^ state[c], 12);
  state[a] = (state[a] + state[b]) >>> 0;
  state[d] = rotateLeft(state[d] ^ state[a], 8);
  state[c] = (state[c] + state[d]) >>> 0;
  state[b] = rotateLeft(state[b] ^ state[c], 7);
}

/**
 * Produce `length` bytes of the keystream for this key and nonce, starting
 * at block counter 0. BOLT #4 always calls this with an all-zero nonce,
 * which is safe precisely because a key is never reused across packets.
 */
export function chacha20Stream(
  key: Uint8Array,
  nonce: Uint8Array,
  length: number
): Uint8Array<ArrayBuffer> {
  if (key.length !== 32) throw new Error('ChaCha20 key must be 32 bytes');
  if (nonce.length !== 12) throw new Error('ChaCha20 nonce must be 12 bytes');

  const keyView = new DataView(key.buffer, key.byteOffset, key.byteLength);
  const nonceView = new DataView(nonce.buffer, nonce.byteOffset, nonce.byteLength);
  const out = new Uint8Array(length);

  for (let counter = 0, offset = 0; offset < length; counter++, offset += 64) {
    // "expand 32-byte k": the four constant words every ChaCha state starts with.
    const initial = new Uint32Array(16);
    initial[0] = 0x61707865;
    initial[1] = 0x3320646e;
    initial[2] = 0x79622d32;
    initial[3] = 0x6b206574;
    for (let i = 0; i < 8; i++) initial[4 + i] = keyView.getUint32(i * 4, true);
    initial[12] = counter;
    for (let i = 0; i < 3; i++) initial[13 + i] = nonceView.getUint32(i * 4, true);

    const working = initial.slice();
    for (let i = 0; i < ROUNDS / 2; i++) {
      // Column rounds, then diagonal rounds.
      quarterRound(working, 0, 4, 8, 12);
      quarterRound(working, 1, 5, 9, 13);
      quarterRound(working, 2, 6, 10, 14);
      quarterRound(working, 3, 7, 11, 15);
      quarterRound(working, 0, 5, 10, 15);
      quarterRound(working, 1, 6, 11, 12);
      quarterRound(working, 2, 7, 8, 13);
      quarterRound(working, 3, 4, 9, 14);
    }

    // Add the original state back in: this is what makes it irreversible.
    const block = new Uint8Array(64);
    const blockView = new DataView(block.buffer);
    for (let i = 0; i < 16; i++) {
      blockView.setUint32(i * 4, (working[i] + initial[i]) >>> 0, true);
    }
    out.set(block.subarray(0, Math.min(64, length - offset)), offset);
  }

  return out;
}

/** The all-zero 96-bit nonce BOLT #4 uses everywhere. */
export const ZERO_NONCE = new Uint8Array(12);

/** BOLT #4's "pseudo-random byte stream": ChaCha20 over zeros, zero nonce. */
export function pseudoRandomStream(key: Uint8Array, length: number): Uint8Array<ArrayBuffer> {
  return chacha20Stream(key, ZERO_NONCE, length);
}

/** XOR `src` into `dst`, in place. The one operation obfuscation is made of. */
export function xorInto(dst: Uint8Array, src: Uint8Array): void {
  for (let i = 0; i < dst.length; i++) dst[i] ^= src[i];
}
