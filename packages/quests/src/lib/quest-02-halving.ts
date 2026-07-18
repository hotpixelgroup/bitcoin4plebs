import type { Quest } from './types.js';
import { BITCOIN_PIN, EXCERPT_COINBASE_ENFORCEMENT, EXCERPT_GET_BLOCK_SUBSIDY } from './excerpts.js';

/**
 * Quest #2 — What exactly happens at a halving?
 * Builds on Quest #1: the reader has already seen GetBlockSubsidy;
 * now they see where the reward is actually claimed, why halvings arrive
 * every ~4 years, and what physically changes at the boundary block.
 */
export const quest02: Quest = {
  id: 'quest-02',
  slug: 'what-happens-at-a-halving',
  number: 2,
  kicker: "Don't trust. Verify.",
  track: 'Foundations',
  title: 'What exactly happens at a halving?',
  summary:
    'No ceremony, no announcement — one block pays 3.125 BTC and the next pays 1.5625. See the code that makes the switch, and drive the halving clock yourself.',
  duration: '8 min',
  pin: BITCOIN_PIN,
  intro: [
    'Every four years the financial press counts down to "the halving" like it\'s a rocket launch. But nothing is launched and nobody presses a button. A halving is just an ordinary block whose height happens to cross a line in the arithmetic you already verified in Quest #1. This quest shows you **where new coins are physically claimed**, **why the line arrives every ~4 years**, and **what changes the moment it\'s crossed**.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either — every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'coinbase',
      title: 'Where new coins are actually born',
      takeaway:
        'Every block\'s **first transaction** is special: it has no real input — the miner writes themselves a check for exactly **fees + subsidy**. This is the only place new bitcoin ever comes from.',
      prose: [
        'This is mining software building that first transaction, called the **coinbase**. Look at line 174: the input is set to *null* — the coins come from nowhere; that\'s what makes them new. Then line 182 computes the one number that matters: the fees from every transaction in the block, plus `GetBlockSubsidy` — the very function you read in Quest #1.',
        'Note what\'s absent: no permission check, no authority consulted. The miner simply *claims* the reward — and as you saw at Quest #1\'s Stop 4, every node on Earth will check the claim against the same arithmetic and throw the block away if it\'s one satoshi too generous.',
      ],
      annotations: [
        { lines: 'L167', text: 'Start building the special first transaction of the new block.' },
        { lines: 'L174', text: 'Its "input" points at nothing — `SetNull()`. New coins spend from nowhere.' },
        { lines: 'L180', text: 'The output is locked to the miner\'s own address.' },
        { lines: 'L182', text: 'The amount: fees + the Quest #1 subsidy function. At a halving, the second term drops by half.' },
        { lines: 'L183', text: 'The miner writes the check to themselves. Nodes will audit it.' },
      ],
      excerpt: {
        ref: { file: 'src/node/miner.cpp', startLine: 166, endLine: 184 },
        language: 'cpp',
        lines: [
          { n: 166, text: '    // Create coinbase transaction.' },
          { n: 167, text: '    CMutableTransaction coinbaseTx;', highlight: true },
          { n: 168, text: '' },
          { n: 169, text: '    // Construct coinbase transaction struct in parallel' },
          { n: 170, text: '    CoinbaseTx& coinbase_tx{pblocktemplate->m_coinbase_tx};' },
          { n: 171, text: '    coinbase_tx.version = coinbaseTx.version;' },
          { n: 172, text: '' },
          { n: 173, text: '    coinbaseTx.vin.resize(1);' },
          { n: 174, text: '    coinbaseTx.vin[0].prevout.SetNull();', highlight: true },
          { n: 175, text: '    coinbaseTx.vin[0].nSequence = CTxIn::MAX_SEQUENCE_NONFINAL; // Make sure timelock is enforced.' },
          { n: 176, text: '    coinbase_tx.sequence = coinbaseTx.vin[0].nSequence;' },
          { n: 177, text: '' },
          { n: 178, text: '    // Add an output that spends the full coinbase reward.' },
          { n: 179, text: '    coinbaseTx.vout.resize(1);' },
          { n: 180, text: '    coinbaseTx.vout[0].scriptPubKey = m_options.coinbase_output_script;' },
          { n: 181, text: '    // Block subsidy + fees' },
          { n: 182, text: '    const CAmount block_reward{nFees + GetBlockSubsidy(nHeight, chainparams.GetConsensus())};', highlight: true },
          { n: 183, text: '    coinbaseTx.vout[0].nValue = block_reward;', highlight: true },
          { n: 184, text: '    coinbase_tx.block_reward_remaining = block_reward;' },
        ],
      },
    },
    {
      id: 'ten-minutes',
      title: 'Why halvings arrive every ~4 years',
      takeaway:
        'Halvings are counted in **blocks**, not calendar time. The calendar only cooperates because the network aims for one block every **10 minutes** — a target written right here.',
      prose: [
        'Line 128 is the metronome: `nPowTargetSpacing = 10 * 60` seconds. Every 2,016 blocks (line 127: two weeks\' worth), the network re-tunes mining difficulty so blocks keep arriving roughly every ten minutes no matter how much mining power joins or leaves.',
        'Do the arithmetic yourself: 210,000 blocks × 10 minutes ≈ 1,458 days ≈ **4 years**. That\'s the entire mystery of the four-year cycle — two constants in this file, multiplied.',
      ],
      annotations: [
        { lines: 'L127', text: 'Re-tune difficulty every two weeks of target time (2,016 blocks).' },
        { lines: 'L128', text: '10 × 60 = 600 seconds between blocks, on average, forever.' },
        { lines: 'L129–31', text: 'No shortcuts on mainnet: the target is always enforced, never skipped.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 126, endLine: 131 },
        language: 'cpp',
        lines: [
          { n: 126, text: '        consensus.powLimit = uint256{"00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff"};' },
          { n: 127, text: '        consensus.nPowTargetTimespan = 14 * 24 * 60 * 60; // two weeks', highlight: true },
          { n: 128, text: '        consensus.nPowTargetSpacing = 10 * 60;', highlight: true },
          { n: 129, text: '        consensus.fPowAllowMinDifficultyBlocks = false;' },
          { n: 130, text: '        consensus.enforce_BIP94 = false;' },
          { n: 131, text: '        consensus.fPowNoRetargeting = false;' },
        ],
      },
    },
    {
      id: 'the-switch',
      title: 'Read the switch like a veteran now',
      takeaway:
        'You saw these ten lines in Quest #1. Read them again and notice: **there is no "halving event" in the code** — just integer division. Block 839,999 divides to 3; block 840,000 divides to 4. That\'s the whole ceremony.',
      prose: [
        'At the April 2024 halving, block 839,999 paid 6.25 BTC and block 840,000 — mined minutes later — paid 3.125. Nothing else changed. No update shipped, no flag flipped: the same ten lines returned a different answer because `nHeight` crossed a multiple of 210,000.',
        'This is worth sitting with: the most anticipated event in Bitcoin\'s calendar is **not an event in the software at all**. It\'s a property of arithmetic that was fixed the day the code was written. Every future halving — 2028, 2032, on to the 2130s — is already sitting in line 1848, waiting for its height.',
      ],
      annotations: [
        { lines: 'L1848', text: 'The "halving" is this division changing its answer: 839,999 ÷ 210,000 = 3; 840,000 ÷ 210,000 = 4.' },
        { lines: 'L1855', text: 'One more right-shift, half the reward. Nothing to announce.' },
      ],
      excerpt: EXCERPT_GET_BLOCK_SUBSIDY,
    },
    {
      id: 'boundary-enforcement',
      title: 'What if a miner ignores the halving?',
      takeaway:
        'The first block after a halving is the moment of maximum temptation: claim yesterday\'s reward, earn double. Here\'s the code that makes that block **worthless the instant it\'s made**.',
      prose: [
        'Same enforcement you met in Quest #1 — now look at it through halving eyes. `GetBlockSubsidy(pindex->nHeight, …)` is evaluated at the *new* height, so the allowed reward already reflects the halving. A miner claiming the old 6.25 BTC at block 840,000 produces `bad-cb-amount`, and every node discards their block — along with the real electricity they burned to mine it.',
        'That\'s why halvings are boring in practice: cheating at the boundary doesn\'t need to be policed by anyone, because it\'s **automatically unprofitable**. The math moved; everyone\'s validator moved with it, in lockstep, because they all run these same lines.',
      ],
      excerpt: EXCERPT_COINBASE_ENFORCEMENT,
    },
  ],
  finale: {
    title: 'Drive the halving clock yourself',
    takeaway:
      "Pick any block height — past or deep future — and your browser computes its era, its reward, and its estimated date **from the same arithmetic you just read**. No countdown site required.",
    runnerId: 'halving-clock',
    note: 'Dates are estimates anchored to the real April 2024 halving (block 840,000) at the 10-minute target from chainparams.cpp:128 — real blocks drift a little.',
  },
  recap: {
    items: [
      {
        text: '**New coins are born in the coinbase transaction** — an input from nowhere, an output of fees + subsidy, written by the miner and audited by everyone.',
        cite: 'miner.cpp:182',
      },
      {
        text: '**The 4-year rhythm is two constants multiplied** — 210,000 blocks × 10 minutes per block.',
        cite: 'chainparams.cpp:128',
      },
      {
        text: '**A halving is not an event in the code** — it\'s integer division changing its answer at a multiple of 210,000.',
        cite: 'validation.cpp:1848',
      },
      {
        text: '**Cheating the halving is automatically unprofitable** — the block is discarded, the electricity is not refunded.',
        cite: 'validation.cpp:2621',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. Next time someone tells you the halving is \"priced in\" or \"delayed\" or \"controlled by the miners,\" you've read the ten lines that say otherwise.",
  },
};
