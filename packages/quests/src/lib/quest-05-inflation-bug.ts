import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #5: What did the 2018 inflation bug actually do?
 * The honesty capstone: Bitcoin's code has had real bugs, including ones
 * that could have broken the 21M promise. The reader sees the actual
 * checks (whose comments cite the CVEs by name), learns how each bug was
 * found and fixed, and runs the modern checks against the attacks.
 */
export const quest05: Quest = {
  id: 'quest-05',
  slug: 'the-2018-inflation-bug',
  number: 5,
  kicker: "Don't trust. Verify.",
  track: 'Foundations',
  title: 'What did the 2018 inflation bug actually do?',
  summary:
    "The uncomfortable quest: twice in Bitcoin's history, bugs could have inflated the supply. Read the fixes (the code cites the CVEs by name) and run the attacks against today's checks.",
  duration: '9 min',
  pin: BITCOIN_PIN,
  intro: [
    "After four quests of \"the code guarantees it,\" you've earned the uncomfortable truth: **code has bugs, and Bitcoin's has had serious ones**. In 2010 someone printed 184 billion BTC. In 2018, a bug that could have allowed coin inflation sat undiscovered for nearly two years. If \"don't trust, verify\" means anything, it has to survive this quest, so let's look straight at it.",
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'the-door',
      title: 'The door every transaction walks through',
      takeaway:
        'Before any transaction touches the chain, it passes **CheckTransaction**, a gauntlet of basic sanity checks. Both of Bitcoin\'s famous inflation bugs live here, as scars turned into armor.',
      prose: [
        'This little function is where every transaction\'s story begins, whether coinbase or ordinary, yours or a miner\'s. It doesn\'t know about signatures or balances yet; it asks simpler questions first. Does this transaction have inputs at all? Outputs at all?',
        'What follows in the next two stops are the two checks in this same function that exist **because someone once got past the rules**. Bitcoin\'s protections aren\'t theoretical elegance: some of them are patches over real wounds, and the code is honest enough to name the wounds in its comments.',
      ],
      annotations: [
        { lines: 'L11', text: 'Every transaction, no exceptions, enters here to be checked.' },
        { lines: 'L14–17', text: 'The simplest sanity: money must come from somewhere and go somewhere.' },
      ],
      excerpt: {
        ref: { file: 'src/consensus/tx_check.cpp', startLine: 11, endLine: 17 },
        language: 'cpp',
        lines: [
          { n: 11, text: 'bool CheckTransaction(const CTransaction& tx, TxValidationState& state)', highlight: true },
          { n: 12, text: '{' },
          { n: 13, text: '    // Basic checks that don\'t depend on any context' },
          { n: 14, text: '    if (tx.vin.empty())' },
          { n: 15, text: '        return state.Invalid(TxValidationResult::TX_CONSENSUS, "bad-txns-vin-empty");' },
          { n: 16, text: '    if (tx.vout.empty())' },
          { n: 17, text: '        return state.Invalid(TxValidationResult::TX_CONSENSUS, "bad-txns-vout-empty");' },
        ],
      },
    },
    {
      id: 'cve-2010',
      title: 'August 2010: the day 184 billion BTC existed',
      takeaway:
        'Block 74,638 contained outputs summing to **184 billion BTC**. A value-overflow bug let the impossible total *wrap around* into a valid-looking number. The comment on line 23 still cites the CVE.',
      prose: [
        'In 2010, amounts were added up in fixed-size integers with no overflow guard. An attacker crafted two outputs so enormous their *sum* wrapped around (like a car odometer rolling past 999,999) and landed on a small, innocent-looking total. The network accepted it, and for a few hours, 184,467,440,737 BTC existed.',
        'The response set the template Bitcoin still follows: within hours, a fix added the per-output and running-total checks you\'re reading; the honest chain re-converged past the poisoned block, and the printed coins ceased to exist. Notice line 32\'s `MoneyRange`: that is *exactly* the MAX_MONEY sanity check whose comment you read in Quest #1, doing the job it was hardened for.',
      ],
      annotations: [
        { lines: 'L23', text: 'The scar, named: "see CVE-2010-5139".' },
        { lines: 'L27–30', text: 'No single output may be negative or exceed MAX_MONEY.' },
        { lines: 'L31–33', text: 'The overflow killer: the *running total* is re-checked after every output. No more odometer tricks.' },
      ],
      excerpt: {
        ref: { file: 'src/consensus/tx_check.cpp', startLine: 23, endLine: 34 },
        language: 'cpp',
        lines: [
          { n: 23, text: '    // Check for negative or overflow output values (see CVE-2010-5139)', highlight: true },
          { n: 24, text: '    CAmount nValueOut = 0;' },
          { n: 25, text: '    for (const auto& txout : tx.vout)' },
          { n: 26, text: '    {' },
          { n: 27, text: '        if (txout.nValue < 0)' },
          { n: 28, text: '            return state.Invalid(TxValidationResult::TX_CONSENSUS, "bad-txns-vout-negative");' },
          { n: 29, text: '        if (txout.nValue > MAX_MONEY)' },
          { n: 30, text: '            return state.Invalid(TxValidationResult::TX_CONSENSUS, "bad-txns-vout-toolarge");' },
          { n: 31, text: '        nValueOut += txout.nValue;', highlight: true },
          { n: 32, text: '        if (!MoneyRange(nValueOut))', highlight: true },
          { n: 33, text: '            return state.Invalid(TxValidationResult::TX_CONSENSUS, "bad-txns-txouttotal-toolarge");' },
          { n: 34, text: '    }' },
        ],
      },
    },
    {
      id: 'cve-2018',
      title: 'September 2018: the bug that was never exploited',
      takeaway:
        'CVE-2018-17144: for nearly two years, a performance optimization had removed the check below. A transaction spending **the same coin twice in one block** could crash nodes, or it could quietly **inflate the supply**. Here is the restored check, scar named on line 36.',
      prose: [
        'The bug\'s story matters as much as its mechanics. A developer working on Bitcoin Cash spotted the flaw and reported it responsibly. Core developers shipped a fix within hours, initially describing it publicly as a crash bug only. They revealed the inflation risk two days later, after it became clear others had independently worked it out; by then the fix was already spreading across the network. No coins were ever printed on Bitcoin.',
        'Read the developers\' comment on lines 37–40. It explains *exactly* what failing to run this check would cost: "either a crash or an inflation bug." This is the honest lesson of the quest: the 21M cap is not a law of physics. It\'s a promise kept by code, **and code is kept honest by people checking it**. As of five quests ago, that now includes you.',
      ],
      annotations: [
        { lines: 'L36', text: 'The scar, named: "see CVE-2018-17144".' },
        { lines: 'L41', text: 'A set that remembers every coin this transaction spends.' },
        { lines: 'L42–44', text: 'If the same coin appears twice, insertion fails and the transaction dies with "bad-txns-inputs-duplicate".' },
      ],
      excerpt: {
        ref: { file: 'src/consensus/tx_check.cpp', startLine: 36, endLine: 45 },
        language: 'cpp',
        lines: [
          { n: 36, text: '    // Check for duplicate inputs (see CVE-2018-17144)', highlight: true },
          { n: 37, text: '    // While Consensus::CheckTxInputs does check if all inputs of a tx are available, and UpdateCoins marks all inputs' },
          { n: 38, text: '    // of a tx as spent, it does not check if the tx has duplicate inputs.' },
          { n: 39, text: '    // Failure to run this check will result in either a crash or an inflation bug, depending on the implementation of' },
          { n: 40, text: '    // the underlying coins database.' },
          { n: 41, text: '    std::set<COutPoint> vInOutPoints;' },
          { n: 42, text: '    for (const auto& txin : tx.vin) {' },
          { n: 43, text: '        if (!vInOutPoints.insert(txin.prevout).second)', highlight: true },
          { n: 44, text: '            return state.Invalid(TxValidationResult::TX_CONSENSUS, "bad-txns-inputs-duplicate");', highlight: true },
          { n: 45, text: '    }' },
        ],
      },
    },
  ],
  finale: {
    title: 'Run both attacks against today\'s code',
    takeaway:
      'Below are three transactions: an honest one, the 2018 duplicate-input attack, and a 2010-style money-printer. Run CheckTransaction (translated line-for-line from the file above) and watch the checks catch each attack **with the exact error strings a real node uses**.',
    runnerId: 'run-the-check',
    translation: {
      ref: { file: 'this page · faithful translation of tx_check.cpp:23-45', startLine: 1, endLine: 14 },
      language: 'ts',
      lines: [
        { n: 1, text: 'function checkTransaction(tx) {' },
        { n: 2, text: '  // Check for negative or overflow output values (see CVE-2010-5139)' },
        { n: 3, text: '  let nValueOut = 0n;' },
        { n: 4, text: '  for (const txout of tx.vout) {' },
        { n: 5, text: '    if (txout.value < 0n) return "bad-txns-vout-negative";' },
        { n: 6, text: '    if (txout.value > MAX_MONEY) return "bad-txns-vout-toolarge";' },
        { n: 7, text: '    nValueOut += txout.value;' },
        { n: 8, text: '    if (!moneyRange(nValueOut)) return "bad-txns-txouttotal-toolarge";' },
        { n: 9, text: '  }' },
        { n: 10, text: '  // Check for duplicate inputs (see CVE-2018-17144)' },
        { n: 11, text: '  const seen = new Set();' },
        { n: 12, text: '  for (const txin of tx.vin) {' },
        { n: 13, text: '    if (seen.has(outpoint(txin))) return "bad-txns-inputs-duplicate";' },
        { n: 14, text: '    seen.add(outpoint(txin)); } return "ok"; }' },
      ],
    },
    note: 'Same logic, same error strings, running in your browser in exact integer arithmetic.',
  },
  recap: {
    items: [
      {
        text: '**Bitcoin\'s code has had real, serious bugs**: 184 billion BTC existed for a few hours in 2010.',
        cite: 'tx_check.cpp:23',
      },
      {
        text: '**The 2018 bug could have inflated the supply and was fixed before anyone exploited it**. It was found by an outside developer reading the code.',
        cite: 'tx_check.cpp:36',
      },
      {
        text: '**The scars became armor**: both checks now run on every transaction, on every node, and cite their CVEs by name.',
      },
      {
        text: '**The 21M promise is kept by verification, not magic**: the more people who can read these checks, the safer it gets. That now includes you.',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. \"Don't trust, verify\" was never a promise that the code is perfect. It's the reason imperfect code can still be trustworthy: because anyone, including you, can check it. You just did, five times.",
  },
};
