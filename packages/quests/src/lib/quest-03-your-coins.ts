import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #3: What stops someone from spending your coins?
 * From "where money comes from" (Quests 1–2) to "why yours is yours":
 * outputs are locked boxes, every spend must prove it holds the key, and
 * the key space is too large to search before the stars burn out.
 */
export const quest03: Quest = {
  id: 'quest-03',
  slug: 'what-stops-someone-spending-your-coins',
  number: 3,
  kicker: "Don't trust. Verify.",
  track: 'Foundations',
  title: 'What stops someone from spending your coins?',
  summary:
    'No account, no password, no fraud department. Your coins sit in public view, protected only by math. See the exact check every thief would have to defeat.',
  duration: '10 min',
  pin: BITCOIN_PIN,
  story: {
    stage: "locked to Ana",
    text: "Ana's 0.6 BTC sits in public view, in locked boxes anyone can see and only her key can open. The box builder below is literally her situation: to pay Bo she must destroy whole boxes and mint a fresh one locked to him.",
  },
  intro: [
    'Here\'s an uncomfortable fact: your bitcoin is **public**. Anyone can see the coins, and there is no login page, no fraud department, and no password reset between a thief and your money. So what actually stops them? Three pieces of code (a lock, a checkpoint, and one opcode) plus a number so large it defends you better than any bank vault ever could.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'locked-boxes',
      myth: {
        belief: "My bitcoins are stored inside my wallet app, like files on my phone.",
        reality: "Your coins are entries on the shared ledger, copied onto thousands of machines. The wallet holds only your **keys**. Delete the app and the coins sit unmoved on the ledger, spendable by anyone who holds the key, which had better still be you.",
      },
      viz: 'utxo-flow',
      title: 'Your coins are locked boxes, not account balances',
      takeaway:
        'Bitcoin has no accounts. Your "balance" is a pile of **outputs**: little locked boxes, each holding satoshis and a lock. Read the developers\' own comment: the lock says who *must be able to sign* to open it.',
      prose: [
        'This is the actual data structure your money lives in, and it holds just two fields: `nValue`, the satoshis inside (the same `CAmount` from Quest #1), and `scriptPubKey`, the lock. When someone "sends you bitcoin," they create one of these boxes locked to *your* key.',
        'Notice what "ownership" means here: nothing about identity, names, or accounts. A coin isn\'t *registered* to you; it\'s **locked** such that only your key produces an opening proof. Possession of the key *is* ownership, in the most literal sense the word has ever had.',
      ],
      annotations: [
        { lines: 'L136–37', text: 'The comment says it all: the output "contains the public key that the next input must be able to sign with to claim it."' },
        { lines: 'L142', text: 'The satoshis inside the box.' },
        { lines: 'L143', text: 'The lock: a tiny program that decides what proof opens this box.' },
      ],
      excerpt: {
        ref: { file: 'src/primitives/transaction.h', startLine: 136, endLine: 143 },
        language: 'cpp',
        lines: [
          { n: 136, text: '/** An output of a transaction.  It contains the public key that the next input', highlight: true },
          { n: 137, text: ' * must be able to sign with to claim it.', highlight: true },
          { n: 138, text: ' */' },
          { n: 139, text: 'class CTxOut' },
          { n: 140, text: '{' },
          { n: 141, text: 'public:' },
          { n: 142, text: '    CAmount nValue;', highlight: true },
          { n: 143, text: '    CScript scriptPubKey;', highlight: true },
        ],
      },
    },
    {
      id: 'checkpoint',
      contrast: [
        { aspect: "What protects your money", bank: "The bank\u2019s login, staff, and fraud department", bitcoin: "A signature check run by every node on Earth" },
        { aspect: "Password reset", bank: "Call the bank", bitcoin: "Does not exist: the key is the ownership" },
        { aspect: "Who can reverse a payment", bank: "The bank or the card network", bitcoin: "Nobody, once it is buried under work" },
      ],
      title: 'Every new spend passes this checkpoint',
      takeaway:
        'When a transaction tries to spend your boxes, **every node validating it runs this loop**, giving every input its script-and-signature check. Fail one, and the whole transaction is rejected by the entire network.',
      prose: [
        'Line 2112 is the loop: *for every single input* the transaction claims to spend, build a `CScriptCheck` (a signature-verification job pairing the box\'s lock with the spender\'s claimed proof) and run it. There is no VIP path, no override for exchanges, governments, or the developers themselves.',
        'And remember who runs this: not a central server but **every node, independently**, exactly like the coinbase audit in Quest #1. A thief doesn\'t need to fool *you*; they need to fool tens of thousands of machines all executing this same loop, and the loop only accepts one thing: a valid signature from your key.',
      ],
      annotations: [
        { lines: 'L2112', text: 'One iteration per input: every box being opened gets its own check.' },
        { lines: 'L2120–21', text: '"Verify signature": the lock from the box + the proof from the spender go in; true or false comes out.' },
        { lines: 'L2122–24', text: 'Checks either run immediately or are queued to run in parallel, but they always run.' },
      ],
      excerpt: {
        ref: { file: 'src/validation.cpp', startLine: 2112, endLine: 2124 },
        language: 'cpp',
        lines: [
          { n: 2112, text: '    for (unsigned int i = 0; i < tx.vin.size(); i++) {', highlight: true },
          { n: 2113, text: '' },
          { n: 2114, text: '        // We very carefully only pass in things to CScriptCheck which' },
          { n: 2115, text: '        // are clearly committed to by tx\' witness hash. This provides' },
          { n: 2116, text: '        // a sanity check that our caching is not introducing consensus' },
          { n: 2117, text: '        // failures through additional data in, eg, the coins being' },
          { n: 2118, text: '        // spent being checked as a part of CScriptCheck.' },
          { n: 2119, text: '' },
          { n: 2120, text: '        // Verify signature', highlight: true },
          { n: 2121, text: '        CScriptCheck check(txdata.m_spent_outputs[i], tx, validation_cache.m_signature_cache, i, flags, cacheSigStore, &txdata);', highlight: true },
          { n: 2122, text: '        if (pvChecks) {' },
          { n: 2123, text: '            pvChecks->emplace_back(std::move(check));' },
          { n: 2124, text: '        } else if (auto result = check(); result.has_value()) {' },
        ],
      },
    },
    {
      id: 'op-checksig',
      quiz: [
        {
          question: "What must a thief produce to spend your coins?",
          options: [
          "Your account password",
          "A valid signature from your private key",
          "Approval from a majority of miners",
          ],
          answer: 1,
          explain: "The lock accepts exactly one thing: a signature that verifies against the public key it names. No signature, no spend; and forging one means guessing a 78-digit number.",
        },
      ],
      title: 'The moment of truth: OP_CHECKSIG',
      takeaway:
        'Deep inside the script engine, the classic address types all come down to this: a signature and a public key go onto a stack, and **one opcode** answers a single question. *Does this proof match this lock?* (Newer taproot spends run the same curve check directly in the engine; the question never changes.)',
      prose: [
        'This is the bottom of the rabbit hole. `vchSig` is the spender\'s signature; `vchPubKey` is the public key the box is locked to. `EvalChecksig` runs the elliptic-curve math and sets `fSuccess`: true or false, no middle ground, no appeal.',
        'Here is the beautiful asymmetry that makes Bitcoin work: producing a valid signature **requires the private key**, but *checking* one requires nothing secret at all. That\'s why every node on Earth can verify your coins are protected without any of them being trusted with anything. Verification is public; the power to spend is yours alone.',
      ],
      annotations: [
        { lines: 'L1072', text: 'The recipe card: a signature and a public key go in, a true/false comes out.' },
        { lines: 'L1076–77', text: 'The two ingredients, read off the stack.' },
        { lines: 'L1080', text: 'The elliptic-curve verification itself. This line is what a thief must defeat.' },
        { lines: 'L1083', text: 'The verdict is pushed back: true (spend proceeds) or false (spend dies).' },
      ],
      excerpt: {
        ref: { file: 'src/script/interpreter.cpp', startLine: 1069, endLine: 1083 },
        language: 'cpp',
        lines: [
          { n: 1069, text: '                case OP_CHECKSIG:', highlight: true },
          { n: 1070, text: '                case OP_CHECKSIGVERIFY:' },
          { n: 1071, text: '                {' },
          { n: 1072, text: '                    // (sig pubkey -- bool)' },
          { n: 1073, text: '                    if (stack.size() < 2)' },
          { n: 1074, text: '                        return set_error(serror, SCRIPT_ERR_INVALID_STACK_OPERATION);' },
          { n: 1075, text: '' },
          { n: 1076, text: '                    valtype& vchSig    = stacktop(-2);' },
          { n: 1077, text: '                    valtype& vchPubKey = stacktop(-1);' },
          { n: 1078, text: '' },
          { n: 1079, text: '                    bool fSuccess = true;' },
          { n: 1080, text: '                    if (!EvalChecksig(vchSig, vchPubKey, pbegincodehash, pend, execdata, flags, checker, sigversion, serror, fSuccess)) return false;', highlight: true },
          { n: 1081, text: '                    popstack(stack);' },
          { n: 1082, text: '                    popstack(stack);' },
          { n: 1083, text: '                    stack.push_back(fSuccess ? vchTrue : vchFalse);', highlight: true },
        ],
      },
    },
  ],
  finale: {
    title: 'Try to guess a key yourself',
    takeaway:
      'If the only way in is a valid signature, the only attack is guessing the private key. Your browser will start guessing right now; then do the honest arithmetic on how long it would take to finish.',
    runnerId: 'guess-the-key',
    note: 'The key space is the secp256k1 curve order, a 78-digit number. The math runs in exact integer arithmetic; the guessing really is random.',
  },
  recap: {
    items: [
      {
        text: '**Your coins are locked boxes, not entries in an account**: possession of the key is ownership.',
        cite: 'transaction.h:136',
      },
      {
        text: '**Every input of every spend is signature-checked by every node**, with no VIP path and no override.',
        cite: 'validation.cpp:2112',
      },
      {
        text: '**One curve check delivers the verdict**: valid signature or dead transaction.',
        cite: 'interpreter.cpp:1069',
      },
      {
        text: '**The only attack left is guessing a key from a 78-digit space**, and your own computer just showed you how that goes.',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. The protection on your coins isn't a company's promise; it's a check you've now read, run by machines that answer to nobody. Guard the key; the code guards the rest.",
  },
  feynman: {
    prompt: "Explain to a friend why nobody can spend your bitcoin, in two sentences.",
    model:
      "Your coins sit in public locked boxes that open only for a signature from your private key, and every computer on the network independently checks that signature on every spend. The only attack left is guessing a 78-digit number.",
  },
};
