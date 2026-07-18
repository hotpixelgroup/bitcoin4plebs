import { describe, expect, it } from 'vitest';
import { COIN } from './constants.js';
import { computeEras, totalSupply } from './emission.js';
import {
  eraForHeight,
  estimateDateForHeight,
  estimateHeightAtTime,
  nextHalvingHeight,
} from './halving.js';
import { checkTransaction } from './tx-check.js';
import {
  AGE_OF_UNIVERSE_YEARS,
  expectedYearsToCrack,
  formatBigApprox,
  SECP256K1_ORDER,
} from './keyspace.js';

describe('parameterized emission (fork-yourself)', () => {
  it('keeps Bitcoin totals when called with defaults', () => {
    expect(totalSupply({})).toBe(2_099_999_997_690_000n);
    expect(computeEras({})).toHaveLength(33);
  });

  it('a shorter halving interval shrinks total supply proportionally', () => {
    // 100,000-block eras → 100000/210000 of the supply.
    expect(totalSupply({ halvingInterval: 100_000 })).toBe(
      (2_099_999_997_690_000n * 100_000n) / 210_000n
    );
  });

  it('doubling the initial subsidy roughly doubles supply (plus dust rounding)', () => {
    const doubled = totalSupply({ initialSubsidy: 100n * COIN });
    expect(doubled > 2n * 2_099_999_997_690_000n).toBe(true);
    expect(doubled < 42_000_000n * COIN).toBe(true);
  });
});

describe('halving clock', () => {
  it('era boundaries follow 210,000-block intervals', () => {
    expect(eraForHeight(0)).toBe(1);
    expect(eraForHeight(839_999)).toBe(4);
    expect(eraForHeight(840_000)).toBe(5);
    expect(nextHalvingHeight(840_000)).toBe(1_050_000);
    expect(nextHalvingHeight(839_999)).toBe(840_000);
  });

  it('anchors era 5 at the real April 2024 halving', () => {
    const date = estimateDateForHeight(840_000);
    expect(date.toISOString().slice(0, 10)).toBe('2024-04-20');
    // Round-trips through the inverse estimate.
    expect(estimateHeightAtTime(date.getTime())).toBe(840_000);
  });

  it('estimates the final subsidy block lands roughly in the 2140s', () => {
    const year = estimateDateForHeight(6_929_999).getUTCFullYear();
    expect(year).toBeGreaterThanOrEqual(2130);
    expect(year).toBeLessThanOrEqual(2150);
  });
});

describe('checkTransaction translation (tx_check.cpp)', () => {
  const spend = { txid: 'aa'.repeat(32), vout: 0 };

  it('accepts an ordinary transaction', () => {
    expect(
      checkTransaction({
        vin: [spend, { txid: 'bb'.repeat(32), vout: 1 }],
        vout: [{ value: 30n * COIN }, { value: 19n * COIN }],
      })
    ).toEqual({ ok: true });
  });

  it('rejects the CVE-2018-17144 duplicate-input attack with the real error string', () => {
    expect(
      checkTransaction({ vin: [spend, { ...spend }], vout: [{ value: 1n * COIN }] })
    ).toEqual({ ok: false, error: 'bad-txns-inputs-duplicate' });
  });

  it('rejects CVE-2010-5139-style inflation with the real error strings', () => {
    expect(
      checkTransaction({ vin: [spend], vout: [{ value: 22_000_000n * COIN }] })
    ).toEqual({ ok: false, error: 'bad-txns-vout-toolarge' });
    expect(
      checkTransaction({
        vin: [spend],
        vout: [{ value: 11_000_000n * COIN }, { value: 11_000_000n * COIN }],
      })
    ).toEqual({ ok: false, error: 'bad-txns-txouttotal-toolarge' });
  });

  it('rejects empty transactions', () => {
    expect(checkTransaction({ vin: [], vout: [{ value: 1n }] })).toEqual({
      ok: false,
      error: 'bad-txns-vin-empty',
    });
    expect(checkTransaction({ vin: [spend], vout: [] })).toEqual({
      ok: false,
      error: 'bad-txns-vout-empty',
    });
  });
});

describe('key-space math', () => {
  it('brute force at one trillion guesses/sec takes unimaginably longer than the universe has existed', () => {
    const years = expectedYearsToCrack(1_000_000_000_000n);
    expect(years > AGE_OF_UNIVERSE_YEARS * 10n ** 40n).toBe(true);
  });

  it('the key space matches the secp256k1 curve order', () => {
    expect(SECP256K1_ORDER.toString(16).startsWith('fffffffffffffffffffffffffffffffe')).toBe(true);
  });

  it('formats huge numbers for humans', () => {
    expect(formatBigApprox(123_456n)).toBe('123,456');
    expect(formatBigApprox(10n ** 60n)).toBe('1.00 × 10^60');
  });
});
