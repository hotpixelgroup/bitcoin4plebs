import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INCREMENTAL_RELAY_FEE_PER_KVB,
  DEFAULT_MAX_MEMPOOL_BYTES,
  ROLLING_FEE_HALFLIFE,
  blockConnected,
  getMinFee,
  initialFeeFloor,
  trackPackageRemoved,
} from './fee-floor.js';

const FULL = DEFAULT_MAX_MEMPOOL_BYTES;

describe('fee floor (GetMinFee translation)', () => {
  it('starts at zero: an empty auction house has no floor price', () => {
    const floor = initialFeeFloor(0);
    expect(getMinFee(floor, { nowSeconds: 0, usageBytes: 0 }).feePerKvB).toBe(0);
  });

  it('eviction ratchets the floor up to the evicted rate, never down', () => {
    let floor = initialFeeFloor(0);
    floor = trackPackageRemoved(floor, 5_000);
    expect(floor.rollingMinimumFeeRate).toBe(5_000);
    floor = trackPackageRemoved(floor, 3_000);
    expect(floor.rollingMinimumFeeRate).toBe(5_000);
    floor = trackPackageRemoved(floor, 8_000);
    expect(floor.rollingMinimumFeeRate).toBe(8_000);
  });

  it('does not decay until a block arrives after the bump', () => {
    let floor = initialFeeFloor(0);
    floor = trackPackageRemoved(floor, 10_000);
    const later = getMinFee(floor, { nowSeconds: ROLLING_FEE_HALFLIFE, usageBytes: FULL });
    expect(later.feePerKvB).toBe(10_000);
  });

  it('halves every 12 hours while the mempool stays full', () => {
    let floor = initialFeeFloor(0);
    floor = trackPackageRemoved(floor, 10_000);
    floor = blockConnected(floor);
    const after = getMinFee(floor, { nowSeconds: ROLLING_FEE_HALFLIFE, usageBytes: FULL });
    expect(after.feePerKvB).toBe(5_000);
  });

  it('decays four times as fast once the queue drains below a quarter', () => {
    let floor = initialFeeFloor(0);
    floor = trackPackageRemoved(floor, 10_000);
    floor = blockConnected(floor);
    const after = getMinFee(floor, {
      nowSeconds: ROLLING_FEE_HALFLIFE / 4,
      usageBytes: FULL / 4 - 1,
    });
    expect(after.feePerKvB).toBe(5_000);
  });

  it('snaps to zero once it falls below half the incremental relay fee', () => {
    let floor = initialFeeFloor(0);
    floor = trackPackageRemoved(floor, DEFAULT_INCREMENTAL_RELAY_FEE_PER_KVB - 2);
    floor = blockConnected(floor);
    const after = getMinFee(floor, { nowSeconds: ROLLING_FEE_HALFLIFE, usageBytes: FULL });
    expect(after.feePerKvB).toBe(0);
    expect(after.floor.rollingMinimumFeeRate).toBe(0);
  });

  it('while active, never returns less than the incremental relay fee', () => {
    let floor = initialFeeFloor(0);
    floor = trackPackageRemoved(floor, 120);
    floor = blockConnected(floor);
    // One halflife: 120 -> 60, which is >= 50 (no snap) but < 100, so the
    // returned floor is the incremental relay fee itself.
    const after = getMinFee(floor, { nowSeconds: ROLLING_FEE_HALFLIFE, usageBytes: FULL });
    expect(after.feePerKvB).toBe(DEFAULT_INCREMENTAL_RELAY_FEE_PER_KVB);
  });

  it('skips the decay math when called within ten seconds of the last update', () => {
    let floor = initialFeeFloor(0);
    floor = trackPackageRemoved(floor, 10_000);
    floor = blockConnected(floor);
    const after = getMinFee(floor, { nowSeconds: 9, usageBytes: FULL });
    expect(after.feePerKvB).toBe(10_000);
  });
});
