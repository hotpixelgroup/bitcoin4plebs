import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #6 — How does mining actually work?
 * Demystifies "solving complex math problems": mining is hashing an
 * 80-byte header until the number comes out small enough, difficulty is a
 * thermostat, and the reader ends by mining a block in their browser.
 */
export const quest06: Quest = {
  id: 'quest-06',
  slug: 'how-does-mining-actually-work',
  number: 6,
  kicker: "Don't trust. Verify.",
  track: 'Foundations',
  title: 'How does mining actually work?',
  summary:
    'Miners aren\'t "solving complex equations" — they\'re rolling a cosmic dice by hashing 80 bytes over and over. See the one-line rule, the difficulty thermostat — then mine a block yourself.',
  duration: '9 min',
  pin: BITCOIN_PIN,
  intro: [
    'You\'ve heard mining described as "computers solving complex math problems." That\'s wrong in an important way: there is no equation, no cleverness, no partial credit. Mining is **guessing** — hashing a tiny 80-byte header trillions of times with different lucky numbers until the output happens to be small enough. This quest shows you the whole machine: the header, the one-line rule, and the thermostat that keeps the guessing honest. Then you\'ll mine a block yourself, for real, in this tab.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either — every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'the-header',
      viz: 'avalanche-grid',
      title: 'The whole "puzzle" is 80 bytes — and Satoshi explains it in a comment',
      takeaway:
        'This comment has survived since 2009, and it *is* the mining explainer: collect transactions, then **"scan through nonce values"** until the block\'s hash "satisfies proof-of-work requirements." No equations. Scanning.',
      prose: [
        'Six fields, 80 bytes — this is everything a miner hashes. Five of them are essentially fixed: version, the previous block\'s hash (which chains blocks together), a fingerprint of all included transactions (`hashMerkleRoot`), a timestamp, and the current difficulty (`nBits`).',
        'The last field is the star: `nNonce` — literally "number used once." It exists for one purpose: to be *changed*. Hash the header, get a wrong answer, bump the nonce, hash again. Modern mining machines do this **hundreds of trillions of times per second**, and every attempt is as dumb as the last. That dumbness is the point — a lottery where tickets cost electricity can\'t be talked, bribed, or reasoned into a different winner.',
      ],
      annotations: [
        { lines: 'L19–24', text: 'The original design note: build a block, "scan through nonce values," broadcast when solved. Mining in three sentences, since 2009.' },
        { lines: 'L31', text: 'Each header points at the previous block\'s hash — this is what makes it a *chain*.' },
        { lines: 'L32', text: 'One 32-byte fingerprint commits to every transaction in the block. Change any transaction, the fingerprint changes, the hash changes.' },
        { lines: 'L34', text: '`nBits`: the current difficulty target, in compact form — the next stop decodes it.' },
        { lines: 'L35', text: '`nNonce`: the lucky number miners scan through. The entire "search" is trying values here.' },
      ],
      excerpt: {
        ref: { file: 'src/primitives/block.h', startLine: 19, endLine: 35 },
        language: 'cpp',
        lines: [
          { n: 19, text: '/** Nodes collect new transactions into a block, hash them into a hash tree,', highlight: true },
          { n: 20, text: " * and scan through nonce values to make the block's hash satisfy proof-of-work", highlight: true },
          { n: 21, text: ' * requirements.  When they solve the proof-of-work, they broadcast the block' },
          { n: 22, text: ' * to everyone and the block is added to the block chain.  The first transaction' },
          { n: 23, text: ' * in the block is a special one that creates a new coin owned by the creator' },
          { n: 24, text: ' * of the block.' },
          { n: 25, text: ' */' },
          { n: 26, text: 'class CBlockHeader' },
          { n: 27, text: '{' },
          { n: 28, text: 'public:' },
          { n: 29, text: '    // header' },
          { n: 30, text: '    int32_t nVersion;' },
          { n: 31, text: '    uint256 hashPrevBlock;' },
          { n: 32, text: '    uint256 hashMerkleRoot;' },
          { n: 33, text: '    uint32_t nTime;' },
          { n: 34, text: '    uint32_t nBits;', highlight: true },
          { n: 35, text: '    uint32_t nNonce;', highlight: true },
        ],
      },
    },
    {
      id: 'the-rule',
      title: 'The entire rule of mining is one comparison',
      takeaway:
        'Here is what "satisfying proof-of-work" means: read the block\'s hash **as a 256-bit number**, and check it\'s **not bigger than the target**. Line 167. That\'s mining.',
      prose: [
        'A hash is just a huge number written in hexadecimal. The target (decoded from `nBits` on line 163) is another huge number. A block wins if its hash ≤ target — which, for a small target, means the hash must start with a long run of zeros. That\'s why real block hashes all begin `000000000000…` — each is a lottery ticket that came up all zeros.',
        'Notice what this buys everyone: **verification is one hash and one comparison** — your phone can check in microseconds what took a warehouse of machines quintillions of guesses to find. Producing proof is brutally expensive; checking it is nearly free. Sound familiar? It\'s the same beautiful asymmetry as the signatures in Quest #3, and it\'s the entire reason "longest valid chain" can settle disagreements without a referee.',
      ],
      annotations: [
        { lines: 'L163', text: 'Decode the compact `nBits` field from the header into the full 256-bit target.' },
        { lines: 'L166–68', text: 'The whole rule: hash bigger than target → not a valid block. No judge, no jury, one comparison.' },
      ],
      excerpt: {
        ref: { file: 'src/pow.cpp', startLine: 161, endLine: 171 },
        language: 'cpp',
        lines: [
          { n: 161, text: 'bool CheckProofOfWorkImpl(uint256 hash, unsigned int nBits, const Consensus::Params& params)', highlight: true },
          { n: 162, text: '{' },
          { n: 163, text: '    auto bnTarget{DeriveTarget(nBits, params.powLimit)};' },
          { n: 164, text: '    if (!bnTarget) return false;' },
          { n: 165, text: '' },
          { n: 166, text: '    // Check proof of work matches claimed amount' },
          { n: 167, text: '    if (UintToArith256(hash) > bnTarget)', highlight: true },
          { n: 168, text: '        return false;', highlight: true },
          { n: 169, text: '' },
          { n: 170, text: '    return true;' },
          { n: 171, text: '}' },
        ],
      },
    },
    {
      id: 'thermostat',
      viz: 'difficulty-thermostat',
      title: 'The thermostat: measure two weeks, clamp the correction',
      takeaway:
        'Every 2,016 blocks, the network measures how long they *actually* took versus the 14 days they *should* have taken — and clamps the correction to **4× in either direction**, so not even a massive hashrate shock can whipsaw the clock.',
      prose: [
        'This is how "one block per ten minutes" survives mining machines getting a trillion times faster since 2009: the rules *measure reality* and adjust. Blocks came too fast? The target shrinks — harder lottery. Miners left and blocks crawled? It grows — easier lottery.',
        'Lines 57–60 are pure engineering paranoia, and worth loving: even if the measured fortnight looks absurd (an attack, a bug, half the hashrate vanishing overnight), one adjustment can never change difficulty by more than 4×. Every node computes this identical correction from the chain itself — no committee meets, no one announces the new difficulty. It\'s a thermostat, not a central bank.',
      ],
      annotations: [
        { lines: 'L56', text: 'Measure: how long did the last 2,016 blocks actually take?' },
        { lines: 'L57–60', text: 'Clamp: whatever happened, the correction is capped at 4× per adjustment, both directions.' },
      ],
      excerpt: {
        ref: { file: 'src/pow.cpp', startLine: 50, endLine: 60 },
        language: 'cpp',
        lines: [
          { n: 50, text: 'unsigned int CalculateNextWorkRequired(const CBlockIndex* pindexLast, int64_t nFirstBlockTime, const Consensus::Params& params)', highlight: true },
          { n: 51, text: '{' },
          { n: 52, text: '    if (params.fPowNoRetargeting)' },
          { n: 53, text: '        return pindexLast->nBits;' },
          { n: 54, text: '' },
          { n: 55, text: '    // Limit adjustment step' },
          { n: 56, text: '    int64_t nActualTimespan = pindexLast->GetBlockTime() - nFirstBlockTime;', highlight: true },
          { n: 57, text: '    if (nActualTimespan < params.nPowTargetTimespan/4)', highlight: true },
          { n: 58, text: '        nActualTimespan = params.nPowTargetTimespan/4;' },
          { n: 59, text: '    if (nActualTimespan > params.nPowTargetTimespan*4)', highlight: true },
          { n: 60, text: '        nActualTimespan = params.nPowTargetTimespan*4;' },
        ],
      },
    },
    {
      id: 'retarget',
      title: 'The correction itself: multiply, divide, done',
      takeaway:
        'The famous "difficulty adjustment" that keeps a trillion-dollar network on schedule is **two lines of arithmetic**: scale the target by actual-time over intended-time.',
      prose: [
        'New target = old target × (actual fortnight ÷ intended fortnight). Blocks took 12 days instead of 14? The target scales by 12/14 — smaller, harder. That\'s the whole formula on lines 78–79; lines 81–82 just refuse to ever get easier than the genesis-era limit.',
        'Step back and look at what you\'ve now read across three stops: an unforgeable lottery (the rule), self-correcting odds (the thermostat), and — from Quest #2 — a prize schedule fixed until the 2140s. Nobody steers it. The machine measures itself, corrects itself, and pays itself, using arithmetic you have now personally read. There\'s only one thing left to do: play the lottery yourself.',
      ],
      annotations: [
        { lines: 'L78–79', text: 'The entire adjustment: new = old × actual ÷ intended.' },
        { lines: 'L81–82', text: 'One floor: never easier than the powLimit the network started with in 2009.' },
        { lines: 'L84', text: 'Re-encode to compact form — this becomes `nBits` in the next 2,016 headers.' },
      ],
      excerpt: {
        ref: { file: 'src/pow.cpp', startLine: 78, endLine: 85 },
        language: 'cpp',
        lines: [
          { n: 78, text: '    bnNew *= nActualTimespan;', highlight: true },
          { n: 79, text: '    bnNew /= params.nPowTargetTimespan;', highlight: true },
          { n: 80, text: '' },
          { n: 81, text: '    if (bnNew > bnPowLimit)' },
          { n: 82, text: '        bnNew = bnPowLimit;' },
          { n: 83, text: '' },
          { n: 84, text: '    return bnNew.GetCompact();' },
          { n: 85, text: '}' },
        ],
      },
    },
  ],
  finale: {
    title: 'Mine a block yourself — right here',
    takeaway:
      'Your browser will now do exactly what a mining rig does: hash a block header with **real double SHA-256**, bumping the nonce until the hash comes in under your chosen target. Pick a difficulty and start scanning.',
    runnerId: 'mine-a-block',
    note: 'Same hash function as Bitcoin (SHA-256 twice), same rule (hash ≤ target). The real network\'s target is astronomically harder — roughly 10^17 times harder than this page\'s hardest setting — which is exactly why it takes warehouses, not laptops.',
  },
  recap: {
    items: [
      {
        text: '**Mining is scanning, not solving** — Satoshi\'s own 2009 comment says so: hash the 80-byte header, "scan through nonce values."',
        cite: 'block.h:19',
      },
      {
        text: '**The whole rule is one comparison** — hash ≤ target, expensive to satisfy, nearly free to verify.',
        cite: 'pow.cpp:167',
      },
      {
        text: '**Difficulty is a thermostat** — measure 2,016 real blocks against 14 days, correct by at most 4×, no committee anywhere.',
        cite: 'pow.cpp:56',
      },
      {
        text: '**You mined a block with the real algorithm** — and felt the lottery firsthand: pure luck per ticket, unstoppable statistics in aggregate.',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. Next time someone says miners \"solve complex equations\" or \"control Bitcoin,\" you know better on both counts: they buy lottery tickets with electricity, under a rule you've read, at odds no one sets — and as Quest #4 showed, the rules aren't theirs to change.",
  },
};
