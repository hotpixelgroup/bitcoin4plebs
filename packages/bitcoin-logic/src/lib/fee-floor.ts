/**
 * The mempool's dynamic fee floor, translated 1:1 from Bitcoin Core's
 * CTxMemPool::GetMinFee and CTxMemPool::trackPackageRemoved
 * (src/txmempool.cpp:838-868 at the pinned commit).
 *
 * This is the auction house's thermostat. When the mempool overflows and
 * evicts a package, the floor jumps to that package's feerate plus one
 * increment: pay more than the loser, or you don't get a seat. From there
 * the floor decays exponentially, halving every 12 hours (faster once the
 * queue drains), until it falls below half the incremental relay fee and
 * snaps back to zero.
 *
 * Units follow Core's CFeeRate: satoshis per 1,000 virtual bytes ("per K").
 * Core stores the rolling rate as a C++ double, so this translation uses
 * JS numbers, which are the same 64-bit IEEE 754 doubles.
 */

/** Floor halving period in seconds — src/txmempool.h:212 (`ROLLING_FEE_HALFLIFE = 60 * 60 * 12`). */
export const ROLLING_FEE_HALFLIFE = 60 * 60 * 12;

/** Default incremental relay fee, sat/kvB — src/policy/policy.h:48 (`DEFAULT_INCREMENTAL_RELAY_FEE{100}`). */
export const DEFAULT_INCREMENTAL_RELAY_FEE_PER_KVB = 100;

/** Default mempool size cap in bytes — src/kernel/mempool_options.h:19,40 (300 MB). */
export const DEFAULT_MAX_MEMPOOL_BYTES = 300 * 1_000_000;

/** The mutable floor state Core keeps on CTxMemPool, as a plain value. */
export interface FeeFloor {
  /** `rollingMinimumFeeRate` — sat/kvB, a double in Core too. */
  rollingMinimumFeeRate: number;
  /** `lastRollingFeeUpdate` — unix seconds of the last decay step. */
  lastRollingFeeUpdate: number;
  /** `blockSinceLastRollingFeeBump` — decay waits for the next block. */
  blockSinceLastRollingFeeBump: boolean;
}

export function initialFeeFloor(nowSeconds: number): FeeFloor {
  return {
    rollingMinimumFeeRate: 0,
    lastRollingFeeUpdate: nowSeconds,
    blockSinceLastRollingFeeBump: false,
  };
}

/**
 * `trackPackageRemoved`: eviction during TrimToSize bumps the floor up to
 * the evicted package's feerate (the caller passes evicted rate + one
 * incremental relay fee, mirroring TrimToSize). The ratchet only ever
 * moves up here; only decay brings it down.
 */
export function trackPackageRemoved(floor: FeeFloor, ratePerKvB: number): FeeFloor {
  if (ratePerKvB > floor.rollingMinimumFeeRate) {
    return { ...floor, rollingMinimumFeeRate: ratePerKvB, blockSinceLastRollingFeeBump: false };
  }
  return floor;
}

/** Core sets the flag in removeForBlock: decay begins after the next block. */
export function blockConnected(floor: FeeFloor): FeeFloor {
  return { ...floor, blockSinceLastRollingFeeBump: true };
}

export interface MinFeeParams {
  /** Unix seconds "now" (injected so simulations control the clock). */
  nowSeconds: number;
  /** Current mempool memory usage in bytes (`DynamicMemoryUsage()`). */
  usageBytes: number;
  sizeLimitBytes?: number;
  incrementalRelayFeePerKvB?: number;
}

/**
 * `GetMinFee`, faithfully: returns the current floor in sat/kvB plus the
 * updated state (Core mutates members; we return a new value).
 */
export function getMinFee(
  floor: FeeFloor,
  params: MinFeeParams
): { feePerKvB: number; floor: FeeFloor } {
  const sizeLimit = params.sizeLimitBytes ?? DEFAULT_MAX_MEMPOOL_BYTES;
  const incremental = params.incrementalRelayFeePerKvB ?? DEFAULT_INCREMENTAL_RELAY_FEE_PER_KVB;

  if (!floor.blockSinceLastRollingFeeBump || floor.rollingMinimumFeeRate === 0) {
    return { feePerKvB: Math.round(floor.rollingMinimumFeeRate), floor };
  }

  let { rollingMinimumFeeRate, lastRollingFeeUpdate } = floor;
  if (params.nowSeconds > lastRollingFeeUpdate + 10) {
    let halflife = ROLLING_FEE_HALFLIFE;
    if (params.usageBytes < sizeLimit / 4) halflife /= 4;
    else if (params.usageBytes < sizeLimit / 2) halflife /= 2;

    rollingMinimumFeeRate =
      rollingMinimumFeeRate / Math.pow(2, (params.nowSeconds - lastRollingFeeUpdate) / halflife);
    lastRollingFeeUpdate = params.nowSeconds;

    if (rollingMinimumFeeRate < incremental / 2) {
      return {
        feePerKvB: 0,
        floor: { ...floor, rollingMinimumFeeRate: 0, lastRollingFeeUpdate },
      };
    }
  }
  return {
    feePerKvB: Math.max(Math.round(rollingMinimumFeeRate), incremental),
    floor: { ...floor, rollingMinimumFeeRate, lastRollingFeeUpdate },
  };
}
