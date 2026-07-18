import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #7 — What happens when you press send?
 * The capstone journey: one payment travels through everything the
 * curriculum taught — signing (Q3), the mempool gauntlet, the fee
 * auction (Q2's coinbase from the other side), and burial under
 * proof-of-work (Q6).
 */
export const quest07: Quest = {
  id: 'quest-07',
  slug: 'what-happens-when-you-press-send',
  number: 7,
  kicker: "Don't trust. Verify.",
  track: 'Foundations',
  title: 'What happens when you press send?',
  summary:
    'Follow one payment through the whole machine: the mempool\'s front door, the same checks you read in Quest #3, the fee auction, and burial under proof-of-work. Then bid in the auction yourself.',
  duration: '8 min',
  pin: BITCOIN_PIN,
  intro: [
    'You press send. Your wallet shows "pending," then "1 confirmation," then quietly stops mentioning it. Between those moments your transaction traveled through nearly every piece of code you\'ve read in this curriculum. This quest — the last of the foundations — follows it the whole way, and shows you the one decision that was ever actually yours: **the fee**.',
    'First, what your wallet did: it picked some of your locked boxes (Quest #3), wrote new boxes for the recipient and your change, and signed the whole thing with your key. Then it handed the result to a node — and knocked on this door:',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either — every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'front-door',
      viz: 'gossip-network',
      title: 'The front door: AcceptToMemoryPool',
      takeaway:
        'Before your transaction goes *anywhere*, the first node it meets audits it through this function. Pass, and the node adds it to its **mempool** — the waiting room — and gossips it onward. Fail, and it dies here, silently.',
      prose: [
        'There is no central place to "submit" a Bitcoin transaction. Your wallet hands it to one ordinary node, that node hands it to its peers, and so on across the planet — but **every single hop re-runs this same acceptance gauntlet** before agreeing to hold or relay it. Within seconds, thousands of independent machines have each audited your payment and voted with their memory to carry it.',
        'Notice `test_accept` on line 1783 — nodes can even dry-run a transaction without committing it. And notice what happens on rejection (line 1795): nothing dramatic. No error letter, no appeal. The network simply declines to remember you, which is why a well-formed transaction matters: the gauntlet is the same for a coffee payment and a billion-dollar settlement.',
      ],
      annotations: [
        { lines: 'L1782', text: 'The front door. Every transaction on Earth enters node memory through here.' },
        { lines: 'L1788', text: 'The mempool: this node\'s private waiting room of valid, not-yet-mined transactions.' },
        { lines: 'L1792–93', text: 'Build the audit\'s arguments, run the full acceptance check.' },
      ],
      excerpt: {
        ref: { file: 'src/validation.cpp', startLine: 1782, endLine: 1793 },
        language: 'cpp',
        lines: [
          { n: 1782, text: 'MempoolAcceptResult AcceptToMemoryPool(Chainstate& active_chainstate, const CTransactionRef& tx,', highlight: true },
          { n: 1783, text: '                                       int64_t accept_time, bool bypass_limits, bool test_accept)' },
          { n: 1784, text: '{' },
          { n: 1785, text: '    AssertLockHeld(::cs_main);' },
          { n: 1786, text: '    const CChainParams& chainparams{active_chainstate.m_chainman.GetParams()};' },
          { n: 1787, text: '    assert(active_chainstate.GetMempool() != nullptr);' },
          { n: 1788, text: '    CTxMemPool& pool{*active_chainstate.GetMempool()};', highlight: true },
          { n: 1789, text: '' },
          { n: 1790, text: '    std::vector<COutPoint> coins_to_uncache;' },
          { n: 1791, text: '' },
          { n: 1792, text: '    auto args = MemPoolAccept::ATMPArgs::SingleAccept(chainparams, accept_time, bypass_limits, coins_to_uncache, test_accept);' },
          { n: 1793, text: '    MempoolAcceptResult result = MemPoolAccept(pool, active_chainstate).AcceptSingleTransactionAndCleanup(tx, args);', highlight: true },
        ],
      },
    },
    {
      id: 'gauntlet',
      title: 'The gauntlet is code you\'ve already read',
      takeaway:
        'Inside the acceptance check, your old friends report for duty: **CheckTransaction** (Quest #5\'s bug-scarred door) and — right here — **CheckInputScripts**, the Quest #3 signature loop, guarding the *waiting room* just like it guards the chain.',
      prose: [
        'Line 1151 should look familiar: it\'s the exact function from Quest #3, Stop 2 — one signature verification per input — running *before* your transaction is even allowed to wait for a block. Your payment proves it owns its coins thousands of times before it\'s mined once.',
        'The comment on line 1150 is a lovely detail: signatures are checked **last**, because they\'re the expensive part, and a node being spammed with garbage shouldn\'t burn CPU verifying signatures on transactions that fail the cheap checks. Even the *ordering* of the gauntlet is defensive engineering — the mempool is a fortress that assumes siege.',
      ],
      annotations: [
        { lines: 'L1149–50', text: 'Scripts and signatures checked last — cheapest checks first, so spam can\'t exhaust the CPU.' },
        { lines: 'L1151', text: 'Quest #3\'s checkpoint, verbatim — the same loop that guards the chain guards the waiting room.' },
      ],
      excerpt: {
        ref: { file: 'src/validation.cpp', startLine: 1140, endLine: 1151 },
        language: 'cpp',
        lines: [
          { n: 1140, text: 'bool MemPoolAccept::PolicyScriptChecks(const ATMPArgs& args, Workspace& ws)', highlight: true },
          { n: 1141, text: '{' },
          { n: 1142, text: '    AssertLockHeld(cs_main);' },
          { n: 1143, text: '    AssertLockHeld(m_pool.cs);' },
          { n: 1144, text: '    const CTransaction& tx = *ws.m_ptx;' },
          { n: 1145, text: '    TxValidationState& state = ws.m_state;' },
          { n: 1146, text: '' },
          { n: 1147, text: '    constexpr script_verify_flags scriptVerifyFlags = STANDARD_SCRIPT_VERIFY_FLAGS;' },
          { n: 1148, text: '' },
          { n: 1149, text: '    // Check input scripts and signatures.' },
          { n: 1150, text: '    // This is done last to help prevent CPU exhaustion denial-of-service attacks.', highlight: true },
          { n: 1151, text: '    if (!CheckInputScripts(tx, state, m_view, scriptVerifyFlags, true, false, ws.m_precomputed_txdata, GetValidationCache())) {', highlight: true },
        ],
      },
    },
    {
      id: 'the-auction',
      title: 'The waiting room is an auction — and your fee is your bid',
      takeaway:
        'Blocks hold about a million "virtual bytes"; the waiting room often holds far more. Miners resolve this the obvious way: **highest fee-per-byte first**. This is the loop that fills a block, best-paying chunk by best-paying chunk.',
      prose: [
        'Here is Quest #2\'s coinbase seen from the other side. `GetBlockBuilderChunk` hands the miner the best-paying bundle of waiting transactions; the loop adds bundle after bundle until the block is full or (line 307) everything left pays less than the miner\'s floor — *"Everything else we might consider has a lower feerate."* Your transaction confirms when the auction reaches your bid.',
        'Nobody set this price. There\'s no fee schedule, no toll booth operator — just scarce block space, an open auction, and miners who (as Quest #1 taught you) can only collect fees the coinbase audit allows. When you choose a fee, you are bidding against every other pending payment on Earth for the next million vbytes of eternity.',
      ],
      annotations: [
        { lines: 'L302', text: 'Fetch the best-paying chunk of waiting transactions — the auction\'s current top bid.' },
        { lines: 'L305', text: 'Keep filling the block while there\'s anything worth taking.' },
        { lines: 'L307–09', text: 'The auction floor: once the best remaining chunk pays below the minimum, stop — the block is done.' },
      ],
      excerpt: {
        ref: { file: 'src/node/miner.cpp', startLine: 301, endLine: 310 },
        language: 'cpp',
        lines: [
          { n: 301, text: '    // This fills selected_transactions' },
          { n: 302, text: '    chunk_feerate = m_mempool->GetBlockBuilderChunk(selected_transactions);', highlight: true },
          { n: 303, text: '    FeePerVSize chunk_feerate_vsize = ToFeePerVSize(chunk_feerate);' },
          { n: 304, text: '' },
          { n: 305, text: '    while (selected_transactions.size() > 0) {', highlight: true },
          { n: 306, text: '        // Check to see if min fee rate is still respected.' },
          { n: 307, text: '        if (ByRatio{chunk_feerate_vsize} < ByRatio{m_options.block_min_fee_rate->GetFeePerVSize()}) {', highlight: true },
          { n: 308, text: '            // Everything else we might consider has a lower feerate' },
          { n: 309, text: '            return;' },
          { n: 310, text: '        }' },
        ],
      },
    },
    {
      id: 'set-in-stone',
      viz: 'tamper-cascade',
      title: 'Confirmed — and then buried',
      takeaway:
        'A miner wins Quest #6\'s lottery with your transaction inside their block. That\'s **1 confirmation**. Every later block buries yours under more proof-of-work — and that, says this 2009 comment, is the whole finality machine.',
      prose: [
        'Read Satoshi\'s comment once more, from your transaction\'s point of view this time: your payment was hashed into the tree (line 19), a nonce was found for the header above it (line 20), and the block was broadcast "to everyone" (line 21). Every node re-audited every transaction in it — yours included, one last time — before extending the chain.',
        'Why do exchanges wait for six confirmations? Because "undoing" your transaction now means re-mining its block *plus* every block stacked on top, faster than the honest network extends the chain — Quest #6\'s lottery, but needing to be won repeatedly, against the world, at hundreds of trillions of hashes per second. Your coffee payment ends up defended by more raw computation than any military on Earth commands. Then your wallet just says: **confirmed**.',
      ],
      annotations: [
        { lines: 'L19', text: 'Your transaction, hashed into the block\'s tree.' },
        { lines: 'L20–21', text: 'The Quest #6 lottery, won with your payment aboard.' },
        { lines: 'L21–22', text: '"Broadcast to everyone… added to the block chain" — and every block after it is another lock on the vault.' },
      ],
      excerpt: {
        ref: { file: 'src/primitives/block.h', startLine: 19, endLine: 25 },
        language: 'cpp',
        lines: [
          { n: 19, text: '/** Nodes collect new transactions into a block, hash them into a hash tree,', highlight: true },
          { n: 20, text: " * and scan through nonce values to make the block's hash satisfy proof-of-work", highlight: true },
          { n: 21, text: ' * requirements.  When they solve the proof-of-work, they broadcast the block', highlight: true },
          { n: 22, text: ' * to everyone and the block is added to the block chain.  The first transaction' },
          { n: 23, text: ' * in the block is a special one that creates a new coin owned by the creator' },
          { n: 24, text: ' * of the block.' },
          { n: 25, text: ' */' },
        ],
      },
    },
  ],
  finale: {
    title: 'Bid in the fee auction yourself',
    takeaway:
      'Here\'s a busy waiting room and one payment: yours. Slide your fee bid and watch the auction from miner.cpp decide when you confirm. The mechanism is the real one — highest feerate first, one block every ten minutes.',
    runnerId: 'fee-auction',
    note: 'A deterministic model mempool (the real one changes second to second), but the auction mechanism is exactly the one you just read: sort by fee-per-vbyte, fill ~1,000,000 vbytes, repeat.',
  },
  recap: {
    items: [
      {
        text: '**There is no "submit" server** — your transaction spreads node to node, and every node re-audits it before carrying it.',
        cite: 'validation.cpp:1782',
      },
      {
        text: '**The waiting room runs the same checks as the chain** — including Quest #3\'s signature loop, ordered cheapest-first against spam.',
        cite: 'validation.cpp:1151',
      },
      {
        text: '**Confirmation time is an auction, not a queue** — your fee bids against every pending payment for scarce block space.',
        cite: 'miner.cpp:302',
      },
      {
        text: '**Finality is burial under proof-of-work** — each new block multiplies the cost of undoing yours. No court, just cumulative electricity.',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. That completes the foundations — and the point of all seven quests: from the 21M cap to your coffee payment, every promise Bitcoin makes is a piece of code that you, a certified pleb, have now read with your own eyes. Ready to leave the classroom? The Advanced track is next: rebuild the genesis block from four numbers, then run a node and audit the money supply yourself. Don't trust. Verify. You just did.",
  },
};
