import type { Quest } from './types.js';
import type { SiteId } from './sites.js';

/**
 * Entry paths and the curriculum's dependency map. Same design rule as
 * everything else in this package: plain serializable data, validated by
 * the integrity spec, rendered by the app.
 */

/** One "why are you here?" entry: a persona and its three-quest on-ramp. */
export interface EntryPath {
  id: string;
  /** Which front door this on-ramp belongs to. Absent means 'bitcoin'. */
  site?: SiteId;
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
      'Three quests that replace vibes with reasoning: what money even is, why this is money at all, and the night its supply was attacked and held.',
    questNumbers: [0, 17, 5],
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
  {
    id: 'green',
    prompt: "Isn't it an environmental disaster?",
    blurb:
      'Take the objection seriously: how mining actually works, what the energy buys that nothing else can, and the honest accounting neither side usually gives.',
    questNumbers: [18, 6, 9],
  },

  // --- lightning4plebs ---
  {
    id: 'ln-not-real',
    site: 'lightning',
    prompt: "I hear it isn't real Bitcoin",
    blurb:
      'Start where the coins actually are: an ordinary Bitcoin output, locked to two keys, with the chain standing by as the court. Then see what makes cheating cost more than it pays.',
    questNumbers: [1, 2, 5],
  },
  {
    id: 'ln-it-failed',
    site: 'lightning',
    prompt: 'My payment failed and I don\'t know why',
    blurb:
      'Failure is the normal failure mode here, and the reasons are knowable: liquidity pointing the wrong way, a deadline hit, an invoice expired. Learn to read what your wallet is telling you.',
    questNumbers: [4, 3, 1],
  },
  {
    id: 'ln-privacy',
    site: 'lightning',
    prompt: 'Is any of this actually private?',
    blurb:
      'The honest answer, from the specification: strong, specific guarantees about what a routing node learns, and a clear account of the four things the onion does not protect.',
    questNumbers: [5, 4, 3],
  },
  {
    id: 'ln-risk',
    site: 'lightning',
    prompt: 'What can go wrong with my money?',
    blurb:
      'What a force close costs, why your funds sit behind a delay, what a stuck payment locks up, and the one choice — custodial or not — that matters more than all of it.',
    questNumbers: [7, 2, 4],
  },
];

/**
 * Which quests each quest builds on (direct prerequisites, by number).
 * This is advisory curriculum structure, not a lock: every quest stays
 * openable, and quest pages already show a gentle catch-up banner.
 *
 * Keyed by site, because quest numbers restart at each front door.
 */
const bitcoinPrerequisites: Record<number, number[]> = {
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
  17: [0, 1],
  18: [6, 4],
};

/** Lightning's curriculum dependencies. Numbers are Lightning quest numbers. */
const lightningPrerequisites: Record<number, number[]> = {
  2: [1],
  3: [1],
  4: [1, 3],
  5: [4],
  6: [4],
  7: [1, 2],
};

export const prerequisites: Record<SiteId, Record<number, number[]>> = {
  bitcoin: bitcoinPrerequisites,
  lightning: lightningPrerequisites,
};

/** The dependency map for one front door. */
export function prerequisitesForSite(site: SiteId): Record<number, number[]> {
  return prerequisites[site];
}

/** The "why are you here?" on-ramps for one front door. */
export function entryPathsForSite(site: SiteId): EntryPath[] {
  return entryPaths.filter((path) => (path.site ?? 'bitcoin') === site);
}

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
