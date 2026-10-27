import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #18: Does Bitcoin waste energy? The top objection normies arrive
 * with, and one that is genuinely load-bearing to comprehension: proof-
 * of-work's energy cost IS the security model. This quest steelmans the
 * concern, shows why the cost is the product rather than a side effect,
 * and gives an honest accounting rather than a defensive one. Appended,
 * so no existing quest number shifts.
 */
export const quest18: Quest = {
  id: 'quest-18',
  slug: 'does-bitcoin-waste-energy',
  number: 18,
  kicker: 'The big question.',
  track: 'The big questions',
  title: 'Does Bitcoin waste energy?',
  summary:
    "Mining consumes electricity to search for valid proof of work. Explore how accumulated chainwork relates to attack difficulty, and why work, measured energy, efficiency and economic value are different questions.",
  duration: '10 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'paid in power',
    text: "Ana’s payment is buried under accumulated proof of work. A replacement history must be valid and carry greater cumulative work. That comparison measures expected hash work, not exact past electricity; a minority attacker can sometimes succeed by chance.",
  },
  intro: [
    "Mining consumes electricity. A current estimate needs a dated methodology, assumptions about hardware efficiency and measured or estimated hashpower. This lesson supplies no current country comparison or electricity total.",
    "Proof of work makes competing history costly to produce and cheap to compare. Energy use is a real cost, but the protocol measures hashes against targets, not joules. Efficiency improvements do not inherently break Bitcoin.",
  ],
  promise:
    "The snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b), the same three lines you met in Quest #6, read here for what they cost. Don't trust this page either.",
  stops: [
    {
      id: 'the-objection',
      title: 'Take the objection seriously',
      takeaway:
        "Electricity estimates depend on hardware, hashpower and methodology. Without a dated estimate, this lesson does not assert a current national-scale comparison. Whether the benefits justify the environmental costs is an economic and ethical judgment.",
      myth: {
        belief: 'Defenders of Bitcoin deny it uses much energy, or claim it is all renewable.',
        reality:
          "Serious answers concede the consumption is large and real, and do not pretend the energy mix is all clean. The honest argument is different: that the energy buys something specific and hard to buy any other way, and that miners are pushed toward energy nobody else wants. Overclaiming 'it's all green' is as dishonest as calling it pure waste.",
      },
      prose: [
        "For current consumption or emissions, consult a dated estimate and examine its hardware and energy-mix assumptions. Hashrate alone does not determine electricity use, and a country comparison can become stale.",
        "So the whole question reduces to one word. 'Waste' means energy spent for no purpose. To judge that, you have to know what the energy is actually for, and almost everyone arguing about it, on both sides, has never looked at the three lines of code where the spending happens. You have. Let's look again, this time asking not what they do but what they cost.",
      ],
    },
    {
      id: 'cost-is-the-product',
      title: "What proof of work measures",
      takeaway:
        "Mining searches for a hash below a target. The target determines expected attempts; a particular successful block may require more or fewer. The protocol compares cumulative expected work among valid chains rather than counting votes or measuring electricity.",
      prose: [
        "Read these three lines one more time. A block is valid only if its hash, read as a number, comes in at or under the target. There is no cleverness that finds such a hash faster than blind guessing, so the only way to produce a valid block is to try astronomically many times, and trying costs electricity. That is not a flaw in the design. It is the design.",
        "A successful hash does not certify a particular number of attempts or joules. Hardware efficiency can improve while difficulty adjusts to hashpower. Attack cost depends on equipment, availability, energy prices and the defender’s continuing work; cheap electricity alone is not a proof that security failed.",
        "Think of it like the ink in a banknote or the vault around gold: the cost is not waste, it is what makes the thing hard to counterfeit. Bitcoin moved that anti-counterfeiting cost out of physical materials and into energy, which anyone, anywhere, can spend to defend the same shared ledger.",
      ],
      annotations: [
        { lines: 'L166–67', text: 'The only test: is the hash at or under target? No shortcut exists, so satisfying it costs real energy, by design.' },
        { lines: 'L167–68', text: "A successful hash satisfies a target comparison; it does not certify a particular number of attempts or joules." },
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
      viz: 'energy-to-security',
      quiz: [
        {
          question: "What does a block’s target-derived chainwork measure?",
          options: [
            'The exact electricity spent mining the block',
            "Expected hash work represented by the target, not exact electricity or historical attempts",
            'The number of hashes the miner actually attempted',
          ],
          answer: 1,
          explain:
            "A block’s work is derived from its target. It is an expected-search measure, not a joule receipt. Efficiency improvements do not inherently break Bitcoin. Reorganization probability depends on relative hashpower, depth and assumptions, not a universal six-block or majority threshold.",
        },
      ],
    },
    {
      id: 'rewriting-costs-energy',
      title: 'The past is guarded by energy already spent',
      takeaway:
        "To replace confirmed history, an attacker needs a valid alternative chain with greater cumulative proof of work. Additional confirmations add work under the prevailing targets; they do not certify exact energy or eliminate all reorganization probability.",
      prose: [
        "You saw the mechanism in Quest #6's finale and the 51% figure in Quest #4. Now feel it in joules. Each block commits to the one before it, so changing an old transaction invalidates its block and every block stacked on top. To make the network accept the altered version, an attacker has to re-mine that entire stretch *and* extend it past the real chain, while thousands of honest machines keep adding to the real one.",
        "Chainwork adds target-derived expected work. Six confirmations are not irreversible, and their elapsed time is variable. An attacker with a minority of hashpower can sometimes catch up, while success becomes less likely with depth under common fixed-share assumptions.",
        "Proof of work supplies a costly chain-selection mechanism. Evaluating its resource cost requires explicit assumptions and comparison criteria; the source code alone cannot establish that a particular environmental or monetary trade-off is worthwhile.",
      ],
      quiz: [
        {
          question: 'What actually protects a transaction buried six blocks deep?',
          options: [
            'A password only miners know',
            'The accumulated proof-of-work an attacker would have to redo and out-race to rewrite it',
            'Bitcoin Core deleting any conflicting transaction',
          ],
          answer: 1,
          explain:
            "Each block adds target-derived work. The cost and chance of replacing history depend on relative hashpower and other assumptions. A six-block wait neither measures exactly one hour of energy nor guarantees finality.",
        },
      ],
    },
    {
      id: 'honest-accounting',
      title: 'Where the energy comes from, without the spin',
      takeaway:
        "Mining has real resource costs. Energy sources, emissions and opportunity costs need dated empirical evidence; a low price does not prove power would otherwise be wasted.",
      contrastLabels: { left: 'The lazy framing', right: 'The honest framing' },
      contrast: [
        {
          aspect: 'The energy figure',
          bank: '"It uses a whole country of power!"',
          bitcoin: 'True, and it buys tamper-proof settlement for anyone on Earth',
        },
        {
          aspect: 'The energy source',
          bank: '"It runs on coal"',
          bitcoin: "Energy sources and emissions vary; use a dated measurement rather than inferring the mix from incentives",
        },
        {
          aspect: 'The comparison',
          bank: 'Compared against zero',
          bitcoin: 'Compared against what it replaces: banking towers, cash logistics, gold mining',
        },
      ],
      prose: [
        "Miners face incentives to seek affordable power. That power may come from curtailed, stranded or conventional sources; low price does not establish zero opportunity cost, low emissions or absence of displacement. The mix requires dated empirical evidence.",
        "Claims about renewable buildout, curtailment and emissions need dated evidence and a counterfactual baseline. A use case being technically possible does not establish its share of mining or its net environmental benefit.",
        "You can distinguish the protocol’s expected-work measure from empirical energy estimates and judgments about value. Any claim about security cost or environmental benefit must state its assumptions.",
      ],
    },
  ],
  finale: {
    title: 'Price a rewrite: what would it take?',
    takeaway:
      "Explore an illustrative confirmation-depth comparison. This is not an electricity measurement or a complete attack-cost model; chainwork, relative hashpower and assumptions must be kept distinct.",
    runnerId: 'rewrite-cost',
    note: 'Figures are deliberately round and illustrative, labeled as such: they scale the real relationship (deeper transaction, more accumulated work to redo) without asserting a live hashrate or electricity price. The mechanism, not the exact dollar, is the lesson.',
  },
  recap: {
    tryIt:
      "Ask which energy estimate and which security model a claim relies on. Proof of work supports chain selection, but does not make all attacks impossible or decide whether the environmental trade-off is worthwhile.",
    items: [
      {
        text: "**Mining consumes electricity.** Its current scale requires a dated estimate, hardware-efficiency assumptions and a clear measurement boundary.",
      },
      {
        text: "**Chainwork is not a joule meter:** it is derived from targets and measures expected hash work. Efficiency improvements do not inherently invalidate that mechanism.",
        cite: 'pow.cpp:167',
      },
      {
        text: "**Additional confirmations add chainwork**, while replacement history must be valid and have greater cumulative work. Reorganization probability is model-dependent, not zero for every minority attacker.",
      },
      {
        text: "**Compare stated alternatives and counterfactuals.** Cheap power is not automatically otherwise-wasted or low-emission power.",
      },
    ],
    closing:
      "**Keep verifying:** the source establishes the hash/target condition, not a current electricity estimate or an environmental verdict. Separate protocol arithmetic, empirical measurements and value judgments.",
  },
  feynman: {
    prompt: 'Explain in three sentences why Bitcoin\'s energy use is not simply "waste," without pretending the energy is all clean.',
    model:
      "Mining consumes energy while searching for proof of work. Nodes compare cumulative target-derived work among valid chains; they do not measure past joules. Current electricity, emissions and attack costs need dated estimates and explicit assumptions. More confirmations usually increase confidence under stated hashpower assumptions, but finality remains probabilistic.",
  },
};
