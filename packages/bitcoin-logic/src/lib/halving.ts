import { SUBSIDY_HALVING_INTERVAL } from './constants.js';
import { GENESIS_TIME } from './genesis.js';

/**
 * Target block spacing — src/kernel/chainparams.cpp:128
 * (`consensus.nPowTargetSpacing = 10 * 60;`).
 */
export const TARGET_BLOCK_SPACING_SECONDS = 10 * 60;

/** A real block whose header timestamp we know. */
export interface BlockTimeAnchor {
  height: number;
  /** Header nTime, unix seconds (UTC). */
  timeSeconds: number;
}

/**
 * Real header timestamps that pin the estimate to history. Past heights are
 * interpolated linearly between neighbouring anchors; heights after the last
 * anchor are extrapolated at the 10-minute target. Real block times drift,
 * so in-between and future dates remain estimates.
 *
 * - 0: genesis nTime, chainparams.cpp:158 at the pinned commit.
 * - 210,000 / 420,000 / 630,000 / 840,000: the four halving blocks' header
 *   timestamps (2012-11-28 15:24:38, 2016-07-09 16:46:13,
 *   2020-05-11 19:23:43, 2024-04-20 00:09:27 UTC).
 * - 938,343: the pinned release's assumevalid block (chainparams.cpp:142),
 *   whose nTime the developers recorded in chainTxData (chainparams.cpp:218).
 */
export const BLOCK_TIME_ANCHORS: readonly BlockTimeAnchor[] = [
  { height: 0, timeSeconds: GENESIS_TIME },
  { height: 210_000, timeSeconds: 1_354_116_278 },
  { height: 420_000, timeSeconds: 1_468_082_773 },
  { height: 630_000, timeSeconds: 1_589_225_023 },
  { height: 840_000, timeSeconds: 1_713_571_767 },
  { height: 938_343, timeSeconds: 1_772_055_173 },
];

/** The April 2024 halving, kept for callers that cite it. */
export const HALVING_ANCHOR = {
  height: 840_000,
  timestampMs: 1_713_571_767_000,
} as const;

/** Estimated wall-clock date for a block height (anchored past, 10-minute future). */
export function estimateDateForHeight(height: number): Date {
  const anchors = BLOCK_TIME_ANCHORS;
  const h = Math.max(0, height);
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (h <= b.height) {
      const ms =
        a.timeSeconds * 1000 +
        Math.round(((h - a.height) * (b.timeSeconds - a.timeSeconds) * 1000) / (b.height - a.height));
      return new Date(ms);
    }
  }
  const last = anchors[anchors.length - 1];
  return new Date((last.timeSeconds + (h - last.height) * TARGET_BLOCK_SPACING_SECONDS) * 1000);
}

/** Estimated chain height at a wall-clock time: the inverse of {@link estimateDateForHeight}. */
export function estimateHeightAtTime(timestampMs: number): number {
  const anchors = BLOCK_TIME_ANCHORS;
  if (timestampMs <= anchors[0].timeSeconds * 1000) return 0;
  let guess: number;
  const seg = anchors.findIndex((a, i) => i > 0 && timestampMs <= a.timeSeconds * 1000);
  if (seg === -1) {
    const last = anchors[anchors.length - 1];
    guess =
      last.height + Math.floor((timestampMs - last.timeSeconds * 1000) / (TARGET_BLOCK_SPACING_SECONDS * 1000));
  } else {
    const a = anchors[seg - 1];
    const b = anchors[seg];
    guess =
      a.height +
      Math.floor(((timestampMs - a.timeSeconds * 1000) * (b.height - a.height)) / ((b.timeSeconds - a.timeSeconds) * 1000));
  }
  // Largest height whose estimated date is not after the timestamp.
  while (guess > 0 && estimateDateForHeight(guess).getTime() > timestampMs) guess--;
  while (estimateDateForHeight(guess + 1).getTime() <= timestampMs) guess++;
  return guess;
}

/** First block height of the next halving era after `height`. */
export function nextHalvingHeight(height: number): number {
  return (Math.floor(height / SUBSIDY_HALVING_INTERVAL) + 1) * SUBSIDY_HALVING_INTERVAL;
}

/** 1-based era number for a height (era 34+ means the zero-subsidy forever-era). */
export function eraForHeight(height: number): number {
  return Math.floor(height / SUBSIDY_HALVING_INTERVAL) + 1;
}
