import type { Quest } from './types.js';

/**
 * Entry paths and the curriculum's dependency map. Same design rule as
 * everything else in this package: plain serializable data, validated by
 * the integrity spec, rendered by the app.
 */

/** One "why are you here?" entry: a persona and its three-quest on-ramp. */
export interface EntryPath {
  id: string;
  /** The visitor's own words, e.g. "Someone told me it's a scam". */
  prompt: string;
  /** One-line pitch for the path (RichText). */
  blurb: string;
  /** Quest numbers, in recommended order. */
  questNumbers: number[];
}

export const entryPaths: EntryPath[] = [
  {
    id: 'skeptic',
    prompt: "Someone told me it's a scam",
    blurb:
      'Three quests that replace vibes with arithmetic: what money even is, the supply cap you can check yourself, and the night the cap was attacked and held.',
    questNumbers: [0, 1, 5],
  },
  {
    id: 'holder',
    prompt: 'I own some and it makes me nervous',
    blurb:
      'Why your coins are yours, how to hold them so they stay that way, and a full practice run with play money before anything real moves.',
    questNumbers: [3, 14, 11],
  },
  {
    id: 'sovereign',
    prompt: 'I want to need nobody',
    blurb:
      'Verify the money supply with your own eyes, reproduce the most famous hash on Earth, then run the machine that makes you a peer.',
    questNumbers: [1, 8, 9],
  },
  {
    id: 'current',
    prompt: 'What is the fee and spam drama?',
    blurb:
      'The blockspace auction, the machine that keeps it usable with nobody in charge, and the live fight over what a ledger is for, from primary sources.',
    questNumbers: [7, 12, 13],
  },
];

/**
 * Which quests each quest builds on (direct prerequisites, by number).
 * This is advisory curriculum structure, not a lock: every quest stays
 * openable, and quest pages already show a gentle catch-up banner.
 */
export const prerequisites: Record<number, number[]> = {
  1: [0],
  2: [1],
  3: [0],
  4: [1],
  5: [1],
  6: [2],
  7: [3, 6],
  8: [6],
  9: [1, 8],
  10: [3],
  11: [10],
  12: [6, 7],
  13: [12, 4],
  14: [3, 11],
  15: [7, 14],
  16: [3, 12],
};

/** Group consecutive quests that share a track, preserving curriculum order. */
export function groupQuestsByTrack(all: Quest[]): Array<{ track: string; quests: Quest[] }> {
  const groups: Array<{ track: string; quests: Quest[] }> = [];
  for (const quest of all) {
    const track = quest.track ?? 'Foundations';
    const last = groups[groups.length - 1];
    if (last && last.track === track) {
      last.quests.push(quest);
    } else {
      groups.push({ track, quests: [quest] });
    }
  }
  return groups;
}
