import type { Quest } from './types.js';

import { questLn01 } from './quest-ln-01-the-channel.js';
import { questLn02 } from './quest-ln-02-revocation.js';
import { questLn03 } from './quest-ln-03-invoice.js';
import { questLn04 } from './quest-ln-04-htlc.js';
import { questLn05 } from './quest-ln-05-onion.js';
import { questLn06 } from './quest-ln-06-routing.js';
import { questLn07 } from './quest-ln-07-whose-lightning.js';

/**
 * The lightning4plebs curriculum, in order. See registry-bitcoin.ts for
 * why the two lists are separate files.
 */
export const quests: Quest[] = [
  questLn01,
  questLn02,
  questLn03,
  questLn04,
  questLn05,
  questLn06,
  questLn07,
];
