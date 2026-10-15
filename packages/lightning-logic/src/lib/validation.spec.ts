import { expect, it } from 'vitest';
import { decodeBech32, encodeBech32 } from '@bitcoin4plebs/bitcoin-logic';
import { BOLT11_EXAMPLES, decodeInvoice } from './bolt11.js';
import { decompress, P } from './secp256k1.js';
import { ONION_VECTOR, peelOnion } from './sphinx.js';
it('rejects checksum-valid unsupported invoice encodings, precision, and malformed fields', () => {
  const original = decodeBech32(BOLT11_EXAMPLES[1].invoice, {
    maxLength: Number.MAX_SAFE_INTEGER,
  });
  if (!original.ok) throw new Error('Broken test fixture');
  const { hrp, payload } = original;
  expect(decodeInvoice(encodeBech32(hrp, payload, 'bech32m')).ok).toBe(false);
  expect(decodeInvoice(encodeBech32('lnbc1p', payload, 'bech32')).ok).toBe(
    false,
  );
  const signature = payload.slice(-104);
  // 7 timestamp groups + incomplete two-group field header + full signature.
  expect(
    decodeInvoice(
      encodeBech32(hrp, [...payload.slice(0, 7), 1, 1, ...signature], 'bech32'),
    ).ok,
  ).toBe(false);
  // p tag, declared length 1, data q: must be 52 groups.
  expect(
    decodeInvoice(
      encodeBech32(
        hrp,
        [...payload.slice(0, 7), 1, 0, 1, 0, ...signature],
        'bech32',
      ),
    ).ok,
  ).toBe(false);
  const badRecovery = [...payload];
  badRecovery[badRecovery.length - 1] = 31;
  expect(decodeInvoice(encodeBech32(hrp, badRecovery, 'bech32')).ok).toBe(
    false,
  );
});
it('rejects invalid compressed points and unsupported onion versions', async () => {
  expect(() => decompress('02ff')).toThrow(/encoding/);
  expect(() => decompress(`02${P.toString(16)}`)).toThrow(/outside field/);
  expect(() => decompress(`02${'00'.repeat(32)}`)).toThrow(/not on/);
  await expect(
    peelOnion(
      `01${ONION_VECTOR.onion.slice(2)}`,
      ONION_VECTOR.nodeKeys[0],
      ONION_VECTOR.associatedData,
    ),
  ).rejects.toThrow(/version/);
});
