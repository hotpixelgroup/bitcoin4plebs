import { webcrypto } from 'node:crypto';
import { vi, expect, it } from 'vitest';
import {
  entropyToMnemonic,
  mnemonicToSeed,
  validateMnemonic,
} from '@bitcoin4plebs/bitcoin-logic';
import { substituteWord } from './substitute-word';
it('demonstrates both kinds of one-word backup mistake deterministically', async () => {
  vi.stubGlobal('crypto', webcrypto);
  try {
    for (const size of [16, 32]) {
      const original = await entropyToMnemonic(new Uint8Array(size));
      const invalid = await substituteWord(original, false);
      const different = await substituteWord(original, true);
      expect(await validateMnemonic(invalid)).toBe(false);
      expect(await validateMnemonic(different)).toBe(true);
      expect(different.slice(0, -1)).toEqual(original.slice(0, -1));
      expect(different.at(-1)).not.toBe(original.at(-1));
      expect(await mnemonicToSeed(different, '')).not.toEqual(
        await mnemonicToSeed(original, ''),
      );
    }
  } finally {
    vi.unstubAllGlobals();
  }
});
