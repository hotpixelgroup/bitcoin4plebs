import type { Quest } from './types.js';
import { BITCOIN_PIN, EXCERPT_COINBASE_ENFORCEMENT, EXCERPT_MAX_MONEY } from './excerpts.js';

/**
 * Quest #4: Who can change Bitcoin's rules?
 * The governance quest: no admin key exists, miners can't out-vote the
 * rules, changes happen by near-unanimous adoption, and every node
 * operator (including the reader) holds a veto.
 */
export const quest04: Quest = {
  id: 'quest-04',
  slug: 'who-can-change-bitcoins-rules',
  number: 4,
  kicker: "Don't trust. Verify.",
  track: 'Foundations',
  title: "Who can change Bitcoin's rules?",
  summary:
    'There is no admin key, no board, no upgrade server. See why even 51% of miners can\'t print a coin, then fork the rules yourself to feel where the power actually lives.',
  duration: '9 min',
  pin: BITCOIN_PIN,
  intro: [
    'Every system you\'ve ever used has an owner who can change the rules on you: a bank, a platform, a government. Bitcoin\'s strangest property is that it doesn\'t. This quest looks for the admin switch, finds out what happens to rule-breakers with majority power, and reads the scars of the times the rules *did* change. It ends with you changing them yourself, to see exactly what that gets you.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'no-admin-key',
      myth: {
        belief: "Bitcoin's developers can change the rules whenever enough of them agree.",
        reality: "Developers publish code; they cannot make anyone run it. A rule change becomes Bitcoin only when node operators near-unanimously adopt it, and the developers' own comment on this screen says changing this value would fork them off the network.",
      },
      title: 'There is no admin switch, and the developers say so in a comment',
      takeaway:
        'You met MAX_MONEY in Quest #1. Read its comment again with new eyes: even *this* constant\'s exact value is **"consensus critical"**, with the developers writing that **they too cannot touch it** without splitting the network.',
      prose: [
        'This comment is a remarkable confession. The people with commit access to Bitcoin\'s repository are writing, in the code itself, that changing this line wouldn\'t *update* Bitcoin. It would cause "a fork": their software would simply stop being Bitcoin and wander off onto its own lonely chain.',
        'That\'s the deep answer to "who controls Bitcoin": the rules aren\'t enforced *by* anyone; they\'re enforced *against* everyone, developers included, by every node independently checking every block. Authority doesn\'t live in the repository. It lives in tens of thousands of machines that each decide, alone, what code they run.',
      ],
      annotations: [
        { lines: 'L21–22', text: '"used by consensus-critical validation code": every node checks this on every block.' },
        { lines: 'L23–24', text: 'The confession: modify it and you don\'t change Bitcoin; you leave it ("could lead to a fork").' },
      ],
      excerpt: EXCERPT_MAX_MONEY,
    },
    {
      id: 'majority-cant-print',
      quiz: [
        {
          question: "What CAN an attacker with 51% of the hashpower actually do?",
          options: [
          "Print new coins for themselves",
          "Reorder recent blocks and double-spend their own coins",
          "Change the 21M cap",
          ],
          answer: 1,
          explain: "Majority hashpower buys the ability to rewrite recent history, which enables double-spending coins the attacker recently spent. Their blocks still pass every validity check: no printing, no stealing keys, no rule changes.",
        },
      ],
      viz: 'fiftyone-race',
      title: "Even 51% of miners can't print a single coin",
      takeaway:
        'The famous "51% attack" can *reorder recent* transactions, but it **cannot** print coins, steal your keys, or change the rules, because rule-breaking blocks are discarded by every node **regardless of how much work they carry**.',
      prose: [
        'Read this check one more time. It\'s the same five lines from Quest #1, and this is their most important property: nothing in them asks how much mining power produced the block. A block with an oversized coinbase is invalid with 1% of the world\'s hashrate behind it, and exactly as invalid with 99%.',
        'This is the part of Bitcoin most people get backwards. Miners don\'t vote on what\'s valid; they *compete for the reward within* rules that nodes enforce. A miner majority that starts breaking rules doesn\'t take over Bitcoin; it exiles itself onto a chain that every wallet, exchange, and node running this code simply cannot see.',
      ],
      excerpt: EXCERPT_COINBASE_ENFORCEMENT,
    },
    {
      id: 'how-rules-change',
      viz: 'activation-timeline',
      title: 'So how did the rules ever change? Read the scars',
      takeaway:
        'Bitcoin\'s rules **have** changed: carefully, rarely, and by near-unanimous adoption. Each upgrade\'s activation block is **carved permanently into the code**, like rings in a tree trunk.',
      prose: [
        'These lines are Bitcoin\'s constitutional history. Each one records a soft fork (a *tightening* of the rules that old software still tolerates) and the exact block where it activated: BIP34 at 227,931, CheckLockTimeVerify at 388,381, CheckSequenceVerify at 419,328, SegWit at 481,824.',
        'How did each activate? Not by decree. Developers proposed; node operators chose to run the new code; miners signaled readiness in their blocks; and only past overwhelming thresholds did the new rule take effect. The process can take **years per change**; SegWit\'s activation was fought over for two of them. That slowness isn\'t bureaucracy. It\'s what "nobody can change the rules on you" costs, and what it\'s worth.',
      ],
      annotations: [
        { lines: 'L119', text: 'BIP34 (2013): block heights in coinbases, activated at block 227,931.' },
        { lines: 'L121–22', text: 'Two 2015 upgrades hardening signatures and timelocks.' },
        { lines: 'L124', text: 'SegWit (2017) at block 481,824, after two years of public argument and near-unanimous adoption.' },
        { lines: 'L125', text: 'Taproot\'s marker (2021), the most recent change. Note the pace: six rule changes since 2013, and only one since 2017.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 119, endLine: 125 },
        language: 'cpp',
        lines: [
          { n: 119, text: '        consensus.BIP34Height = 227931;', highlight: true },
          { n: 120, text: '        consensus.BIP34Hash = uint256{"000000000000024b89b42a942fe0d9fea3bb44ab7bd1b19115dd6a759c0808b8"};' },
          { n: 121, text: '        consensus.BIP65Height = 388381; // 000000000000000004c2b624ed5d7756c508d90fd0da2c7c679febfa6c4735f0' },
          { n: 122, text: '        consensus.BIP66Height = 363725; // 00000000000000000379eaa19dce8c9b722d46ae6a57c2f1a988119488b50931' },
          { n: 123, text: '        consensus.CSVHeight = 419328; // 000000000000000004a1b34462cb8aeebd5799177f7a29cf28f2d1961716b5b5' },
          { n: 124, text: '        consensus.SegwitHeight = 481824; // 0000000000000000001c8018d9cb3b742ef25114f27563e3fc4a1902167f9893', highlight: true },
          { n: 125, text: '        consensus.MinBIP9WarningHeight = 711648; // taproot activation height + miner confirmation window', highlight: true },
        ],
      },
    },
  ],
  finale: {
    title: 'Fork Bitcoin yourself, right now',
    takeaway:
      "The code is open; anyone can change it. So change it. Pick your own halving interval or starting reward, run your chain's emission schedule, and see precisely what you'd be the proud owner of.",
    runnerId: 'fork-yourself',
    note: 'This runs the same halving arithmetic you verified in Quest #1, with your parameters instead of Bitcoin\'s. Changing the code was never the hard part.',
  },
  recap: {
    items: [
      {
        text: '**No admin switch exists**: the developers themselves note in the code that changing consensus values forks you off the network.',
        cite: 'amount.h:23',
      },
      {
        text: '**Majority hashpower cannot print coins**: validity checks never ask how much work a rule-breaking block carries.',
        cite: 'validation.cpp:2621',
      },
      {
        text: '**Rule changes happen by near-unanimous adoption, years apart**: each activation height is carved into the code.',
        cite: 'chainparams.cpp:119',
      },
      {
        text: '**You just forked Bitcoin and nobody followed you**, which is exactly the security model working as designed.',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. \"Who can change Bitcoin's rules?\" has a precise answer: anyone can change the code, and no one can make you run it. The veto is yours; that's what running a node means.",
  },
};
