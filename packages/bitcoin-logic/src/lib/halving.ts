import { SUBSIDY_HALVING_INTERVAL } from './constants.js';

/**
 * Target block spacing — src/kernel/chainparams.cpp:128
 * (`consensus.nPowTargetSpacing = 10 * 60;`).
 */
export const TARGET_BLOCK_SPACING_SECONDS = 10 * 60;

/**
 * A well-known real-world anchor: the fourth halving occurred at block
 * 840,000, mined 2024-04-20 (UTC). We estimate other block times from this
 * anchor at the 10-minute target. Estimates only — real block times drift.
 */
export const HALVING_ANCHOR = {
  height: 840_000,
  timestampMs: Date.UTC(2024, 3, 20, 0, 9),
} as const;

/** Estimated wall-clock date for a block height (10-minute target from the anchor). */
export function estimateDateForHeight(height: number): Date {
  const deltaBlocks = height - HALVING_ANCHOR.height;
  return new Date(HALVING_ANCHOR.timestampMs + deltaBlocks * TARGET_BLOCK_SPACING_SECONDS * 1000);
}

/** Estimated chain height at a wall-clock time (10-minute target from the anchor). */
export function estimateHeightAtTime(timestampMs: number): number {
  const deltaMs = timestampMs - HALVING_ANCHOR.timestampMs;
  return Math.max(0, HALVING_ANCHOR.height + Math.floor(deltaMs / (TARGET_BLOCK_SPACING_SECONDS * 1000)));
}

/** First block height of the next halving era after `height`. */
export function nextHalvingHeight(height: number): number {
  return (Math.floor(height / SUBSIDY_HALVING_INTERVAL) + 1) * SUBSIDY_HALVING_INTERVAL;
}

/** 1-based era number for a height (era 34+ means the zero-subsidy forever-era). */
export function eraForHeight(height: number): number {
  return Math.floor(height / SUBSIDY_HALVING_INTERVAL) + 1;
}
