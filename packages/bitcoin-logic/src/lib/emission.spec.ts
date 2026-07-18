import { describe, expect, it } from 'vitest';
import { COIN, MAX_MONEY } from './constants.js';
import {
  computeEras,
  getBlockSubsidy,
  supplyAtHeight,
  supplyThroughBlock,
  totalSupply,
} from './emission.js';
import { btcToSats, satsToBtc } from './format.js';

/**
 * These tests ARE the product promise: "don't trust, verify" runs in CI.
 * The expected values are the famous, independently-checkable facts about
 * Bitcoin's emission schedule.
 */
describe('getBlockSubsidy (translation of validation.cpp:1846)', () => {
  it('starts at 50 BTC for the genesis era', () => {
    expect(getBlockSubsidy(0)).toBe(50n * COIN);
    expect(getBlockSubsidy(209_999)).toBe(50n * COIN);
  });

  it('halves at each 210,000-block boundary', () => {
    expect(getBlockSubsidy(210_000)).toBe(25n * COIN);
    expect(getBlockSubsidy(420_000)).toBe(1_250_000_000n); // 12.5 BTC
    expect(getBlockSubsidy(840_000)).toBe(312_500_000n); // 3.125 BTC (April 2024 halving)
  });

  it('drops to exactly 1 satoshi in era 33, then zero forever', () => {
    expect(getBlockSubsidy(32 * 210_000)).toBe(1n);
    expect(getBlockSubsidy(33 * 210_000)).toBe(0n);
    expect(getBlockSubsidy(64 * 210_000)).toBe(0n);
    expect(getBlockSubsidy(100_000_000)).toBe(0n);
  });
});

describe('the 21 million cap', () => {
  it('has exactly 33 eras with a non-zero reward', () => {
    expect(computeEras()).toHaveLength(33);
  });

  it('mints its last satoshi at block 6,929,999', () => {
    const eras = computeEras();
    expect(eras[eras.length - 1].endHeight).toBe(6_929_999);
  });

  it('sums to exactly 2,099,999,997,690,000 satoshis — under 21M BTC, forever', () => {
    const total = totalSupply();
    expect(total).toBe(2_099_999_997_690_000n);
    expect(total < MAX_MONEY).toBe(true);
    expect(satsToBtc(total, 4)).toBe('20,999,999.9769');
  });
});

describe('supplyAtHeight', () => {
  it('is zero before any blocks', () => {
    expect(supplyAtHeight(0)).toBe(0n);
  });

  it('interpolates exactly within an era', () => {
    expect(supplyAtHeight(1)).toBe(50n * COIN);
    expect(supplyAtHeight(210_000)).toBe(10_500_000n * COIN);
    expect(supplyAtHeight(210_001)).toBe(10_500_000n * COIN + 25n * COIN);
  });

  it('caps at the total supply after the final era', () => {
    expect(supplyAtHeight(7_000_000)).toBe(totalSupply());
  });
});

describe('supplyThroughBlock (the gettxoutsetinfo comparison)', () => {
  it('is 50 BTC once the genesis block is connected', () => {
    expect(supplyThroughBlock(0)).toBe(50n * COIN);
  });

  it('is exactly 10,500,000 BTC through the last block of era 1', () => {
    expect(supplyThroughBlock(209_999)).toBe(10_500_000n * COIN);
  });

  it('is exactly 19,687,500 BTC through the last 6.25-BTC block (839,999)', () => {
    expect(supplyThroughBlock(839_999)).toBe(19_687_500n * COIN);
  });

  it('reaches the full total at the final subsidy block, 6,929,999', () => {
    expect(supplyThroughBlock(6_929_999)).toBe(totalSupply());
    expect(supplyThroughBlock(6_929_998)).toBe(totalSupply() - 1n);
  });
});

describe('satsToBtc (exact integer formatting)', () => {
  it('formats whole and fractional amounts', () => {
    expect(satsToBtc(0n)).toBe('0');
    expect(satsToBtc(1n)).toBe('0.00000001');
    expect(satsToBtc(50n * COIN)).toBe('50');
    expect(satsToBtc(2_099_999_997_690_000n)).toBe('20,999,999.9769');
  });
});

describe('btcToSats (exact parsing of node output)', () => {
  it('parses whole, fractional, and comma-grouped amounts', () => {
    expect(btcToSats('50')).toBe(50n * COIN);
    expect(btcToSats('0.00000001')).toBe(1n);
    expect(btcToSats('20,999,999.9769')).toBe(2_099_999_997_690_000n);
    expect(btcToSats(' 19994825.30930052 ')).toBe(1_999_482_530_930_052n);
  });

  it('rejects malformed amounts', () => {
    expect(btcToSats('')).toBeNull();
    expect(btcToSats('21e6')).toBeNull();
    expect(btcToSats('1.123456789')).toBeNull();
    expect(btcToSats('-5')).toBeNull();
  });
});
