import { BIP39_WORDLIST_EN } from './bip39-wordlist.js';

/**
 * BIP-39 mnemonics, implemented exactly as the pinned BIP text specifies
 * (bip-0039.mediawiki, "Generating the mnemonic" and "From mnemonic to
 * seed"): entropy of ENT bits, a checksum of the first ENT/32 bits of its
 * SHA-256, the concatenation split into 11-bit indexes into the 2,048-word
 * list, and a seed derived with PBKDF2-HMAC-SHA512, 2,048 iterations,
 * salt "mnemonic" + passphrase. All hashing uses the browser's WebCrypto,
 * so nothing about a phrase ever leaves the reader's machine.
 */

export { BIP39_WORDLIST_EN };

/** Allowed entropy sizes in bits (ENT), per the BIP's table. */
export const BIP39_ENT_SIZES = [128, 160, 192, 224, 256] as const;

const subtle = () => globalThis.crypto.subtle;

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await subtle().digest('SHA-256', bytes.slice().buffer));
}

/** Big-endian bit reader over a byte array. */
function bitAt(bytes: Uint8Array, i: number): number {
  return (bytes[i >> 3] >> (7 - (i % 8))) & 1;
}

/** entropy (16-32 bytes) -> mnemonic words, per "Generating the mnemonic". */
export async function entropyToMnemonic(entropy: Uint8Array): Promise<string[]> {
  const ent = entropy.length * 8;
  if (!BIP39_ENT_SIZES.includes(ent as (typeof BIP39_ENT_SIZES)[number])) {
    throw new Error(`entropy must be one of ${BIP39_ENT_SIZES.join('/')} bits, got ${ent}`);
  }
  const cs = ent / 32;
  const hash = await sha256(entropy);
  const words: string[] = [];
  for (let w = 0; w < (ent + cs) / 11; w++) {
    let index = 0;
    for (let b = 0; b < 11; b++) {
      const i = w * 11 + b;
      const bit = i < ent ? bitAt(entropy, i) : bitAt(hash, i - ent);
      index = (index << 1) | bit;
    }
    words.push(BIP39_WORDLIST_EN[index]);
  }
  return words;
}

/**
 * Recompute the checksum from the words, per the BIP's own instruction that
 * "software must compute a checksum ... and issue a warning if it is
 * invalid". Returns false for unknown words, bad lengths, or a checksum
 * mismatch (e.g. one word swapped or mistyped).
 */
export async function validateMnemonic(words: string[]): Promise<boolean> {
  const ms = words.length;
  if (![12, 15, 18, 21, 24].includes(ms)) return false;
  const indexes: number[] = [];
  for (const word of words) {
    const index = BIP39_WORDLIST_EN.indexOf(word);
    if (index === -1) return false;
    indexes.push(index);
  }
  const totalBits = ms * 11;
  const ent = (totalBits * 32) / 33;
  const cs = totalBits - ent;
  const entropy = new Uint8Array(ent / 8);
  for (let i = 0; i < ent; i++) {
    const bit = (indexes[Math.floor(i / 11)] >> (10 - (i % 11))) & 1;
    entropy[i >> 3] |= bit << (7 - (i % 8));
  }
  const hash = await sha256(entropy);
  for (let i = 0; i < cs; i++) {
    const expected = bitAt(hash, i);
    const j = ent + i;
    const actual = (indexes[Math.floor(j / 11)] >> (10 - (j % 11))) & 1;
    if (actual !== expected) return false;
  }
  return true;
}

/** mnemonic + optional passphrase -> 64-byte seed, per "From mnemonic to seed". */
export async function mnemonicToSeed(words: string[], passphrase = ''): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const password = encoder.encode(words.join(' ').normalize('NFKD'));
  const salt = encoder.encode(('mnemonic' + passphrase).normalize('NFKD'));
  const key = await subtle().importKey('raw', password.slice().buffer, 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', hash: 'SHA-512', salt: salt.slice().buffer, iterations: 2048 },
    key,
    512
  );
  return new Uint8Array(bits);
}

/** Hex helper for displaying seeds. */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
