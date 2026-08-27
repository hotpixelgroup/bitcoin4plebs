import type { SiteId } from './sites.js';

/**
 * Quest number to slug, for every quest on both sites.
 *
 * This exists so a site can build a deep link into its SIBLING without
 * importing the sibling's quest data, which would undo the per-site
 * registry split and put the other curriculum back in the bundle. It is a
 * few hundred bytes instead of a few hundred kilobytes.
 *
 * Hand-maintained, and quests.spec.ts fails if it drifts from the real
 * registries.
 */
export const QUEST_SLUGS: Record<SiteId, Record<number, string>> = {
  bitcoin: {
    0: 'what-even-is-a-ledger',
    1: 'verify-the-21-million-cap',
    2: 'what-happens-at-a-halving',
    3: 'what-stops-someone-spending-your-coins',
    4: 'who-can-change-bitcoins-rules',
    5: 'the-2018-inflation-bug',
    6: 'how-does-mining-actually-work',
    7: 'what-happens-when-you-press-send',
    8: 'hash-the-genesis-block',
    9: 'run-your-own-node',
    10: 'what-is-an-address',
    11: 'send-your-first-play-bitcoin',
    12: 'who-keeps-bitcoin-usable',
    13: 'the-data-wars',
    14: 'your-keys-your-coins',
    15: 'who-can-see-your-money',
    16: 'a-thousand-coffees',
    17: 'why-is-this-money',
    18: 'does-bitcoin-waste-energy',
  },
  lightning: {
    1: 'what-is-a-channel',
    2: 'why-cheating-fails',
    3: 'what-is-an-invoice',
    4: 'crossing-strangers',
    5: 'who-paid-whom',
    6: 'finding-a-route',
    7: 'whose-lightning',
  },
};
