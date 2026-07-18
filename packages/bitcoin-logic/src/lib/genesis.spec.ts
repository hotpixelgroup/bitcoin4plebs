import { describe, expect, it } from 'vitest';
import {
  GENESIS_COINBASE_SCRIPTSIG_HEX,
  buildGenesisHeaderHex,
  computeGenesisHash,
  decodeCoinbaseMessage,
  decodeScriptPushes,
  reverseHexBytes,
  uint32ToLeHex,
} from './genesis.js';
import { GENESIS_HASH } from './pow.js';

/**
 * The quest-08 promise, verified in CI: from the four numbers printed in
 * chainparams.cpp we reconstruct block zero's header, hash it with real
 * double SHA-256, and land on the most famous hash in Bitcoin.
 */
describe('the genesis block header', () => {
  it('serializes to exactly 80 bytes', () => {
    expect(buildGenesisHeaderHex()).toHaveLength(160);
  });

  it('double-SHA-256 hashes to the value asserted at chainparams.cpp:160', async () => {
    expect(await computeGenesisHash()).toBe(GENESIS_HASH);
  });

  it('writes integers little-endian, the way Bitcoin serializes them', () => {
    expect(uint32ToLeHex(1)).toBe('01000000');
    expect(uint32ToLeHex(1231006505)).toBe('29ab5f49');
    expect(reverseHexBytes('aabbcc')).toBe('ccbbaa');
    expect(reverseHexBytes(reverseHexBytes(GENESIS_HASH))).toBe(GENESIS_HASH);
  });
});

describe('the genesis coinbase message', () => {
  it('is three pushes: the difficulty bits, the number 4, and 69 bytes of newspaper', () => {
    const pushes = decodeScriptPushes(GENESIS_COINBASE_SCRIPTSIG_HEX);
    expect(pushes).toHaveLength(3);
    expect(pushes[0]).toBe('ffff001d'); // 0x1d00ffff, little-endian
    expect(pushes[1]).toBe('04');
    expect(pushes[2]).toHaveLength(69 * 2);
  });

  it("decodes to the front page of The Times, 3 January 2009", () => {
    expect(decodeCoinbaseMessage(GENESIS_COINBASE_SCRIPTSIG_HEX)).toBe(
      'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks'
    );
  });
});
