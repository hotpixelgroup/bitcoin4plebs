import type { Quest } from './types.js';
import { quest00 } from './quest-00-ledger.js';
import { quest01 } from './quest-01-21m-cap.js';
import { quest02 } from './quest-02-halving.js';
import { quest03 } from './quest-03-your-coins.js';
import { quest04 } from './quest-04-who-changes-rules.js';
import { quest05 } from './quest-05-inflation-bug.js';
import { quest06 } from './quest-06-mining.js';
import { quest07 } from './quest-07-press-send.js';
import { quest08 } from './quest-08-genesis-block.js';
import { quest09 } from './quest-09-run-a-node.js';
import { quest10 } from './quest-10-addresses.js';
import { quest11 } from './quest-11-first-send.js';
import { quest12 } from './quest-12-invisible-hand.js';
import { quest13 } from './quest-13-data-wars.js';

/**
 * The quest registry, in curriculum order — each quest builds on the
 * previous one. Today this is a static list bundled with the app; because
 * quests are plain data, swapping this for a fetch from our own API later
 * changes nothing else in the codebase.
 */
export const quests: Quest[] = [
  quest00,
  quest01,
  quest02,
  quest03,
  quest04,
  quest05,
  quest06,
  quest07,
  quest08,
  quest09,
  quest10,
  quest11,
  quest12,
  quest13,
];

export function getQuestBySlug(slug: string): Quest | undefined {
  return quests.find((q) => q.slug === slug);
}
