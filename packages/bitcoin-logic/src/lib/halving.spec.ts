import { describe, expect, it } from 'vitest';
import {
  BLOCK_TIME_ANCHORS,
  estimateDateForHeight,
  estimateHeightAtTime,
} from './halving.js';
import { GENESIS_TIME } from './genesis.js';

const day = (h: number) => estimateDateForHeight(h).toISOString().slice(0, 10);

describe('block-time anchors', () => {
  it('lands past heights on the real block dates, never before genesis', () => {
    expect(day(0)).toBe('2009-01-03');
    expect(day(210_000)).toBe('2012-11-28');
    expect(day(420_000)).toBe('2016-07-09');
    expect(day(630_000)).toBe('2020-05-11');
    expect(day(840_000)).toBe('2024-04-20');
  });

  it('uses the pinned genesis nTime and the pinned chainTxData anchor exactly', () => {
    expect(estimateDateForHeight(0).getTime()).toBe(GENESIS_TIME * 1000);
    // chainparams.cpp:142,218 at the pinned commit: block 938,343, nTime 1772055173.
    expect(estimateDateForHeight(938_343).getTime()).toBe(1_772_055_173_000);
    expect(BLOCK_TIME_ANCHORS.at(-1)).toEqual({ height: 938_343, timeSeconds: 1_772_055_173 });
  });

  it('interpolates between anchors and stays monotonic', () => {
    const mid = estimateDateForHeight(105_000).getTime();
    expect(mid).toBeGreaterThan(estimateDateForHeight(0).getTime());
    expect(mid).toBeLessThan(estimateDateForHeight(210_000).getTime());
    for (let h = 0; h < 1_200_000; h += 7_919) {
      expect(estimateDateForHeight(h + 7_919).getTime()).toBeGreaterThan(estimateDateForHeight(h).getTime());
    }
  });

  it('extrapolates forward from the last anchor at the 10-minute target', () => {
    expect(estimateDateForHeight(938_343 + 144).getTime()).toBe((1_772_055_173 + 144 * 600) * 1000);
  });

  it('inverts the date estimate on anchors and in between', () => {
    for (const h of [0, 210_000, 500_000, 840_000, 938_343, 1_050_000]) {
      expect(estimateHeightAtTime(estimateDateForHeight(h).getTime())).toBe(h);
    }
    expect(estimateHeightAtTime(0)).toBe(0);
  });
});
