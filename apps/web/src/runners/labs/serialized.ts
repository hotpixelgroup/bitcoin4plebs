import {
  buildGenesisHeaderHex,
  doubleSha256Hex,
  hexToBytes,
  reverseHexBytes,
  uint32ToLeHex,
} from '@bitcoin4plebs/bitcoin-logic';
/** Same 80-byte layout as genesis. Merkle is display order; uint32 fields are LE. */
export function practiceHeader(
  merkle: string,
  nonce: number,
  bits = 0x2000ffff,
) {
  if (
    !/^[0-9a-f]{64}$/i.test(merkle) ||
    ![nonce, bits].every(
      (v) => Number.isInteger(v) && v >= 0 && v <= 0xffffffff,
    )
  )
    throw new Error('Invalid header field');
  const genesis = buildGenesisHeaderHex();
  return (
    genesis.slice(0, 72) +
    reverseHexBytes(merkle) +
    genesis.slice(136, 144) +
    uint32ToLeHex(bits) +
    uint32ToLeHex(nonce)
  );
}
export async function headerHash(hex: string) {
  if (!/^[0-9a-f]{160}$/i.test(hex))
    throw new Error('An 80-byte header is required');
  return reverseHexBytes(await doubleSha256Hex(hexToBytes(hex)));
}
