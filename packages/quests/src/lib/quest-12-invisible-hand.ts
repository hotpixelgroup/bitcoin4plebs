import type { Quest } from './types.js';
import {
  BITCOIN_PIN,
  EXCERPT_COINBASE_ENFORCEMENT,
  EXCERPT_DATACARRIER_DEFAULTS,
} from './excerpts.js';

/**
 * Quest #12: Who keeps Bitcoin usable when no one is in charge?
 * The first "Zoom out" quest: the reader has verified the rules; now they
 * see the market machine that makes following the rules the profitable
 * move, and keeps the system usable for ordinary people with no operator.
 */
export const quest12: Quest = {
  id: 'quest-12',
  slug: 'who-keeps-bitcoin-usable',
  number: 12,
  kicker: 'Zoom out.',
  track: 'Zoom out',
  title: 'Who keeps Bitcoin usable when no one is in charge?',
  summary:
    'Four crowds, zero referees: users bid, miners auction, nodes veto, builders route around pain. See the market machine in the code, then stress it yourself.',
  duration: '12 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'the busy week',
    text: "A data collectible goes viral and the queue explodes. Ana's wallet quotes a fee that makes her wince. Nobody is throttling her and nobody can: she has simply been outbid. She bids low, waits out the fad, and confirms on Saturday. The auction never once asked who she was.",
  },
  intro: [
    "Twelve quests ago you couldn't read a line of C++. Now you've verified the supply schedule, the signature check, the difficulty thermostat, and the block race. One question is left, and it's the one every newcomer actually asks first: **with no company and no government running this thing, why does it keep working for ordinary people?**",
    'The answer is not in any single function. It\'s a machine built out of four self-interested crowds: **users** who bid for space, **miners** who sell it, **nodes** who veto cheaters, and **builders** who route around pain. This quest shows you the gears of that machine in the real code, because the gears, it turns out, *are* code.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'the-machine',
      title: 'Four crowds, zero referees',
      takeaway:
        "Bitcoin has no customer-service department and no steering committee. It stays usable because **each group's selfish move happens to serve the others**, and every group is held in check by a different one.",
      prose: [
        'Users and holders want cheap, final payments, so they bid fees. Miners want those fees, so they sell blockspace to the highest bidders and obey the rules that make their reward real. Full nodes want sound money, so they audit every block for free and orphan any that cheats. And wallet builders want users, so every time fees hurt, they ship something that squeezes more payments into fewer bytes.',
        'Notice the shape: it\'s a loop, not a hierarchy. The blocks that nodes accept become the very money users bid with. Economists call an arrangement like this an **equilibrium**: no player can profit by defecting while the others play on. You have already verified the *rules* of this game letter by letter. This quest is about why the *players* keep choosing to follow them.',
      ],
      viz: 'incentive-machine',
      contrast: [
        {
          aspect: 'Who sets the price of a transfer',
          bank: 'A fee schedule, set by the institution',
          bitcoin: 'An open auction: highest sats per vbyte wins',
        },
        {
          aspect: 'Who can veto a rule change',
          bank: 'The board, in a meeting you cannot attend',
          bitcoin: 'Every node, by silently refusing bad blocks',
        },
        {
          aspect: 'What happens when demand spikes',
          bank: 'Queues, limits, and "try again later"',
          bitcoin: 'Fees rise, then engineers route around the pain',
        },
      ],
    },
    {
      id: 'fee-floor',
      title: 'You cannot be censored, only outbid',
      takeaway:
        'When the queue overflows, the mempool computes a **floor price**: pay more than the cheapest evicted bidder or wait. The floor then **decays by half every 12 hours** until the surge is over. A thermostat, in twenty lines.',
      myth: {
        belief: 'When fees spike, Bitcoin is broken and someone should fix it.',
        reality:
          'A fee spike is the auction doing its job: demand exceeded ~4 million weight units per ten minutes, so the price rose. This code guarantees the spike is also self-erasing: the floor halves every 12 hours (faster once the queue drains) until it snaps back to zero.',
      },
      prose: [
        'Your node holds waiting transactions in a bounded queue, the mempool, capped at 300 MB by default. When it overflows, the lowest-feerate package is evicted, and `trackPackageRemoved` ratchets the floor up to what the loser was paying (line 865). From that moment, bids below the floor are not even relayed. Nobody chose the number; the overflow did.',
        "Then read `GetMinFee` above it: the floor **decays exponentially**, halving every `ROLLING_FEE_HALFLIFE` (12 hours), and decays two or four times faster once the queue drains below half or a quarter full (lines 846 to 849). When it falls under half of 0.1 sat/vB it snaps to zero and the auction house is calm again. This is why every fee panic in Bitcoin's history has ended the same way: the code *forces* it to end.",
        "One honest nuance: this floor is each node's own relay behavior, not a law of the chain. A rich bidder can always hand a transaction straight to a miner. Hold that thought; it's the whole plot of stop 5.",
      ],
      annotations: [
        { lines: 'L838', text: 'The question every node can answer at any moment: what does a seat in my queue cost right now?' },
        { lines: 'L840–41', text: 'No eviction since the last block, or no floor set: answer unchanged.' },
        { lines: 'L845', text: 'The thermostat constant: ROLLING_FEE_HALFLIFE is 60 × 60 × 12 seconds (txmempool.h:212). Surges are built to fade.' },
        { lines: 'L846–49', text: 'A draining queue decays faster: below half full, twice as fast; below a quarter, four times.' },
        { lines: 'L851', text: 'Exponential decay, the same arithmetic shape as radioactive half-life.' },
        { lines: 'L854–57', text: 'Under half the minimum step (0.05 sat/vB), the floor snaps to zero. The surge is officially over.' },
        { lines: 'L859', text: 'While active, the quoted floor never drops below the incremental relay fee, 0.1 sat/vB.' },
        { lines: 'L862–68', text: 'The ratchet. Evicting a package jumps the floor to that package\'s feerate: outbid the loser or wait.' },
      ],
      excerpt: {
        ref: { file: 'src/txmempool.cpp', startLine: 838, endLine: 868 },
        language: 'cpp',
        lines: [
          { n: 838, text: 'CFeeRate CTxMemPool::GetMinFee(size_t sizelimit) const {' },
          { n: 839, text: '    LOCK(cs);' },
          { n: 840, text: '    if (!blockSinceLastRollingFeeBump || rollingMinimumFeeRate == 0)' },
          { n: 841, text: '        return CFeeRate(llround(rollingMinimumFeeRate));' },
          { n: 842, text: '' },
          { n: 843, text: '    int64_t time = GetTime();' },
          { n: 844, text: '    if (time > lastRollingFeeUpdate + 10) {' },
          { n: 845, text: '        double halflife = ROLLING_FEE_HALFLIFE;', highlight: true },
          { n: 846, text: '        if (DynamicMemoryUsage() < sizelimit / 4)' },
          { n: 847, text: '            halflife /= 4;' },
          { n: 848, text: '        else if (DynamicMemoryUsage() < sizelimit / 2)' },
          { n: 849, text: '            halflife /= 2;' },
          { n: 850, text: '' },
          { n: 851, text: '        rollingMinimumFeeRate = rollingMinimumFeeRate / pow(2.0, (time - lastRollingFeeUpdate) / halflife);', highlight: true },
          { n: 852, text: '        lastRollingFeeUpdate = time;' },
          { n: 853, text: '' },
          { n: 854, text: '        if (rollingMinimumFeeRate < (double)m_opts.incremental_relay_feerate.GetFeePerK() / 2) {' },
          { n: 855, text: '            rollingMinimumFeeRate = 0;' },
          { n: 856, text: '            return CFeeRate(0);' },
          { n: 857, text: '        }' },
          { n: 858, text: '    }' },
          { n: 859, text: '    return std::max(CFeeRate(llround(rollingMinimumFeeRate)), m_opts.incremental_relay_feerate);', highlight: true },
          { n: 860, text: '}' },
          { n: 861, text: '' },
          { n: 862, text: 'void CTxMemPool::trackPackageRemoved(const CFeeRate& rate) {' },
          { n: 863, text: '    AssertLockHeld(cs);' },
          { n: 864, text: '    if (rate.GetFeePerK() > rollingMinimumFeeRate) {' },
          { n: 865, text: '        rollingMinimumFeeRate = rate.GetFeePerK();', highlight: true },
          { n: 866, text: '        blockSinceLastRollingFeeBump = false;' },
          { n: 867, text: '    }' },
          { n: 868, text: '}' },
        ],
      },
    },
    {
      id: 'auctioneer',
      title: 'Miners take the best bids, in order',
      takeaway:
        'Block assembly is not curation. The software asks the mempool for the **highest-feerate bundle**, adds it, and repeats until the block is full. The moment a bundle pays too little, everything behind it pays less, so it stops.',
      myth: {
        belief: 'Miners decide whose transactions get in, so they can censor people they dislike.',
        reality:
          'Any one miner can skip your transaction; that only donates its fee to the next miner who will not. Blocking you outright needs a sustained majority of all hashpower refusing your money forever, while competitors profit by taking it. Even then (Quest #4) they still cannot touch your balance or the rules.',
      },
      quiz: [
        {
          question: 'Your transaction pays 2 sat/vB. A meme-coin mint pays 80 sat/vB. What does the assembly code in this stop do?',
          options: [
            'Takes the mint first, because it pays more per byte',
            'Takes yours first, because payments matter more than memes',
            'Asks the miner which one they prefer',
          ],
          answer: 0,
          explain:
            'The loop is deliberately blind: `GetBlockBuilderChunk` hands back bundles best-feerate-first, and nothing in it inspects what a transaction *means*. That neutrality is what makes censorship expensive, and it is also exactly why data fads can outbid coffee. Both halves of that trade are one design.',
        },
      ],
      prose: [
        "This is `BlockAssembler::addChunks`, the loop that fills the next block a miner will attempt. Line 302 asks the mempool for the best remaining **chunk**: a transaction together with any unconfirmed parents, ranked by combined feerate so nobody sneaks in a cheap transaction under an expensive child. Line 305 keeps taking chunks until the block's 4-million-weight budget runs out.",
        'Read lines 307 to 309 slowly, because they are the entire philosophy of mining in three lines: chunks arrive **best-first**, so the first one that pays under the minimum means everything left pays even less, and the assembler simply stops. No allowlist, no review, no opinion about what the bytes mean. The miner is an auctioneer with a gavel, not an editor with a red pen.',
        "Where does the gavel money go? You already read that in Quest #2: the coinbase claims `nFees + GetBlockSubsidy(...)` (miner.cpp:182), every bid in the room plus the minting schedule you verified in Quest #1. Serving the queue faithfully *is* the profit-maximizing strategy.",
      ],
      annotations: [
        { lines: 'L288–95', text: 'Housekeeping: when the block is nearly full, stop trying after 1,000 failed fits.' },
        { lines: 'L297–99', text: 'A chunk is a bundle: a transaction plus its unconfirmed ancestors, priced together.' },
        { lines: 'L302', text: 'Ask the mempool for the single best-paying remaining bundle. This line is the auction.' },
        { lines: 'L305', text: 'Repeat until the 4M-weight block budget is spent.' },
        { lines: 'L307–09', text: 'Bundles arrive best-first, so the first one below the minimum ends the auction: all that remains is worse.' },
      ],
      excerpt: {
        ref: { file: 'src/node/miner.cpp', startLine: 288, endLine: 310 },
        language: 'cpp',
        lines: [
          { n: 288, text: 'void BlockAssembler::addChunks()' },
          { n: 289, text: '{' },
          { n: 290, text: '    // Limit the number of attempts to add transactions to the block when it is' },
          { n: 291, text: '    // close to full; this is just a simple heuristic to finish quickly if the' },
          { n: 292, text: '    // mempool has a lot of entries.' },
          { n: 293, text: '    const int64_t MAX_CONSECUTIVE_FAILURES = 1000;' },
          { n: 294, text: '    constexpr int32_t BLOCK_FULL_ENOUGH_WEIGHT_DELTA = 4000;' },
          { n: 295, text: '    int64_t nConsecutiveFailed = 0;' },
          { n: 296, text: '' },
          { n: 297, text: '    std::vector<CTxMemPoolEntry::CTxMemPoolEntryRef> selected_transactions;' },
          { n: 298, text: '    selected_transactions.reserve(MAX_CLUSTER_COUNT_LIMIT);' },
          { n: 299, text: '    FeePerWeight chunk_feerate;' },
          { n: 300, text: '' },
          { n: 301, text: '    // This fills selected_transactions' },
          { n: 302, text: '    chunk_feerate = m_mempool->GetBlockBuilderChunk(selected_transactions);', highlight: true },
          { n: 303, text: '    FeePerVSize chunk_feerate_vsize = ToFeePerVSize(chunk_feerate);' },
          { n: 304, text: '' },
          { n: 305, text: '    while (selected_transactions.size() > 0) {', highlight: true },
          { n: 306, text: '        // Check to see if min fee rate is still respected.' },
          { n: 307, text: '        if (ByRatio{chunk_feerate_vsize} < ByRatio{m_options.block_min_fee_rate->GetFeePerVSize()}) {', highlight: true },
          { n: 308, text: '            // Everything else we might consider has a lower feerate' },
          { n: 309, text: '            return;', highlight: true },
          { n: 310, text: '        }' },
        ],
      },
    },
    {
      id: 'the-veto',
      title: 'The customers audit the auctioneer',
      takeaway:
        "Miners produce blocks; **economic nodes decide whether they count**. You've read this check before. Read it again as a market force: it converts cheating from a crime nobody polices into a product nobody buys.",
      prose: [
        'Here is Quest #1\'s enforcement one last time, wearing its network-level hat. A miner who claims one satoshi too many does not get argued with. Every node running these lines, the exchange\'s node, the shop\'s node, maybe yours from Quest #9, discards the block, and the ~3.125 BTC reward plus all its fees simply never exist. The electricity bill, however, very much does.',
        "That is why hashpower follows users and not the other way around. In 2017 this stopped being theory: over 80% of hashpower publicly backed a rule change called SegWit2x, and ordinary economic nodes refused to accept its blocks in advance. The miners folded before the fork block was ever mined, because a coin your customers won't recognize is worthless to sell. Miners are employees on commission; nodes are the customers.",
      ],
      quiz: [
        {
          question: 'In 2017, most hashpower backed the SegWit2x rule change, yet it never happened. Why?',
          options: [
            'The developers vetoed it in a software update',
            'Economic nodes would not accept the new blocks, making them unsellable',
            'A government banned the fork',
          ],
          answer: 1,
          explain:
            "Exchanges, merchants, and users running validating nodes committed to rejecting 2x blocks. Mining a coin the economy refuses to recognize burns electricity for nothing, so hashpower stood down. Enforcement (this stop's excerpt) plus a market is a veto no majority of miners can override.",
        },
      ],
      excerpt: EXCERPT_COINBASE_ENFORCEMENT,
    },
    {
      id: 'policy-taste',
      title: "Your node's taste is not the law",
      takeaway:
        'Below the consensus rules sits **policy**: what your own node agrees to relay. Policy is a personal filter, not a law, and that difference is where the loudest fight in Bitcoin lives today.',
      quiz: [
        {
          question: 'Your node refuses to relay a data-stuffing transaction. A miner mines it anyway. What does your node do with the block?',
          options: [
            'Rejects the block: the transaction broke your rules',
            'Accepts the block: relay policy is personal, block validity is consensus',
            'Asks the other nodes for a vote',
          ],
          answer: 1,
          explain:
            'Policy governs what you pass along while it waits; consensus governs what counts once mined. A confirmed transaction that follows consensus enters your chain even if you would never have relayed it. Only consensus binds everyone, which is exactly why the data fight keeps escalating toward it (Quest #13).',
        },
      ],
      prose: [
        "These six lines are among the most argued-about defaults in Bitcoin right now. `-datacarrier` decides whether your node relays transactions that carry arbitrary data in an OP_RETURN slot, and `-datacarriersize` caps how much. At this pinned commit the default cap is `MAX_STANDARD_TX_WEIGHT / WITNESS_SCALE_FACTOR`: 400,000 ÷ 4 = **100,000 vbytes**, an entire standard transaction's worth. In other words, today's Bitcoin Core ships with the data door effectively wide open, a 2025 change that split the community loudly enough to make newspapers.",
        'Here is the part that matters for the machine: these are **relay policy**, each operator\'s own taste about what to carry while it waits. They are not consensus. A transaction your node refuses to relay can still reach a miner by another path, and once mined, your node accepts the block without complaint. Filters express values; they cannot bind a determined bidder. Some Bitcoiners run [Bitcoin Knots](/core-vs-knots), a Core derivative with much stricter data defaults, precisely to express that taste.',
        'So the data question has three possible settlements: let the auction stay neutral and price it (stops 2 and 3), filter at the relay layer and accept the leaks (this stop), or escalate into consensus itself, where rules bind everyone. That third door is a proposal called BIP-110, and it gets the whole next quest.',
      ],
      annotations: [
        { lines: 'L79–80', text: 'The on/off switch: by default your node will relay data-carrying OP_RETURN outputs.' },
        { lines: 'L82', text: 'The developers\' own label: this is "the default setting", a policy knob, not a rule of the chain.' },
        { lines: 'L84', text: 'The cap: 400,000 weight ÷ 4 = 100,000 vbytes. Before v30 (2025) this default was 83 bytes.' },
      ],
      excerpt: EXCERPT_DATACARRIER_DEFAULTS,
    },
  ],
  finale: {
    title: 'Stress the network yourself',
    takeaway:
      'Throw four different shocks at a simulated network, a data fad, a greedy miner, a miner-backed rule change, a strict personal filter, and watch which feedback loop absorbs each one. The fee math is the real GetMinFee arithmetic you just read.',
    runnerId: 'stress-network',
    note: 'The fee floor uses the site\'s 1:1 translation of GetMinFee and trackPackageRemoved (txmempool.cpp:838–868), with the clock sped up so 12 simulated hours pass in seconds. Reward math is GetBlockSubsidy from Quest #1.',
  },
  recap: {
    items: [
      {
        text: '**Congestion sets its own price and its own cure**: eviction ratchets the fee floor up; a 12-hour half-life decays it back to zero.',
        cite: 'txmempool.cpp:851',
      },
      {
        text: '**Block assembly is a blind auction**: best-feerate bundle first, stop when the next one pays too little. No opinions about the bytes.',
        cite: 'miner.cpp:302',
      },
      {
        text: '**Cheating is a product nobody buys**: one satoshi over the limit and every economic node discards the block, electricity not refunded.',
        cite: 'validation.cpp:2621',
      },
      {
        text: '**Policy is taste, consensus is law**: your node can refuse to relay what it dislikes, but only consensus binds everyone.',
        cite: 'policy.h:84',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. Next time someone says Bitcoin needs an operator, you can name the four crowds who operate it by accident, and point at the gears.",
  },
  feynman: {
    prompt: 'Explain who keeps Bitcoin usable for ordinary people, in three sentences, without naming any person or company.',
    model:
      'Users bid for block space, miners profit by selling it to the highest bidders under rules they cannot bend, and every node discards any block that cheats, which makes honesty the only paying strategy. When demand spikes, fees rise, which recruits builders to fit more payments into fewer bytes, and a built-in half-life decays the surge back to zero. Nobody is in charge; each group polices a different group, and keeping the system usable is simply what maximizing their own profit looks like.',
  },
};
