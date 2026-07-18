import { COIN, INITIAL_SUBSIDY, SUBSIDY_HALVING_INTERVAL } from './constants.js';

/**
 * Faithful TypeScript translation of `GetBlockSubsidy` from
 * src/validation.cpp:1846-1857 (pinned commit). Compare line by line:
 *
 * ```cpp
 * CAmount GetBlockSubsidy(int nHeight, const Consensus::Params& consensusParams)
 * {
 *     int halvings = nHeight / consensusParams.nSubsidyHalvingInterval;
 *     // Force block reward to zero when right shift is undefined.
 *     if (halvings >= 64)
 *         return 0;
 *
 *     CAmount nSubsidy = 50 * COIN;
 *     // Subsidy is cut in half every 210,000 blocks which will occur approximately every 4 years.
 *     nSubsidy >>= halvings;
 *     return nSubsidy;
 * }
 * ```
 *
 * BigInt is used so the arithmetic is exact 64-bit-style integer math,
 * the same kind Bitcoin itself uses — no floating point anywhere.
 */
export function getBlockSubsidy(
  nHeight: number,
  subsidyHalvingInterval: number = SUBSIDY_HALVING_INTERVAL
): bigint {
  const halvings = Math.floor(nHeight / subsidyHalvingInterval);
  // Force block reward to zero when right shift is undefined.
  if (halvings >= 64) return 0n;

  let nSubsidy = INITIAL_SUBSIDY; // 50 * COIN
  // Subsidy is cut in half every 210,000 blocks.
  nSubsidy >>= BigInt(halvings);
  return nSubsidy;
}

/** One reward era: the span between two halvings. All amounts in satoshis. */
export interface Era {
  /** 1-based era number (era 1 = genesis through block 209,999). */
  era: number;
  /** First block height of the era. */
  startHeight: number;
  /** Last block height of the era. */
  endHeight: number;
  /** Subsidy per block during the era, in satoshis. */
  subsidy: bigint;
  /** Total satoshis minted during the era. */
  minted: bigint;
  /** Cumulative satoshis minted through the end of the era. */
  cumulative: bigint;
}

/** Alternative consensus parameters, for the "fork yourself" experiment. */
export interface EmissionParams {
  halvingInterval?: number;
  initialSubsidy?: bigint;
}

/**
 * Compute every era with a non-zero subsidy by running the halving loop
 * over the chain's future. Terminates when the subsidy reaches zero
 * (era 33 with Bitcoin's real parameters). Accepts alternative parameters
 * so readers can fork the rules and watch what changes.
 */
export function computeEras(params: EmissionParams = {}): Era[] {
  const interval = params.halvingInterval ?? SUBSIDY_HALVING_INTERVAL;
  const initial = params.initialSubsidy ?? INITIAL_SUBSIDY;
  const eras: Era[] = [];
  let cumulative = 0n;
  for (let k = 0; ; k++) {
    // Same shape as getBlockSubsidy: halve by right shift, stop at 64.
    const subsidy = k >= 64 ? 0n : initial >> BigInt(k);
    if (subsidy === 0n) break;
    const minted = subsidy * BigInt(interval);
    cumulative += minted;
    eras.push({
      era: k + 1,
      startHeight: k * interval,
      endHeight: (k + 1) * interval - 1,
      subsidy,
      minted,
      cumulative,
    });
  }
  return eras;
}

/** The exact total supply in satoshis: sum of every block reward, ever. */
export function totalSupply(params: EmissionParams = {}): bigint {
  const eras = computeEras(params);
  return eras[eras.length - 1].cumulative;
}

/**
 * Exact cumulative supply (in satoshis) at the START of block `height` —
 * i.e. everything minted by blocks 0..height-1... plus nothing else, ever.
 */
export function supplyAtHeight(height: number, eras: Era[] = computeEras()): bigint {
  let cumulative = 0n;
  for (const e of eras) {
    if (height > e.endHeight) {
      cumulative = e.cumulative;
    } else if (height >= e.startHeight) {
      return cumulative + e.subsidy * BigInt(height - e.startHeight);
    } else {
      break;
    }
  }
  return cumulative;
}

/**
 * Exact supply (in satoshis) once block `height` has been connected —
 * everything minted by blocks 0..height inclusive. This is what
 * `gettxoutsetinfo` at that height would report if no coins had ever been
 * destroyed or left unclaimed (the real number runs slightly lower —
 * starting with the genesis block's famously unspendable 50 BTC).
 */
export function supplyThroughBlock(height: number): bigint {
  return supplyAtHeight(height + 1);
}

/** BTC has 8 decimal places; COIN satoshis = 1 BTC. Re-exported for convenience. */
export { COIN };
