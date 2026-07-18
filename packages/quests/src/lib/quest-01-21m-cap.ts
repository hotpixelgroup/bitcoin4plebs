import type { Quest } from './types.js';
import {
  BITCOIN_PIN,
  EXCERPT_COIN_DEFINITION,
  EXCERPT_COINBASE_ENFORCEMENT,
  EXCERPT_GET_BLOCK_SUBSIDY,
  EXCERPT_MAX_MONEY,
} from './excerpts.js';

/**
 * Quest #1: Verify the 21 Million Cap.
 *
 * Every excerpt below is VERBATIM from Bitcoin Core at the pinned commit.
 * If you touch an excerpt, re-diff it against the source. A quest that
 * misquotes the code it asks people to trust is a broken product.
 */
export const quest01: Quest = {
  id: 'quest-01',
  slug: 'verify-the-21-million-cap',
  number: 1,
  kicker: "Don't trust. Verify.",
  track: 'Foundations',
  title: 'Verify the 21 Million Cap with your own eyes.',
  summary:
    "You've been told there will only ever be 21 million bitcoin. See the ten lines of code that make it true, then run them yourself.",
  duration: '10 min',
  pin: BITCOIN_PIN,
  story: {
    stage: "minted long ago",
    text: "Where did the 0.6 BTC Ana is about to spend come from? Not a bank. Every satoshi of it was born as part of some block's subsidy, under the exact schedule you're verifying now, and then changed hands until it reached her.",
  },
  intro: [
    "You've been told there will only ever be 21 million bitcoin. Engineers say the code guarantees it. In the next five stops you'll look at that code yourself (**the real thing, not a summary**) and then run it.",
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'satoshis',
      title: 'Bitcoin counts in satoshis, not bitcoin',
      takeaway:
        'Inside the software there is no "bitcoin"; there are only whole numbers of **satoshis**. One bitcoin is defined as exactly 100,000,000 satoshis.',
      prose: [
        'This matters for what comes next: because everything is whole numbers (no decimals, no rounding modes, no floating point), every computer on Earth running this code gets **bit-for-bit identical** results. That\'s what makes global agreement possible.',
      ],
      annotations: [
        {
          lines: 'L12',
          text: '`CAmount` is just a 64-bit whole number. Every amount of money in Bitcoin is one of these.',
        },
        {
          lines: 'L15',
          text: '`COIN` = 100,000,000. When you see "1 BTC" in a wallet, the software is holding the number 100,000,000.',
        },
      ],
      excerpt: EXCERPT_COIN_DEFINITION,
    },
    {
      id: 'schedule',
      quiz: [
        {
          question: "Where does the 21 million cap actually come from?",
          options: [
          "A constant the code checks every block",
          "Halving arithmetic whose total converges just under 21M",
          "A yearly vote of developers",
          ],
          answer: 1,
          explain: "Start at 50 BTC, halve every 210,000 blocks, discard remainders: sum every reward ever and you land at 20,999,999.9769 BTC. The 21,000,000 you will meet at Stop 5 is only a sanity rail.",
        },
      ],
      viz: 'bitshift-halving',
      title: 'The entire emission schedule is ten lines of code',
      takeaway:
        "This one small function decides how many new satoshis a miner may create in each block, **for all of history, past and future**. There is no committee, no dial, no admin panel. Just this.",
      prose: [
        "Read it slowly, even if you've never seen code. A block's \"height\" is its position in the chain (the first block is height 0). The function starts at 50 BTC per block and cuts the reward in half every 210,000 blocks: the famous **halving**.",
        'The halving trick is one operation: `>>=` shifts a binary number right, which for whole numbers means **divide by two and throw away the remainder**. Do that enough times to any number and it hits zero. The cap comes from that arithmetic, not from a "21,000,000" rule. (The one 21,000,000 that does appear in the code is a sanity check, as Stop 5 will show you.)',
      ],
      annotationsOpen: true,
      annotations: [
        { lines: 'L1846', text: '"Given a block height, return the allowed new-coin reward, in satoshis."' },
        { lines: 'L1848', text: 'Count how many halvings have happened: height ÷ 210,000, whole part only.' },
        { lines: 'L1850–51', text: 'Safety rail: after 64 halvings the reward is forced to exactly zero forever.' },
        { lines: 'L1853', text: 'Start at 50 BTC (written as 50 × COIN = 5,000,000,000 satoshis).' },
        {
          lines: 'L1855',
          text: 'Halve it once per elapsed halving. Whole numbers only, remainders discarded, which is why the total ends slightly *under* 21M.',
        },
        { lines: 'L1856', text: "Return the answer. That's the whole monetary policy." },
      ],
      excerpt: EXCERPT_GET_BLOCK_SUBSIDY,
    },
    {
      id: 'interval',
      title: 'Where "every 210,000 blocks" is set',
      takeaway:
        "The halving interval isn't folklore. It's a parameter of the main Bitcoin network, set once, in this file. At ~10 minutes per block, 210,000 blocks ≈ **4 years**.",
      prose: [
        'This is the file that defines what "the Bitcoin network" even is: its rules, its starting block, its magic numbers. Line 114 is the one the schedule function at Stop 2 reads.',
        "Could someone change 210000 to 100? Sure: anyone can edit their own copy. But their node would then **disagree with every other node on Earth** about which blocks are valid, and the network would simply ignore them. Changing the code is easy; changing *everyone else's* code is the hard part. That is Bitcoin's actual security model, and you'll see it enforced at the next stop.",
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 111, endLine: 114 },
        language: 'cpp',
        lines: [
          { n: 111, text: '        m_chain_type = ChainType::MAIN;' },
          { n: 112, text: '        consensus.signet_blocks = false;' },
          { n: 113, text: '        consensus.signet_challenge.clear();' },
          { n: 114, text: '        consensus.nSubsidyHalvingInterval = 210000;', highlight: true },
        ],
      },
    },
    {
      id: 'enforcement',
      title: 'The enforcement: every node checks every miner',
      takeaway:
        'A schedule is just a promise unless something enforces it. Here it is: when any block arrives, **every node on the network** independently runs this check and rejects the block if the miner paid themselves even one satoshi too much.',
      prose: [
        'This code runs inside the routine that connects a new block to the chain. It computes the maximum the miner is allowed to collect (transaction fees plus the Stop 2 subsidy) and compares it to what the miner actually claimed in the block\'s first transaction (the "coinbase").',
        '**This is "don\'t trust, verify" in its purest form.** No node asks permission or takes another node\'s word. Tens of thousands of machines each re-run this arithmetic on every block, forever. A miner who prints extra coins doesn\'t get punished; they get *ignored*, their block discarded with the error you can read on line 2623: `bad-cb-amount`.',
      ],
      annotations: [
        { lines: 'L2621', text: 'Allowed reward = fees paid by transactions in this block + the subsidy from Stop 2.' },
        { lines: 'L2622', text: 'Did the coinbase transaction pay out more than that?' },
        { lines: 'L2623–24', text: 'If so: mark the block invalid ("coinbase pays too much") and refuse it.' },
      ],
      excerpt: EXCERPT_COINBASE_ENFORCEMENT,
    },
    {
      id: 'max-money',
      myth: {
        belief: "Somewhere in the code there's a setting that says 21 million, and someone with access could raise it.",
        reality: "There IS a 21,000,000 in the code, and you're looking at it: a **sanity check** that creates nothing. The real cap emerges from halving arithmetic, and changing either number just forks you off the network, as Quest #4 shows.",
      },
      title: 'Honesty check: there is no "21,000,000" switch',
      takeaway:
        'There **is** a 21,000,000 written in the code, but read the comment: it\'s a **sanity check**, not the thing that creates the cap. The cap is an *outcome* of the halving math you saw at Stop 2. We can prove that next.',
      prose: [
        'This is a detail engineers usually gloss over, and it\'s exactly the kind of thing you deserve to see for yourself. `MAX_MONEY` is a guard rail: no single amount may ever exceed it. The developers\' own comment tells you plainly that it is *"not the total money supply."*',
        'So where does the real number come from? Nowhere: it **emerges**. Start at 50 BTC, halve every 210,000 blocks, discard remainders, and the sum of every block reward ever converges just under 21 million. The only way to be sure is to do the arithmetic. So let\'s do it.',
      ],
      excerpt: EXCERPT_MAX_MONEY,
    },
  ],
  finale: {
    title: 'Now run it yourself',
    takeaway:
      "Below is the Stop 2 function translated line-for-line into your browser's language; compare them side by side. Press the button and your own computer will compute the reward for **every block era in Bitcoin's future** and add them up. Nobody's word required.",
    runnerId: 'emission-schedule',
    translation: {
      ref: { file: 'this page · faithful JavaScript translation', startLine: 1, endLine: 7 },
      language: 'ts',
      lines: [
        { n: 1, text: 'function GetBlockSubsidy(nHeight) {' },
        { n: 2, text: '  const halvings = Math.floor(nHeight / 210000);' },
        { n: 3, text: '  if (halvings >= 64) return 0n;' },
        { n: 4, text: '  let nSubsidy = 50n * 100000000n; // 50 * COIN' },
        { n: 5, text: '  nSubsidy >>= BigInt(halvings);' },
        { n: 6, text: '  return nSubsidy;' },
        { n: 7, text: '}' },
      ],
    },
    note: "Runs entirely on your machine, in exact whole-number arithmetic, the same kind Bitcoin uses. This site is open source, so you can check the translation too.",
  },
  recap: {
    items: [
      {
        text: "**Bitcoin's money is whole numbers of satoshis**: exact math, identical on every computer.",
        cite: 'amount.h',
      },
      {
        text: '**The entire emission policy is ten lines**: 50 BTC, halved every 210,000 blocks, mathematically forced to zero.',
        cite: 'validation.cpp:1846',
      },
      {
        text: '**Every node independently rejects any miner who overpays themselves**: enforcement without trust.',
        cite: 'validation.cpp:2621',
      },
      {
        text: '**The 21M cap is an outcome, not a setting**, and your own computer just summed the schedule to 20,999,999.9769 BTC.',
      },
    ],
    closing:
      "**Keep verifying:** every code excerpt on this page links to the identical lines on GitHub at the pinned commit. If you have the Bitcoin source on your computer, you can also open the files yourself: same paths, same line numbers. Taking anyone's word for it, ours included, is optional. That's the point.",
  },
  feynman: {
    prompt: "Explain the 21 million cap to a friend in two sentences.",
    model:
      "New bitcoin appears on a fixed schedule: 50 per block at the start, halved every 210,000 blocks, with remainders thrown away, so the total of every reward ever converges just under 21 million. It is arithmetic every node re-checks on every block, not a setting anyone can raise.",
  },
};
