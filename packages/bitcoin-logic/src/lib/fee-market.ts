/**
 * A deliberately simple, deterministic model of the fee auction that
 * BlockAssembler runs for real (src/node/miner.cpp:301): sort waiting
 * transactions by feerate, fill ~1,000,000 vbytes per block from the top.
 * A model, not a market oracle — but the *mechanism* is the real one.
 */

export interface MempoolTx {
  vsize: number;
  /** satoshis per vbyte */
  feerate: number;
}

/** Deterministic PRNG (mulberry32) so simulations are reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A plausible waiting room: many low-fee transactions, few high-fee ones. */
export function generateMempool(seed: number, count = 6000): MempoolTx[] {
  const rand = seededRandom(seed);
  const txs: MempoolTx[] = [];
  for (let i = 0; i < count; i++) {
    const feerate = Math.max(1, Math.min(150, Math.round(-Math.log(1 - rand()) * 14)));
    const vsize = 110 + Math.floor(rand() * 400);
    txs.push({ vsize, feerate });
  }
  return txs;
}

export const BLOCK_VSIZE_CAPACITY = 1_000_000;

export interface ConfirmationEstimate {
  /** 1 = next block; capped at 20. */
  blocks: number;
  /** True if still unconfirmed after the simulation horizon. */
  timedOut: boolean;
  minutes: number;
}

/**
 * Simulate the auction: each block, take the highest-feerate ~1M vbytes;
 * between blocks, fresh transactions arrive. Your transaction confirms
 * when everything paying more than you no longer fills the block.
 */
export function estimateConfirmation(
  myFeerate: number,
  myVsize = 140,
  seed = 42
): ConfirmationEstimate {
  const rand = seededRandom(seed ^ 0x9e3779b9);
  let pool = generateMempool(seed).sort((a, b) => b.feerate - a.feerate);

  for (let block = 1; block <= 20; block++) {
    // Fill the block from the top of the fee ladder.
    let used = 0;
    let mineIncluded = false;
    const survivors: MempoolTx[] = [];
    let mineConsidered = false;
    for (const tx of pool) {
      // My transaction slots into the ladder at its feerate.
      if (!mineConsidered && tx.feerate <= myFeerate) {
        mineConsidered = true;
        if (used + myVsize <= BLOCK_VSIZE_CAPACITY) {
          mineIncluded = true;
        }
      }
      if (used + tx.vsize <= BLOCK_VSIZE_CAPACITY) {
        used += tx.vsize;
      } else {
        survivors.push(tx);
      }
    }
    if (!mineConsidered && used + myVsize <= BLOCK_VSIZE_CAPACITY) mineIncluded = true;
    if (mineIncluded) return { blocks: block, timedOut: false, minutes: block * 10 };

    // Fresh arrivals before the next block.
    const arrivals = generateMempool(Math.floor(rand() * 2 ** 31), 2000);
    pool = survivors.concat(arrivals).sort((a, b) => b.feerate - a.feerate);
  }
  return { blocks: 20, timedOut: true, minutes: 200 };
}

/** Histogram of waiting vbytes by feerate band, for visualization. */
export function feerateBands(
  pool: MempoolTx[],
  edges: number[] = [1, 2, 5, 10, 20, 40, 80, 151]
): Array<{ from: number; to: number; vbytes: number }> {
  const bands = edges.slice(0, -1).map((from, i) => ({ from, to: edges[i + 1], vbytes: 0 }));
  for (const tx of pool) {
    for (const band of bands) {
      if (tx.feerate >= band.from && tx.feerate < band.to) {
        band.vbytes += tx.vsize;
        break;
      }
    }
  }
  return bands;
}
