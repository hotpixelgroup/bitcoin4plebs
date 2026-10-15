import {
  BIP39_WORDLIST_EN,
  validateMnemonic,
} from '@bitcoin4plebs/bitcoin-logic';
/** Deterministic public teaching examples, never recovery or correction advice. */
export async function substituteWord(
  original: string[],
  valid: boolean,
): Promise<string[]> {
  for (const word of BIP39_WORDLIST_EN) {
    if (word === original.at(-1)) continue;
    const candidate = [...original.slice(0, -1), word];
    if ((await validateMnemonic(candidate)) === valid) return candidate;
  }
  throw new Error('No teaching substitution found');
}
