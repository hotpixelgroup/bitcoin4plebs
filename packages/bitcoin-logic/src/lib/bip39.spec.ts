import { pbkdf2Sync } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BIP39_WORDLIST_EN,
  bytesToHex,
  entropyToMnemonic,
  mnemonicToSeed,
  validateMnemonic,
} from './bip39.js';

const BIPS_SRC = process.env['BIPS_SRC'];
const bipsAvailable = !!BIPS_SRC && existsSync(BIPS_SRC);

describe('the BIP-39 wordlist', () => {
  it('has 2,048 unique words from abandon to zoo', () => {
    expect(BIP39_WORDLIST_EN.length).toBe(2048);
    expect(new Set(BIP39_WORDLIST_EN).size).toBe(2048);
    expect(BIP39_WORDLIST_EN[0]).toBe('abandon');
    expect(BIP39_WORDLIST_EN[2047]).toBe('zoo');
  });

  it.skipIf(!bipsAvailable)('matches the pinned bips english.txt letter for letter', () => {
    const official = readFileSync(join(BIPS_SRC as string, 'bip-0039/english.txt'), 'utf8')
      .trim()
      .split('\n');
    expect(BIP39_WORDLIST_EN.length).toBe(official.length);
    official.forEach((word, i) => expect(BIP39_WORDLIST_EN[i], `index ${i}`).toBe(word));
  });
});

describe('entropy to mnemonic (the generation algorithm)', () => {
  it('produces the famous all-zero test phrase: abandon ×11, about', async () => {
    // The best-known BIP-39 vector: 128 zero bits. Eleven "abandon" (index
    // 0) and a final word carrying the 4 checksum bits of SHA-256(0x00×16).
    const words = await entropyToMnemonic(new Uint8Array(16));
    expect(words.join(' ')).toBe(
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
    );
  });

  it('maps ENT sizes to the word counts in the BIP table', async () => {
    for (const [bytes, ms] of [
      [16, 12],
      [20, 15],
      [24, 18],
      [28, 21],
      [32, 24],
    ] as const) {
      const words = await entropyToMnemonic(new Uint8Array(bytes));
      expect(words.length).toBe(ms);
    }
  });

  it('rejects entropy sizes the BIP does not allow', async () => {
    await expect(entropyToMnemonic(new Uint8Array(15))).rejects.toThrow(/128\/160\/192\/224\/256/);
  });
});

describe('checksum validation (typo protection)', () => {
  it('round-trips: every generated mnemonic validates', async () => {
    for (const fill of [0x00, 0x7f, 0xff, 0x42]) {
      for (const bytes of [16, 32]) {
        const words = await entropyToMnemonic(new Uint8Array(bytes).fill(fill));
        expect(await validateMnemonic(words)).toBe(true);
      }
    }
  });

  it('catches a single swapped word', async () => {
    const words = await entropyToMnemonic(new Uint8Array(16).fill(0x42));
    const tampered = [...words];
    tampered[3] = tampered[3] === 'zoo' ? 'zebra' : 'zoo';
    expect(await validateMnemonic(tampered)).toBe(false);
  });

  it('rejects unknown words and wrong lengths', async () => {
    const words = await entropyToMnemonic(new Uint8Array(16));
    expect(await validateMnemonic([...words.slice(0, 11), 'bitcoinplebs'])).toBe(false);
    expect(await validateMnemonic(words.slice(0, 11))).toBe(false);
  });
});

describe('mnemonic to seed (PBKDF2-HMAC-SHA512)', () => {
  it('agrees with an independent implementation (node:crypto) with and without a passphrase', async () => {
    const words = await entropyToMnemonic(new Uint8Array(16).fill(0x7f));
    for (const passphrase of ['', 'TREZOR']) {
      const ours = await mnemonicToSeed(words, passphrase);
      const reference = pbkdf2Sync(
        words.join(' ').normalize('NFKD'),
        ('mnemonic' + passphrase).normalize('NFKD'),
        2048,
        64,
        'sha512'
      );
      expect(ours.length).toBe(64);
      expect(bytesToHex(ours)).toBe(reference.toString('hex'));
    }
  });

  it('every passphrase yields a different, valid seed (plausible deniability)', async () => {
    const words = await entropyToMnemonic(new Uint8Array(16).fill(0x42));
    const a = await mnemonicToSeed(words, '');
    const b = await mnemonicToSeed(words, 'correct horse');
    expect(bytesToHex(a)).not.toBe(bytesToHex(b));
  });
});
