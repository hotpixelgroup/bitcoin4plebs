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
    "The objection everyone has heard, taken seriously. Bitcoin really does use a country's worth of electricity, and this quest shows why that cost is not a bug or a side effect: it is the exact thing that makes the ledger impossible to forge.",
  duration: '10 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'paid in power',
    text: "Ana's bike payment is buried under years of blocks now, and it is safe for a reason with a physical price: rewriting the history that contains it would mean out-burning every miner on Earth for all the time since. The energy people call wasteful is the wall her payment sits behind. This chapter is that trade, honestly weighed.",
  },
  intro: [
    "If you have heard one criticism of Bitcoin, it is this one: it uses an obscene amount of electricity, as much as a mid-sized country. That is not FUD you should wave away. It is **true**, and it deserves a real answer rather than a defensive one.",
    "The real answer is more interesting than either side's slogan. The energy is not an accident, not inefficiency to be optimized away, and not a side effect of the computation. **The energy is the product.** Understanding why is the last piece of understanding how Bitcoin is secure at all, which is why this quest exists.",
  ],
  promise:
    "The snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b), the same three lines you met in Quest #6, read here for what they cost. Don't trust this page either.",
  stops: [
    {
      id: 'the-objection',
      title: 'Take the objection seriously',
      takeaway:
        "Yes: Bitcoin's network really does consume electricity on the scale of a country. Any honest case starts by conceding that, not dodging it. The disagreement is not about the *number*; it's about the word **waste**.",
      myth: {
        belief: 'Defenders of Bitcoin deny it uses much energy, or claim it is all renewable.',
        reality:
          "Serious answers concede the consumption is large and real, and do not pretend the energy mix is all clean. The honest argument is different: that the energy buys something specific and hard to buy any other way, and that miners are pushed toward energy nobody else wants. Overclaiming 'it's all green' is as dishonest as calling it pure waste.",
      },
      prose: [
        "Estimates put Bitcoin's electricity use in the range of a country like Argentina or Norway. That is a genuinely large number and this site will not shrink it with excuses. If the energy bought nothing, it *would* be waste, and the critics would simply be right.",
        "So the whole question reduces to one word. 'Waste' means energy spent for no purpose. To judge that, you have to know what the energy is actually for, and almost everyone arguing about it, on both sides, has never looked at the three lines of code where the spending happens. You have. Let's look again, this time asking not what they do but what they cost.",
      ],
    },
    {
      id: 'cost-is-the-product',
      title: 'The cost is the product, not the price',
      takeaway:
        "Mining is guessing numbers until one hashes below the target (Quest #6). The guessing has to be **expensive**, because expense is the whole point: a block represents real energy burned, which is what makes it a costly, unfakeable vote on history.",
      prose: [
        "Read these three lines one more time. A block is valid only if its hash, read as a number, comes in at or under the target. There is no cleverness that finds such a hash faster than blind guessing, so the only way to produce a valid block is to try astronomically many times, and trying costs electricity. That is not a flaw in the design. It is the design.",
        "Here is the key inversion most people miss. In ordinary software, spending energy to compute something is *inefficiency*, and a better algorithm would spend less. In mining, the energy **is the output**. A block is essentially a receipt that says 'this much real-world energy was spent to create me.' Making that cheap would not improve Bitcoin; it would destroy the one thing the work provides, which the next stop makes concrete.",
        "Think of it like the ink in a banknote or the vault around gold: the cost is not waste, it is what makes the thing hard to counterfeit. Bitcoin moved that anti-counterfeiting cost out of physical materials and into energy, which anyone, anywhere, can spend to defend the same shared ledger.",
      ],
      annotations: [
        { lines: 'L166–67', text: 'The only test: is the hash at or under target? No shortcut exists, so satisfying it costs real energy, by design.' },
        { lines: 'L167–68', text: 'Every failed guess (trillions per second, worldwide) is electricity spent. That expenditure is precisely what a block certifies.' },
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
          question: 'Why would making mining "energy-efficient" (cheap to produce a block) actually break Bitcoin?',
          options: [
            'It would make blocks too fast for the network',
            'The energy cost IS the security: cheap blocks mean cheap history, so rewriting the past would become affordable',
            'Miners would stop earning fees',
          ],
          answer: 1,
          explain:
            "A block's value as a vote comes from the real cost behind it. If producing a block were cheap, producing a fake competing chain would be cheap too, and the ledger's immutability would evaporate. The expense is not overhead on top of the security; it is the security.",
        },
      ],
    },
    {
      id: 'rewriting-costs-energy',
      title: 'The past is guarded by energy already spent',
      takeaway:
        "This is where 'wasteful' flips into 'that IS the point.' To rewrite a confirmed transaction, an attacker must **redo all the proof-of-work** from that block to the tip, and out-pace the entire honest network doing it. Every block deep is more energy they must out-burn.",
      prose: [
        "You saw the mechanism in Quest #6's finale and the 51% figure in Quest #4. Now feel it in joules. Each block commits to the one before it, so changing an old transaction invalidates its block and every block stacked on top. To make the network accept the altered version, an attacker has to re-mine that entire stretch *and* extend it past the real chain, while thousands of honest machines keep adding to the real one.",
        "That means the security of your buried payment is measured in **accumulated energy**. Six confirmations is not a magic number; it is roughly an hour of the whole world's mining power standing between an attacker and your transaction, an hour they would have to spend again, faster, to undo it. Years-deep history is protected by more energy than most nations could marshal. The electricity 'wasted' yesterday is the wall today's ledger sits behind.",
        "So the critic and the builder are describing the same fact from opposite sides. 'It burns enormous energy' and 'its history is essentially impossible to rewrite' are not two claims to weigh against each other. They are one claim. You cannot have the second without the first, and no one has found another way to buy tamper-proof history with no trusted party. The finale lets you price a rewrite yourself.",
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
            "Depth is security because each block adds real work that a would-be rewriter must reproduce faster than the honest network adds more. Six blocks is about an hour of the entire network's energy; undoing it means out-spending all of that, then pulling ahead. That energy cost is the lock.",
        },
      ],
    },
    {
      id: 'honest-accounting',
      title: 'Where the energy comes from, without the spin',
      takeaway:
        "The honest ledger has two columns. Bitcoin spends real energy, and the mix is not all clean. But miners chase the **cheapest** power on Earth, which is often energy nobody else can use: stranded, curtailed, or flared. Weigh it against what it does, not against zero.",
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
          bitcoin: 'Some does; miners chase the cheapest power, often stranded or wasted energy',
        },
        {
          aspect: 'The comparison',
          bank: 'Compared against zero',
          bitcoin: 'Compared against what it replaces: banking towers, cash logistics, gold mining',
        },
      ],
      prose: [
        "Two things are true at once, and honesty requires holding both. Bitcoin uses a lot of energy and the global mining mix still includes plenty of fossil fuels; anyone claiming it is entirely green is selling you something. At the same time, mining has a strange economic property: it is the buyer of last resort for electricity. A miner will set up anywhere power is cheapest, and the cheapest power on Earth is energy that would otherwise be wasted, hydro spilling in a rainy season, gas being flared at oil wells, solar curtailed at midday because the grid cannot absorb it.",
        "That pushes a meaningful and growing share of mining toward energy nobody else can monetize, and even lets miners fund renewable buildout by giving it a customer during the hours demand is low. None of that makes the footprint zero, and this site will not pretend it does. The point is only that the fair comparison is not 'Bitcoin versus nothing.' It is Bitcoin versus the towers, data centers, cash trucks, and gold mines of the system it offers an alternative to. Against that baseline the question is genuinely open, not obvious.",
        "Where you land on it is yours to decide, and reasonable people weighing the same facts disagree. What you no longer have to do is argue from a slogan. You know what the energy buys, why it cannot be bought cheaper without losing the thing it buys, and where it tends to come from. That is the whole subject, honestly laid out.",
      ],
    },
  ],
  finale: {
    title: 'Price a rewrite: what would it take?',
    takeaway:
      "Pick a transaction some blocks deep and see, in round numbers, the mountain an attacker faces: redo every block's proof-of-work from there to the tip, then out-race the honest network. The 'waste' and the safety are the same number, seen from two sides.",
    runnerId: 'rewrite-cost',
    note: 'Figures are deliberately round and illustrative, labeled as such: they scale the real relationship (deeper transaction, more accumulated work to redo) without asserting a live hashrate or electricity price. The mechanism, not the exact dollar, is the lesson.',
  },
  recap: {
    tryIt:
      "Next time someone says 'Bitcoin wastes energy,' ask them one friendly question: what is the energy for? Most people have never been told it is the anti-counterfeiting cost, the thing that makes the ledger unforgeable. You can explain the whole trade in a minute now, both columns of it.",
    items: [
      {
        text: "**The consumption is real and large**, on the scale of a country. Any honest case concedes that first.",
      },
      {
        text: "**The energy is the product, not overhead**: a block certifies real cost spent, which is what makes it an unfakeable vote on history.",
        cite: 'pow.cpp:167',
      },
      {
        text: "**The past is guarded by accumulated energy**: rewriting a buried transaction means re-burning all the work since, faster than the whole network adds more.",
      },
      {
        text: "**The honest comparison is not against zero**: miners chase the cheapest, often otherwise-wasted power, and the alternative is the footprint of the system Bitcoin competes with.",
      },
    ],
    closing:
      "**Keep verifying:** the three lines above are the same ones on GitHub, and the accounting between them is yours to check against the numbers you find in the wild. 'Wasteful' and 'unforgeable' turned out to be one fact wearing two faces, and now you can argue it from the ground, not from a headline.",
  },
  feynman: {
    prompt: 'Explain in three sentences why Bitcoin\'s energy use is not simply "waste," without pretending the energy is all clean.',
    model:
      "Bitcoin really does spend a country's worth of electricity, and the mix is not all renewable, so the cost is real and worth taking seriously. But that energy is not overhead on the computation; it IS the product, because a block is essentially a receipt for real energy burned, and that cost is exactly what makes rewriting the ledger's history unaffordable to an attacker. So 'it wastes huge energy' and 'its history is practically impossible to forge' are the same fact from two sides, and the fair question is whether that tamper-proof settlement is worth its cost compared to the system it replaces, not compared to nothing.",
  },
};
