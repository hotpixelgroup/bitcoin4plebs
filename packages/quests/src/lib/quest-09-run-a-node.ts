import type { Quest } from './types.js';
import { BITCOIN_PIN, EXCERPT_COINBASE_ENFORCEMENT } from './excerpts.js';

/**
 * Quest #9: Run your own node.
 *
 * The graduation quest. Eight quests read the law; this one is about
 * enforcing it: what actually happens when a pleb runs Bitcoin Core on
 * their own machine (the full re-verification of history, the trustless
 * bootstrap, the assumevalid fine print), ending with the question the
 * whole curriculum has been building toward: ask YOUR OWN node how many
 * bitcoin exist, and check its answer against Quest #1's schedule.
 */
export const quest09: Quest = {
  id: 'quest-09',
  slug: 'run-your-own-node',
  number: 9,
  kicker: "Don't trust. Verify.",
  track: 'Advanced',
  title: 'Run your own node and audit the money supply yourself.',
  summary:
    'The final quest leaves the browser. Install the program whose source you\'ve been reading, let it re-verify seventeen years of history on your machine, then ask it (not us, not an explorer, not anyone) how many bitcoin exist.',
  duration: '12 min',
  pin: BITCOIN_PIN,
  intro: [
    'For eight quests you\'ve **read** the law. Running a node is how you **enforce** it. A node is nothing exotic: it\'s Bitcoin Core, the exact program whose source code you\'ve been reading, running on a computer you control. No coding required: if you can install a browser, you can run a node.',
    'What it costs: disk space (roughly 1 TB for the full chain, or ~10 GB in pruned mode), some bandwidth, and a few days of patience for the initial sync. What it buys: **every claim this curriculum made stops being our word and becomes your machine\'s measurement.** This quest walks through what the program actually does with those days, and ends with the supply audit Quest #1 promised you.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'rebuild-history',
      myth: {
        belief: "Running a node is the same as mining, so it needs a warehouse of hardware.",
        reality: "Nodes and miners do different jobs. A **node verifies**: any ordinary computer with disk space qualifies, and it holds the veto Quest #4 described. A **miner competes** for block rewards, and that contest does demand serious hardware. This quest is about the first job.",
      },
      title: 'Day one: your node rebuilds history from block zero',
      takeaway:
        'Nobody hands your node a balance sheet. It starts from the Quest #8 genesis block and **re-derives the entire state of Bitcoin**, downloading every block since 2009 and re-running every check you\'ve read in this curriculum. Including this old friend, once per block, over 900,000 times.',
      prose: [
        'This is called the *initial block download*, and it\'s the part that takes days. Your machine fetches each historical block from its peers and audits it exactly as if it had just been mined: Quest #3\'s signature loop on every spend, Quest #6\'s proof-of-work comparison on every header, and (above) Quest #1\'s coinbase check on every miner reward since Satoshi\'s.',
        'Understand what those days of CPU are buying. Your node never asks "what\'s the balance?" Instead it **recomputes** the answer from raw history, then keeps enforcing the rules on every new block forever. When it finally says "synced," the state it holds isn\'t downloaded trust. It\'s arithmetic your own hardware performed.',
      ],
      annotations: [
        { lines: 'L2621–22', text: 'The Quest #1 audit: during initial sync your machine runs it against every block ever mined, Satoshi\'s included.' },
        { lines: 'L2623–24', text: 'Any historical block that overpaid its miner would be rejected right here, on your hardware, seventeen years after the fact.' },
      ],
      excerpt: EXCERPT_COINBASE_ENFORCEMENT,
    },
    {
      id: 'no-front-desk',
      title: 'No signup: the network has no front desk',
      takeaway:
        'How does a brand-new node with no account and no permission find the network? **A short list of introduction services, baked into the code, run by named individuals**: asked for directions, and never trusted with anything more.',
      prose: [
        'These are DNS seeds: addresses your node queries on first launch (and again only if its own address book ever fails it) to get an initial list of peers. Look at the comments: they aren\'t companies. They\'re **individual developers, by name**, running a public service. After introductions are made, your node builds and maintains its own address book and never needs them again.',
        'Could a seed lie to you? It could serve a list of hostile peers; it would gain nothing, because your node **verifies every block those peers send** with the checks from Stop 1. Seeds can make introductions; they cannot vouch for anything. That\'s the design principle of this entire system, applied even to saying hello: verification is never delegated. (The paranoid can skip seeds entirely with `-dnsseed=0` and point at a friend\'s node by hand.)',
      ],
      annotations: [
        { lines: 'L168', text: 'A hostname and a human name. Your node asks it exactly one question: "who else is out there?"' },
        { lines: 'L168–74', text: 'Seven independent operators in several countries. Losing any or all of them inconveniences first launch, and nothing else.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 168, endLine: 174 },
        language: 'cpp',
        lines: [
          { n: 168, text: '        vSeeds.emplace_back("dnsseed.bluematt.me."); // Matt Corallo, only supports x9', highlight: true },
          { n: 169, text: '        vSeeds.emplace_back("seed.bitcoin.jonasschnelli.ch."); // Jonas Schnelli, only supports x1, x5, x9, and xd' },
          { n: 170, text: '        vSeeds.emplace_back("seed.btc.petertodd.net."); // Peter Todd, only supports x1, x5, x9, and xd' },
          { n: 171, text: '        vSeeds.emplace_back("seed.bitcoin.sprovoost.nl."); // Sjors Provoost' },
          { n: 172, text: '        vSeeds.emplace_back("dnsseed.emzy.de."); // Stephan Oeste' },
          { n: 173, text: '        vSeeds.emplace_back("seed.bitcoin.wiz.biz."); // Jason Maurice' },
          {
            n: 174,
            text: '        vSeeds.emplace_back("seed.mainnet.achownodes.xyz."); // Ava Chow, only supports x1, x5, x9, x49, x809, x849, xd, x400, x404, x408, x448, xc08, xc48, x40c',
          },
        ],
      },
    },
    {
      id: 'assumevalid',
      quiz: [
        {
          question: "By default, what does assumevalid let your node skip during initial sync?",
          options: [
          "All validation for old blocks",
          "Script checks for blocks buried beneath a reviewed block hash",
          "Nothing; every check always runs",
          ],
          answer: 1,
          explain: "Only script verification (signatures being the expensive part) is skipped, and only beneath the reviewed hash. Proof-of-work, amounts, subsidies, and double-spend checks run in full from genesis, and -assumevalid=0 refuses even the script shortcut.",
        },
      ],
      title: 'The honesty stop: a shortcut called assumevalid',
      takeaway:
        'Full disclosure, in this site\'s tradition: out of the box, your node **skips script verification** (signature checking is the expensive part of it) for blocks buried below a reviewed block hash. Every non-script rule, from proof-of-work to amounts to double-spends, still runs on every block. And one flag turns even this shortcut off.',
      prose: [
        'Line 142 names a specific block (height 938,343, released with this version after public review). During initial sync, if that block appears in your chain, blocks buried **beneath** it skip Quest #3\'s expensive signature math. The reasoning: the developers, and everyone who reviewed the release, already checked those scripts; the assumevalid hash commits to its entire ancestry, so no fake history can contain it; and line 141\'s floor makes your node ignore any chain with less total work than the chain had at release.',
        'Know what is **not** skipped, because this matters: every block\'s proof-of-work, every subsidy amount, every fee, every double-spend check, the entire supply arithmetic. Those run in full, from genesis, on your machine, regardless. And if borrowing even the signature review offends you, Bitcoin Core\'s own help text says it plainly: start with `-assumevalid=0`, described in the source as *"0 to verify all"*, and your node re-checks every signature since 2009. The shortcut is a default, never a rule. You hold the dial.',
      ],
      annotationsOpen: true,
      annotations: [
        { lines: 'L141', text: 'The work floor: your node ignores any chain claiming less total proof-of-work than this, so you can\'t be fed a cheap fake history.' },
        { lines: 'L142', text: 'The reviewed block hash. Script checks below it may be skipped; **amounts and supply never are**. Refuse it with `-assumevalid=0`.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 141, endLine: 142 },
        language: 'cpp',
        lines: [
          {
            n: 141,
            text: '        consensus.nMinimumChainWork = uint256{"0000000000000000000000000000000000000001128750f82f4c366153a3a030"};',
          },
          {
            n: 142,
            text: '        consensus.defaultAssumeValid = uint256{"00000000000000000000ccebd6d74d9194d8dcdc1d177c478e094bfad51ba5ac"}; // 938343',
            highlight: true,
          },
        ],
      },
    },
    {
      id: 'interrogate',
      title: 'Now interrogate it: how many bitcoin exist?',
      takeaway:
        'A synced node answers questions **from its own disk**. Type `bitcoin-cli gettxoutsetinfo` and your machine counts every unspent coin (Quest #3\'s locked boxes, all of them) and reports `total_amount`: the money supply, *measured*, not quoted.',
      prose: [
        'This is the moment the whole curriculum aimed at. Quest #1 verified the **schedule**: what the supply is allowed to be. Your node measures the **reality**: what the supply is. No explorer website in the middle, no API, no us: the command walks your own copy of the coin database and adds up every box.',
        'Notice `total_unspendable_amount` on the very next line: the coins **permanently excluded**. Quest #8\'s frozen genesis reward is among them, alongside rewards miners forgot to claim and outputs provably burned. It\'s why the measured number lands slightly *below* the schedule, and your node itemizes the gap. Even the missing coins are accounted for. (And enjoy line 1041: the developers labeling their own statistic "meaningless." This codebase does not flatter itself.)',
      ],
      annotations: [
        { lines: 'L1040', text: 'How many locked boxes exist right now (well over a hundred million).' },
        { lines: 'L1046', text: 'The answer: every spendable satoshi in existence, summed from your own disk.' },
        { lines: 'L1047', text: 'The destroyed coins, itemized. Satoshi\'s unspendable 50 BTC from Quest #8 lives in this number.' },
      ],
      excerpt: {
        ref: { file: 'src/rpc/blockchain.cpp', startLine: 1038, endLine: 1047 },
        language: 'cpp',
        lines: [
          { n: 1038, text: '                        {RPCResult::Type::NUM, "height", "The block height (index) of the returned statistics"},' },
          { n: 1039, text: '                        {RPCResult::Type::STR_HEX, "bestblock", "The hash of the block at which these statistics are calculated"},' },
          { n: 1040, text: '                        {RPCResult::Type::NUM, "txouts", "The number of unspent transaction outputs"},' },
          { n: 1041, text: '                        {RPCResult::Type::NUM, "bogosize", "Database-independent, meaningless metric indicating the UTXO set size"},' },
          {
            n: 1042,
            text: '                        {RPCResult::Type::STR_HEX, "hash_serialized_3", /*optional=*/true, "The serialized hash (only present if \'hash_serialized_3\' hash_type is chosen)"},',
          },
          {
            n: 1043,
            text: '                        {RPCResult::Type::STR_HEX, "muhash", /*optional=*/true, "The serialized hash (only present if \'muhash\' hash_type is chosen)"},',
          },
          {
            n: 1044,
            text: '                        {RPCResult::Type::NUM, "transactions", /*optional=*/true, "The number of transactions with unspent outputs (not available when coinstatsindex is used)"},',
          },
          {
            n: 1045,
            text: '                        {RPCResult::Type::NUM, "disk_size", /*optional=*/true, "The estimated size of the chainstate on disk (not available when coinstatsindex is used)"},',
          },
          {
            n: 1046,
            text: '                        {RPCResult::Type::STR_AMOUNT, "total_amount", "The total amount of coins in the UTXO set"},',
            highlight: true,
          },
          {
            n: 1047,
            text: '                        {RPCResult::Type::STR_AMOUNT, "total_unspendable_amount", /*optional=*/true, "The total amount of coins permanently excluded from the UTXO set (only available if coinstatsindex is used)"},',
            highlight: true,
          },
        ],
      },
    },
  ],
  finale: {
    title: 'Audit the supply: your node vs. the schedule',
    takeaway:
      'Here is the supply audit as a tool you can keep. Pick any block height and this page computes what Quest #1\'s schedule says must have been minted by then (exact satoshis, no rounding). Then paste `total_amount` from **your** node\'s `gettxoutsetinfo` and compare. The measurement must come in at or just under the schedule, never over.',
    runnerId: 'supply-check',
    translation: {
      ref: { file: 'this page · faithful JavaScript translation', startLine: 1, endLine: 8 },
      language: 'ts',
      lines: [
        { n: 1, text: 'function supplyThroughBlock(height) {' },
        { n: 2, text: '  let sum = 0n;' },
        { n: 3, text: '  for (let h = 0; h <= height; h++) {' },
        { n: 4, text: '    sum += GetBlockSubsidy(h);   // Quest #1, verbatim' },
        { n: 5, text: '  }' },
        { n: 6, text: '  return sum;                    // exact satoshis' },
        { n: 7, text: '}' },
        { n: 8, text: '// (the real code sums era-by-era: same result, fewer loops)' },
      ],
    },
    note: 'No node yet? The calculator still shows what a node at that height must report. When yours finishes syncing, come back and close the loop: schedule on the left, your own machine\'s measurement on the right, and nobody\'s word anywhere in between.',
  },
  recap: {
    items: [
      {
        text: '**A node re-derives all of Bitcoin from block zero**: days of CPU spent re-running every check in this curriculum against every block since 2009.',
        cite: 'validation.cpp:2621',
      },
      {
        text: '**Bootstrap needs introductions, never trust**: named individuals\' DNS seeds say hello; your node verifies everything they deliver.',
        cite: 'chainparams.cpp:168',
      },
      {
        text: '**The one default shortcut is disclosed and refusable**: assumevalid skips ancient signature checks only; `-assumevalid=0` re-checks even those. Amounts are always verified.',
        cite: 'chainparams.cpp:142',
      },
      {
        text: '**`gettxoutsetinfo` measures the money supply from your own disk**, and it itemizes every missing satoshi, Satoshi\'s frozen 50 BTC included.',
        cite: 'blockchain.cpp:1046',
      },
      {
        text: '**Schedule and measurement agree**: Quest #1\'s ten lines, confirmed by your own hardware against the real chain. The audit nobody can fake, run by someone nobody appointed: you.',
      },
    ],
    closing:
      "**This is graduation.** Nine quests ago you held bitcoin on the word of engineers you'd never met. Now: you've read the emission schedule and its enforcement, watched keys defeat thieves, forked the rules and felt why forking is powerless, mined a block, rebuilt the genesis block from four numbers. And you know exactly what a node does all day, fine print included. Run one. From then on, when someone asks how you know there will only ever be 21 million bitcoin, you have the only answer that was ever worth anything: *because I checked.*",
  },
};
