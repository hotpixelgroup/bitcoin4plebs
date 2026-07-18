import { describe, expect, it } from 'vitest';
import {
  bitsToTarget,
  doubleSha256Hex,
  GENESIS_BITS,
  GENESIS_HASH,
  hashMeetsTarget,
  leadingZeroBits,
  targetForZeroBits,
} from './pow.js';
import { estimateConfirmation, feerateBands, generateMempool } from './fee-market.js';

describe('proof-of-work math (pow.cpp translation)', () => {
  it('decodes the genesis compact bits to the famous easiest target', () => {
    expect(bitsToTarget(GENESIS_BITS)).toBe(
      0xffff0000000000000000000000000000000000000000000000000000n
    );
  });

  it('the real genesis block hash satisfies the rule from CheckProofOfWorkImpl', () => {
    expect(hashMeetsTarget(GENESIS_HASH, bitsToTarget(GENESIS_BITS))).toBe(true);
    // Flip the hash to something bigger and it fails.
    expect(hashMeetsTarget('ff' + GENESIS_HASH.slice(2), bitsToTarget(GENESIS_BITS))).toBe(false);
  });

  it('double SHA-256 matches the published test vector', async () => {
    expect(await doubleSha256Hex('hello')).toBe(
      '9595c9df90075148eb06860365df33584b75bff782a510c6cd4883a419833d50'
    );
  });

  it('leading zero bits and practice targets agree', () => {
    expect(leadingZeroBits(GENESIS_HASH)).toBeGreaterThanOrEqual(32);
    const t = targetForZeroBits(16);
    expect(hashMeetsTarget('0000' + 'ff'.repeat(30), t)).toBe(true);
    expect(hashMeetsTarget('0001' + 'ff'.repeat(30), t)).toBe(false);
  });
});

describe('fee auction model (miner.cpp:301 mechanism)', () => {
  it('is deterministic for a given seed', () => {
    expect(estimateConfirmation(10)).toEqual(estimateConfirmation(10));
    expect(generateMempool(7)).toEqual(generateMempool(7));
  });

  it('paying more never confirms later', () => {
    let prev = estimateConfirmation(1).blocks;
    for (const fee of [2, 5, 10, 20, 50, 120]) {
      const now = estimateConfirmation(fee).blocks;
      expect(now).toBeLessThanOrEqual(prev);
      prev = now;
    }
  });

  it('a top-of-market fee confirms in the next block; a 1 sat/vB fee waits', () => {
    expect(estimateConfirmation(150).blocks).toBe(1);
    expect(estimateConfirmation(1).blocks).toBeGreaterThan(1);
  });

  it('bands account for the whole mempool', () => {
    const pool = generateMempool(42);
    const total = feerateBands(pool).reduce((s, b) => s + b.vbytes, 0);
    expect(total).toBe(pool.reduce((s, t) => s + t.vsize, 0));
  });
});
