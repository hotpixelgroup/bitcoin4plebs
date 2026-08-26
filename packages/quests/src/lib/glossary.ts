/**
 * The bitcoin4plebs glossary: Bitcoin terms, the important variable names
 * from the source code, and layman's explanations for all of them.
 *
 * Same design rule as quests: PLAIN, SERIALIZABLE DATA. Definitions use
 * the RichText mini-markup. Cites point at the same pinned-commit lines
 * the quests quote; `quest` cross-links to where the reader can see the
 * term proven rather than merely defined.
 */

import type { SiteId } from './sites.js';

export interface GlossaryEntry {
  /** Display name, e.g. "Satoshi" or "CAmount". */
  term: string;
  /**
   * Restrict this entry to one front door. Absent means it appears on
   * BOTH — most vocabulary (satoshi, hash, UTXO) is shared, and a reader
   * on either site benefits from the same definition.
   */
  site?: SiteId;
  /** Render the term in code style (variable / function / RPC names). */
  code?: boolean;
  /** One of GLOSSARY_CATEGORIES. */
  category: string;
  /** Layman's explanation, RichText markup allowed. */
  definition: string;
  /** Source citation at the pinned commit, e.g. "amount.h:12". */
  cite?: string;
  /** Quest number where the reader can verify this for themselves. */
  quest?: number;
  /**
   * Which site that quest number refers to. Absent means 'bitcoin', so
   * every definition written before the split keeps pointing where it did.
   * On the other site the link renders as a cross-site link instead.
   */
  questSite?: SiteId;
  /**
   * Patterns that auto-link this term in quest prose and code excerpts
   * (tap-to-define popovers). Lowercase patterns match case-insensitively
   * on word boundaries in prose; patterns containing capitals, digits-mix,
   * or underscores match case-sensitively (code identifiers). Entries
   * without `match` are never auto-linked.
   */
  match?: string[];
}

/** Section order for the glossary page. */
export const GLOSSARY_CATEGORIES = [
  'Money & supply',
  'Keys & ownership',
  'Transactions & the mempool',
  'Blocks & mining',
  'Addresses & encoding',
  'The network & your node',
  'Rules, forks & history',
  'Lightning & channels',
] as const;

export const glossary: GlossaryEntry[] = [
  // --- Money & supply ---
  {
    term: 'Properties of money',
    match: ['properties of money', 'properties of good money'],
    category: 'Money & supply',
    definition:
      "The scorecard societies have used implicitly for millennia to pick money: scarcity, durability, portability, divisibility, fungibility, and verifiability. Whatever scored best won the job. Bitcoin trades weaker fungibility (its ledger is public) for unmatched verifiability, the one property no earlier money let ordinary people check themselves (Quest #17).",
    quest: 17,
  },
  {
    term: 'Double-spend problem',
    match: ['double-spend', 'double spend', 'double-spending'],
    category: 'Money & supply',
    definition:
      "The reason digital cash was impossible for decades: a coin made of data can be copied and 'spent' many times, so preventing it required a trusted middleman keeping the master list. Bitcoin was the first system to stop double-spending with no middleman, using a shared ledger and rules every node checks. That, not the price, is the invention (Quest #17).",
    quest: 17,
  },
  {
    term: 'Fungibility',
    match: ['fungibility', 'fungible'],
    category: 'Money & supply',
    definition:
      'The property that every unit is interchangeable with every other: one clean $20 spends like any other $20. Bitcoin is only mixed here, honestly, because the ledger is public (Quest #15), so a coin can carry a visible history that some parties may treat differently. One of the few money properties gold and cash beat it on.',
    quest: 17,
  },
  {
    term: 'Bitcoin / bitcoin (BTC)',
    category: 'Money & supply',
    definition:
      'Capital-B **Bitcoin** is the network and its rules; small-b **bitcoin** is the money those rules account for. One bitcoin is not a thing that exists anywhere; it is the display name for 100,000,000 satoshis.',
    quest: 1,
  },
  {
    term: 'Satoshi (sat)',
    match: ['satoshis'],
    category: 'Money & supply',
    definition:
      "The smallest unit of bitcoin and the only one the software actually counts. Every balance and payment is a whole number of satoshis: there are no fractions inside Bitcoin, which is why every computer on Earth computes identical results.",
    cite: 'amount.h:11',
    quest: 1,
  },
  {
    term: 'CAmount',
    match: ['CAmount'],
    code: true,
    category: 'Money & supply',
    definition:
      'The type Bitcoin Core uses for every amount of money: a 64-bit whole number of satoshis. When your wallet shows "0.5 BTC," the software is holding the number 50,000,000.',
    cite: 'amount.h:12',
    quest: 1,
  },
  {
    term: 'COIN',
    match: ['COIN'],
    code: true,
    category: 'Money & supply',
    definition:
      'The constant 100,000,000, which is how many satoshis make one displayed bitcoin. Mostly a display convention: consensus code uses it only as shorthand for a satoshi count (50 * COIN, 21000000 * COIN), and no rule cares about the 1-BTC unit itself.',
    cite: 'amount.h:15',
    quest: 1,
  },
  {
    term: 'MAX_MONEY',
    match: ['MAX_MONEY'],
    code: true,
    category: 'Money & supply',
    definition:
      'A sanity rail: no single amount may exceed 21,000,000 × COIN. The developers\' own comment stresses it is **not** what creates the supply cap; the cap emerges from the halving arithmetic. It exists so an overflow bug can\'t conjure absurd amounts.',
    cite: 'amount.h:26',
    quest: 1,
  },
  {
    term: 'Block subsidy',
    match: ['block subsidy', 'subsidy'],
    category: 'Money & supply',
    definition:
      'The brand-new satoshis a miner is allowed to create in a block: 50 BTC at launch, halved every 210,000 blocks. The subsidy plus the block\'s fees is everything a miner may collect, and every node checks it.',
    cite: 'validation.cpp:1846',
    quest: 2,
  },
  {
    term: 'GetBlockSubsidy',
    match: ['GetBlockSubsidy'],
    code: true,
    category: 'Money & supply',
    definition:
      "The ten-line function that IS Bitcoin's monetary policy: take the block height, count the halvings, divide 50 BTC by two that many times, discard remainders. No committee, no dial, just this.",
    cite: 'validation.cpp:1846',
    quest: 1,
  },
  {
    term: 'Halving',
    match: ['halving', 'halvings'],
    category: 'Money & supply',
    definition:
      'Every 210,000 blocks (~4 years) the block subsidy is cut in half: 50 → 25 → 12.5 → … → 0. There is no ceremony: one block pays the old amount, the next pays the new one, and the change is enforced by every node running the same division.',
    cite: 'validation.cpp:1855',
    quest: 2,
  },
  {
    term: 'nSubsidyHalvingInterval',
    match: ['nSubsidyHalvingInterval'],
    code: true,
    category: 'Money & supply',
    definition:
      'The parameter that sets "every 210,000 blocks" for the halving. Written once in the mainnet definition. Change it in your copy and your node simply stops being on Bitcoin.',
    cite: 'chainparams.cpp:114',
    quest: 1,
  },
  {
    term: 'Reward era',
    category: 'Money & supply',
    definition:
      'The span between two halvings, during which every block pays the same subsidy. There are exactly 33 eras with a non-zero reward; era 33 pays a single satoshi per block, and the last one is minted at block 6,929,999.',
    quest: 2,
  },
  {
    term: 'The 21 million cap',
    match: ['21 million cap'],
    category: 'Money & supply',
    definition:
      'The sum of every block subsidy that will ever be paid: 2,099,999,997,690,000 satoshis, just *under* 21M BTC, because whole-number division discards remainders. An outcome of the schedule, not a setting; your own browser can sum it in Quest #1.',
    quest: 1,
  },
  {
    term: 'Unspendable coins',
    match: ['unspendable'],
    category: 'Money & supply',
    definition:
      "Satoshis that exist on paper but can never move: the genesis block's 50 BTC (never entered into the spendable-coin database), rewards miners forgot to claim, and outputs provably burned. They're why a node's measured supply comes in slightly *under* the schedule.",
    cite: 'chainparams.cpp:59',
    quest: 8,
  },

  // --- Keys & ownership ---
  {
    term: 'Private key',
    match: ['private key', 'private keys'],
    category: 'Keys & ownership',
    definition:
      'A gigantic secret number (roughly 78 digits). Whoever knows it can produce signatures that spend the coins locked to its public key, and that is the *entire* meaning of "owning" bitcoin. There is no account behind it and no reset button.',
    quest: 3,
  },
  {
    term: 'Public key',
    match: ['public key', 'public keys'],
    category: 'Keys & ownership',
    definition:
      'The shareable half of a keypair, derived from the private key by one-way elliptic-curve math. Anyone can use it to *check* a signature; nobody can walk it backwards to the private key.',
    quest: 3,
  },
  {
    term: 'Digital signature',
    match: ['signature', 'signatures'],
    category: 'Keys & ownership',
    definition:
      'A proof, computed from a private key and a specific transaction, that convinces every node the key-holder approved *this exact spend*. Valid for that transaction only; copying it elsewhere proves nothing.',
    quest: 3,
  },
  {
    term: 'secp256k1',
    match: ['secp256k1'],
    category: 'Keys & ownership',
    definition:
      "The specific elliptic curve Bitcoin's signatures use. Its key space is a number with 78 digits, so guessing a key is not \"hard\" in the everyday sense; it is out of reach of every computer humanity will ever build.",
    quest: 3,
  },
  {
    term: 'Key space',
    match: ['key space'],
    category: 'Keys & ownership',
    definition:
      'The set of all possible private keys: about 2²⁵⁶. If every human alive checked a billion keys per second since the Big Bang, the search would still be effectively at zero percent.',
    quest: 3,
  },
  {
    term: 'Quantum computing (the footnote)',
    match: ['quantum'],
    category: 'Keys & ownership',
    definition:
      "The one honest asterisk on \"keys are unguessable.\" Breaking secp256k1 needs Shor's algorithm running on a fault-tolerant quantum computer millions of times beyond anything built. The nuance Bitcoiners track: coins behind fresh, never-spent-from addresses (public key not yet revealed) are the safest, and if the machines ever loom, migrating to post-quantum signatures is a soft-fork question (Quest #4), not an overnight emergency.",
    quest: 3,
  },
  {
    term: 'OP_CHECKSIG',
    match: ['OP_CHECKSIG'],
    code: true,
    category: 'Keys & ownership',
    definition:
      'The opcode at the bottom of the rabbit hole: a signature and a public key go in, the curve math runs, and a single true/false comes out. Most spends funnel through this verdict; taproot key-path spends run the same curve check directly in the engine.',
    cite: 'interpreter.cpp:1069',
    quest: 3,
  },
  {
    term: 'Wallet',
    category: 'Keys & ownership',
    definition:
      'Software that manages keys and builds transactions. Despite the name it holds no coins; those live in outputs on every node\'s disk. A wallet holds *keys*, watches the chain, and does the paperwork.',
    quest: 7,
  },
  {
    term: 'Seed phrase',
    match: ['seed phrase', 'seed words', 'mnemonic'],
    category: 'Keys & ownership',
    definition:
      'Typically 12 or 24 dictionary words encoding the randomness from which a wallet derives all its keys: one giant random number in costume, with a built-in checksum so typos announce themselves (BIP-39, quoted and run in Quest #14). Whoever has the words has the money, so they are for paper and steel, **never** for websites, photos, or anyone who asks. No legitimate service ever needs them.',
    quest: 14,
  },
  {
    term: 'Passphrase (the 25th word)',
    match: ['passphrase'],
    category: 'Keys & ownership',
    definition:
      'An optional extra word mixed into the seed derivation. Every value produces a different, valid wallet, including the empty one, so a thief with your paper still has nothing, and a mistyped passphrase opens a perfectly real, perfectly empty wallet with no error message. Power and hazard in equal measure; back it up like the words.',
    quest: 14,
  },
  {
    term: 'Hardware wallet (HWW)',
    match: ['hardware wallet', 'hardware signer', 'HWW'],
    category: 'Keys & ownership',
    definition:
      'A small offline device whose one job is holding keys and signing transactions without the keys ever touching a networked computer. It stores keys, not coins: destroy the device, restore the seed words on any replacement, and everything reappears. The seed backup is the wallet; the gadget is a safe way to use it.',
    quest: 14,
  },
  {
    term: 'Self-custody',
    match: ['self-custody'],
    category: 'Keys & ownership',
    definition:
      'Holding your own keys instead of an IOU: nobody can freeze, lend, or lose your coins but you. The trade is responsibility for a single well-made backup. The opposite is custodial holding, where a company keeps the keys and you keep a promise, a promise Mt. Gox and FTX customers remember well.',
    quest: 14,
  },

  {
    term: 'Entropy',
    match: ['entropy'],
    category: 'Keys & ownership',
    definition:
      'Randomness: how unpredictable something is. High entropy means nobody can guess it, not with every computer on Earth. Your seed words are only as safe as the randomness they were born from, which is why this is the one step worth checking rather than trusting ([the security playbook](/security)).',
    quest: 14,
  },
  {
    term: 'RNG (random number generator)',
    match: ['RNG'],
    category: 'Keys & ownership',
    definition:
      'The thing that produces the randomness. A wallet asks its RNG for a number, and that number becomes your seed. If the RNG is weak, everything built on top of it is guessable no matter how strong the rest of the cryptography is.',
    quest: 14,
  },
  {
    term: 'TRNG (true random number generator)',
    match: ['TRNG'],
    category: 'Keys & ownership',
    definition:
      'A chip that harvests randomness from physics itself, such as electrical noise, rather than from arithmetic. Physics has no pattern to learn, so a working TRNG is genuinely unguessable. The catch is that you cannot see whether it is working, which is the argument for adding your own dice rolls.',
    quest: 14,
  },
  {
    term: 'CSPRNG (cryptographically secure RNG)',
    match: ['CSPRNG', 'CRNG'],
    category: 'Keys & ownership',
    definition:
      'Randomness strong enough to keep secrets: even someone watching a long run of its output cannot predict the next number. It stretches a small amount of true randomness into a lot of usable randomness, so it is only ever as good as the real entropy it was fed. Garbage in, guessable out.',
    quest: 14,
  },
  {
    term: 'Faraday cage',
    match: ['Faraday cage'],
    category: 'Keys & ownership',
    definition:
      'A metal enclosure that blocks radio waves going in or out. Storing a signing device inside one means it holds no wireless conversation with anything while it sits there. Belt-and-braces for high-value storage, never a substitute for a good backup.',
  },
  {
    term: 'Ephemeral seed',
    match: ['ephemeral seed'],
    category: 'Keys & ownership',
    definition:
      "A temporary seed that lives only in a device's memory while you use it and vanishes the moment the power goes off. Useful for a throwaway wallet or a quick test. Dangerous if you forget it is temporary, because nothing was written down and there is nothing to restore.",
  },
  {
    term: 'Single-sig',
    match: ['single-sig', 'single sig'],
    category: 'Keys & ownership',
    definition:
      'One key moves the money. Simple, and what nearly everyone starts with, but it makes you choose which disaster to fear: a stolen key or a lost one. Multisig is the answer to both.',
    quest: 14,
  },
  {
    term: 'Multisig',
    match: ['multisig', 'multi-signature'],
    category: 'Keys & ownership',
    definition:
      'Several keys, kept apart, where an agreed number of them must sign together. A 2-of-3 wallet needs any two of its three keys to move a satoshi, so a thief with one key gets nothing and you can lose one key and still recover everything. Laid out step by step on [the security playbook](/security).',
    quest: 14,
  },
  {
    term: 'Xpub (extended public key)',
    match: ['xpub', 'extended public key'],
    category: 'Keys & ownership',
    definition:
      'One public key that can generate every receive address in a wallet. It cannot spend anything, which makes it safe to hand to a watch-only app. It also reveals your whole history and every future address to whoever holds it, so treat it as private even though it is not a secret key (Quest #15).',
    quest: 15,
  },
  {
    term: 'Derivation path',
    match: ['derivation path'],
    category: 'Keys & ownership',
    definition:
      "The coordinates of your addresses in the wallet's family tree. The seed makes the keys; the path says where to look for them. Restored your seed and see a zero balance? That is almost always the wrong path, not lost coins. Do not panic, and do not retype your seed anywhere. Check the path first.",
    quest: 14,
  },
  {
    term: 'Bricking',
    match: ['bricking', 'bricked'],
    category: 'Keys & ownership',
    definition:
      'When a device stops working permanently: as useful as a brick. For a hardware wallet this is an inconvenience, not a disaster, because the coins live on the ledger and your seed backup rebuilds the wallet on any replacement. The device dying is survivable. The backup being bad is not.',
    quest: 14,
  },
  {
    term: 'Dusting attack',
    match: ['dusting'],
    category: 'Transactions & the mempool',
    definition:
      'An attacker sends tiny, nearly worthless amounts to thousands of addresses, then watches which ones later get spent together. It is a tracking device, not a theft: the crumbs are bait for the clustering heuristics in Quest #15. The defence is coin control, so you never spend the dust alongside real coins.',
    quest: 15,
  },
  {
    term: 'Change output',
    match: ['change output', 'change address'],
    category: 'Transactions & the mempool',
    definition:
      "Coins are boxes spent whole, so paying 0.6 from a 1.0 box creates a second output returning 0.4 to yourself: the change. Watchers guess which output is change to keep following you; your wallet fights back by sending change to a brand-new address every time (`GetNewChangeDestination`, the name is the policy).",
    cite: 'wallet.cpp:2639',
    quest: 15,
  },
  {
    term: 'Clustering (chain analysis)',
    match: ['clustering', 'chain analysis', 'common-input'],
    category: 'Transactions & the mempool',
    definition:
      'The watcher\'s craft: collapsing many addresses into one presumed owner, mainly via the common-input heuristic (inputs spent together share a signer) plus change detection. The whitepaper itself warned multi-input spends "necessarily reveal" common ownership. Defense is behavioral: fresh addresses, deliberate spending, no careless consolidation.',
    quest: 15,
  },
  {
    term: 'Coin control',
    match: ['coin control'],
    category: 'Transactions & the mempool',
    definition:
      'A wallet feature that lets you choose exactly which of your coin-boxes fund a payment, instead of letting automatic selection merge them. The manual override for privacy: what gets spent together gets clustered together, so choosing is power.',
    quest: 15,
  },
  {
    term: 'CoinJoin & PayJoin',
    match: ['coinjoin', 'payjoin'],
    category: 'Transactions & the mempool',
    definition:
      'Collaborative transactions that break the common-input heuristic on purpose. A CoinJoin mixes many strangers\' inputs into one transaction, so "spent together, owned together" stops being true. A PayJoin is subtler: the *recipient* adds an input to an ordinary-looking payment, so the heuristic silently fails while nothing looks unusual. The watcher\'s one great trick, answered.',
    quest: 15,
  },

  // --- Transactions & the mempool ---
  {
    term: 'Transaction',
    category: 'Transactions & the mempool',
    definition:
      'A signed message that opens some existing coin-boxes (inputs) and creates new ones (outputs). It never says who anyone is, only that the proofs open the locks and the amounts balance.',
    quest: 7,
  },
  {
    term: 'Output / UTXO',
    match: ['utxo', 'utxos'],
    category: 'Transactions & the mempool',
    definition:
      'The box your money actually lives in: an amount of satoshis plus a lock. "UTXO" = unspent transaction output, a box not yet opened. Your "balance" is just your wallet adding up boxes it holds keys for.',
    cite: 'transaction.h:136',
    quest: 3,
  },
  {
    term: 'Input',
    category: 'Transactions & the mempool',
    definition:
      'A reference to an existing output plus the proof (signature) that opens its lock. Every input of every new transaction is signature-checked by every node before it is relayed or mined; only deep-buried history can skip this, under assumevalid (see that entry).',
    cite: 'validation.cpp:2112',
    quest: 3,
  },
  {
    term: 'scriptPubKey',
    match: ['scriptPubKey'],
    code: true,
    category: 'Transactions & the mempool',
    definition:
      'The lock on an output: a tiny program that says what proof opens the box (usually "a signature matching this key-hash"). An address is this lock, re-spelled for humans.',
    cite: 'transaction.h:143',
    quest: 3,
  },
  {
    term: 'scriptSig & witness',
    match: ['scriptSig'],
    code: true,
    category: 'Transactions & the mempool',
    definition:
      'The opening proof a spender attaches to an input: the key that fits the scriptPubKey lock. Modern (SegWit) transactions carry it in a separate "witness" section; old ones inline as scriptSig. Same job either way.',
    quest: 3,
  },
  {
    term: 'Coinbase transaction',
    match: ['coinbase'],
    category: 'Transactions & the mempool',
    definition:
      "The first transaction of every block; the only one allowed to create satoshis from nothing, and only up to subsidy + fees. Named after the free-form \"coinbase\" field it carries (Satoshi used it for a newspaper headline). Nothing to do with the company.",
    cite: 'validation.cpp:2621',
    quest: 2,
  },
  {
    term: 'Transaction fee',
    category: 'Transactions & the mempool',
    definition:
      'Inputs minus outputs: whatever value a transaction leaves unclaimed belongs to the miner who includes it. Not a toll set by anyone: it\'s your bid in the open auction for block space.',
    quest: 7,
  },
  {
    term: 'Feerate (sats per vbyte)',
    match: ['feerate', 'vbytes', 'vbyte', 'sat/vB', 'sats per vbyte'],
    category: 'Transactions & the mempool',
    definition:
      "What miners actually sort by: fee divided by the transaction's size in **virtual bytes**, so a small transaction can outbid a huge one paying more in total. For feel: a typical one-input, two-output payment is ~140 vbytes, so 10 sat/vB means ~1,400 sats of total fee, whether you send 0.001 BTC or 1,000. A block fits ~1,000,000 vbytes: up to ~7,000 of the simplest payments, a few thousand in practice.",
    cite: 'miner.cpp:302',
    quest: 7,
  },
  {
    term: 'Change',
    category: 'Transactions & the mempool',
    definition:
      "Boxes can't be part-opened, so if you spend a 1.0 BTC output to pay 0.3, your wallet adds an output sending 0.7-minus-fee back to a fresh address of yours. That's the mystery second output in most transactions.",
    quest: 7,
  },
  {
    term: 'Mempool',
    match: ['mempool'],
    category: 'Transactions & the mempool',
    definition:
      "Each node's private waiting room of valid-but-unmined transactions. There is no global queue; every node keeps its own, and miners fill blocks from theirs, best-paying first.",
    cite: 'validation.cpp:1788',
    quest: 7,
  },
  {
    term: 'AcceptToMemoryPool',
    match: ['AcceptToMemoryPool'],
    code: true,
    category: 'Transactions & the mempool',
    definition:
      'The front door: the function every node runs on every transaction it hears about, before agreeing to hold or relay it. Fail any check and the transaction dies quietly: no error letter, no appeal.',
    cite: 'validation.cpp:1782',
    quest: 7,
  },
  {
    term: 'Confirmation',
    match: ['confirmations', 'confirmation'],
    category: 'Transactions & the mempool',
    definition:
      'Your transaction is "confirmed" when a mined block includes it (that\'s 1 confirmation), and every block stacked on top adds another. Each one adds another block of proof-of-work an attacker would have to redo, and slashes their odds of ever catching up. For feel: one confirmation is ~10 minutes, six (the customary "final" for large sums) is about an hour.',
    quest: 7,
  },
  {
    term: 'Replace-by-fee (RBF)',
    match: ['replace-by-fee', 'rbf'],
    category: 'Transactions & the mempool',
    definition:
      "The sender's escape hatch for an underbid transaction: rebroadcast the payment with a higher fee, and nodes swap the old bid out of their mempools for the new one (BIP-125: the replacement must pay strictly more). The flip side is a habit, not a rule: an unconfirmed, replaceable payment is not final yet, so large settlements wait for a confirmation.",
    quest: 7,
  },
  {
    term: 'Child pays for parent (CPFP)',
    match: ['child pays for parent', 'cpfp'],
    category: 'Transactions & the mempool',
    definition:
      "The recipient's escape hatch: spend the unconfirmed coins in a new \"child\" transaction with a generous fee. Miners price a transaction together with its unconfirmed parents, so the child's fee pulls the stuck parent into a block. It works even when the sender never enabled RBF.",
    quest: 7,
  },
  {
    term: 'Dust',
    match: ['dust'],
    category: 'Transactions & the mempool',
    definition:
      "An output so small that spending it would cost more in fees than it is worth. Nodes refuse to relay new transactions that create outputs below a policy dust threshold, precisely so the ledger doesn't fill with unspendable pocket lint. Practical takeaway: consolidate your small UTXOs while fees are cheap, not during a spike.",
    cite: 'policy.h',
    quest: 12,
  },

  // --- Blocks & mining ---
  {
    term: 'Unforgeable costliness',
    match: ['unforgeable costliness'],
    category: 'Blocks & mining',
    definition:
      "Why proof-of-work burns energy on purpose. A block is essentially a receipt that real electricity was spent to make it, and that cost is what makes it impossible to fake cheaply, the digital equivalent of the labor in a gold bar. Making mining 'efficient' would not improve Bitcoin; it would destroy the security the cost provides (Quest #18).",
    quest: 18,
  },
  {
    term: 'Block',
    category: 'Blocks & mining',
    definition:
      'A batch of transactions plus an 80-byte header, chained to its parent by hash. Found roughly every ten minutes by the mining lottery, then independently re-verified by every node on Earth.',
    cite: 'block.h:19',
    quest: 6,
  },
  {
    term: 'Block header',
    match: ['block header', '80-byte header'],
    category: 'Blocks & mining',
    definition:
      'The 80 bytes miners actually hash: version, parent-block hash, merkle root, timestamp, difficulty bits, nonce. Everything else in a block is committed *through* the merkle root.',
    quest: 6,
  },
  {
    term: 'Block height',
    match: ['block height'],
    category: 'Blocks & mining',
    definition:
      'A block\'s position in the chain, counting the genesis block as height 0. The halving schedule, and much else, is written in terms of height.',
    quest: 1,
  },
  {
    term: 'Hash (SHA-256)',
    match: ['sha-256'],
    category: 'Blocks & mining',
    definition:
      'A function that turns any data into a fixed 256-bit fingerprint. Change one letter of the input and the output changes beyond recognition; nobody can steer it or run it backwards. Bitcoin\'s workhorse.',
    quest: 6,
  },
  {
    term: 'Double SHA-256',
    match: ['double sha-256'],
    category: 'Blocks & mining',
    definition:
      "Bitcoin's convention for block and transaction IDs: run SHA-256, then run it again on the result. Your browser does exactly this in Quests #6 and #8, using the same function as every mining rig.",
    quest: 8,
  },
  {
    term: 'Merkle root',
    match: ['merkle root', 'merkle tree', 'merkle'],
    category: 'Blocks & mining',
    definition:
      "One hash that fingerprints every transaction in a block, built by hashing pairs into a tree. It's how 80 bytes of header can commit to megabytes of transactions: touch any transaction and the root shatters.",
    quest: 8,
  },
  {
    term: 'Nonce',
    match: ['nonce', 'nNonce'],
    code: true,
    category: 'Blocks & mining',
    definition:
      'The header field miners scan through (1, 2, 3, …), rerolling the block\'s hash until one lands under the target. The genesis block\'s winning ticket was 2,083,236,893. "Number used once."',
    cite: 'chainparams.cpp:158',
    quest: 6,
  },
  {
    term: 'nBits & target',
    match: ['nBits'],
    code: true,
    category: 'Blocks & mining',
    definition:
      'The target is the number a block\'s hash must not exceed; `nBits` is its compact 4-byte encoding in the header. Lower target = fewer winning hashes = harder mining.',
    cite: 'pow.cpp:167',
    quest: 6,
  },
  {
    term: 'Difficulty',
    match: ['difficulty'],
    category: 'Blocks & mining',
    definition:
      'A human-friendly way of saying how low the target is, expressed as a multiple of the easiest-ever (genesis) difficulty. When you read "difficulty hit a new high," it means the target dropped again.',
    quest: 6,
  },
  {
    term: 'Difficulty adjustment',
    match: ['difficulty adjustment', 'retarget', 'retargeting'],
    category: 'Blocks & mining',
    definition:
      'Every 2,016 blocks, each node measures how long they actually took versus the intended two weeks and retunes the target, with the correction clamped to 4× either way. A thermostat with no thermostat-keeper.',
    quest: 6,
  },
  {
    term: 'Proof-of-work',
    match: ['proof-of-work', 'proof of work'],
    category: 'Blocks & mining',
    definition:
      'Evidence, checkable in microseconds, that enormous amounts of guessing went into finding a block: its hash is under the target, and hashes can\'t be steered. Expensive to produce, nearly free to verify: the asymmetry the whole system leans on.',
    cite: 'pow.cpp:167',
    quest: 6,
  },
  {
    term: 'Miner',
    category: 'Blocks & mining',
    definition:
      'Anyone burning electricity on the hash lottery for the right to append the next block and collect subsidy + fees. Miners order transactions; they do **not** make the rules, because every block they find is audited by every node.',
    quest: 4,
  },
  {
    term: 'Genesis block',
    match: ['genesis block'],
    category: 'Blocks & mining',
    definition:
      'Block 0, mined by Satoshi on 3 January 2009, carrying that day\'s Times headline and 50 forever-unspendable BTC. Its parent pointer is all zeros, and every node re-checks its hash at every startup.',
    cite: 'chainparams.cpp:160',
    quest: 8,
  },
  {
    term: 'Reorg',
    match: ['reorg', 'reorgs'],
    category: 'Blocks & mining',
    definition:
      'When two miners find blocks near-simultaneously, the chain briefly forks; nodes follow whichever branch accumulates more work, discarding the loser (usually one block deep). It\'s why exchanges wait for several confirmations.',
    quest: 7,
  },
  {
    term: '51% attack',
    match: ['51% attack'],
    category: 'Blocks & mining',
    definition:
      'What a hashpower majority can actually do: reorder *recent* blocks (enabling double-spends of fresh payments). What it cannot do: print coins, steal keys, or change rules, because rule-breaking blocks are discarded by every node no matter how much work they carry.',
    cite: 'validation.cpp:2621',
    quest: 4,
  },

  // --- Addresses & encoding ---
  {
    term: 'Address',
    category: 'Addresses & encoding',
    definition:
      'Not an account and not a place: the recipe for a lock, spelled so a human can carry it. Senders rebuild the scriptPubKey from the letters. Wallets can mint unlimited fresh ones offline; use a new one each time.',
    cite: 'key_io.cpp:45',
    quest: 10,
  },
  {
    term: 'Bech32',
    match: ['bech32'],
    category: 'Addresses & encoding',
    definition:
      'The spelling system behind bc1q addresses: a 32-letter alphabet (5 bits per letter), a network prefix, and a 6-letter checksum with a proven typo-detection guarantee.',
    cite: 'bech32.cpp:23',
    quest: 10,
  },
  {
    term: 'Bech32m',
    match: ['bech32m'],
    category: 'Addresses & encoding',
    definition:
      'Bech32 with one constant changed, used for witness version 1 and up (bc1p taproot addresses). The tweak fixed an obscure weakness and made the two formats reject each other cleanly.',
    quest: 10,
  },
  {
    term: 'Human-readable part (bc)',
    match: ['human-readable part'],
    code: true,
    category: 'Addresses & encoding',
    definition:
      'The network tag in front of an address: `bc` for mainnet, `tb` for testnet, set as `bech32_hrp` beside the other network constants. It participates in the checksum, so an address can\'t quietly cross networks.',
    cite: 'chainparams.cpp:182',
    quest: 10,
  },
  {
    term: 'Witness version',
    match: ['witness version'],
    category: 'Addresses & encoding',
    definition:
      'The first data value of a modern address, 0–16: the lock\'s generation number. Version 0 is spelled `q` (hence bc1q…), version 1 is spelled `p` (taproot\'s bc1p…). New versions let Bitcoin upgrade locks without breaking old ones.',
    quest: 10,
  },
  {
    term: 'Witness program',
    match: ['witness program'],
    category: 'Addresses & encoding',
    definition:
      'The payload of a modern address: 20 bytes (a public-key hash) or 32 bytes (a script hash or taproot key). Together with the version it reconstructs the exact scriptPubKey lock.',
    quest: 10,
  },
  {
    term: 'PolyMod',
    match: ['PolyMod'],
    code: true,
    category: 'Addresses & encoding',
    definition:
      'The checksum polynomial every wallet runs over an address before sending. Its BCH-code construction *guarantees* catching up to 4 mistyped characters in strings up to 89 long; no address is longer than 62.',
    cite: 'bech32.cpp:130',
    quest: 10,
  },
  {
    term: 'Base58 & legacy addresses',
    match: ['base58'],
    category: 'Addresses & encoding',
    definition:
      'The older spelling: addresses starting with `1` (pay-to-public-key-hash, version byte 0) or `3` (pay-to-script-hash, byte 5), in an alphabet that drops 0/O/I/l. Still valid, still understood by every wallet, just an earlier generation of the same idea.',
    cite: 'chainparams.cpp:176',
    quest: 10,
  },
  {
    term: 'SegWit',
    match: ['segwit'],
    category: 'Addresses & encoding',
    definition:
      'The 2017 soft fork ("segregated witness") that moved signature data into its own section, fixed transaction malleability, and introduced witness versions and bc1 addresses. Activated at block 481,824 after two years of public argument.',
    cite: 'chainparams.cpp:124',
    quest: 4,
  },
  {
    term: 'Taproot',
    match: ['taproot'],
    category: 'Addresses & encoding',
    definition:
      'The 2021 soft fork adding witness version 1 (bc1p addresses) and Schnorr signatures, which makes complex locks look identical to simple ones on-chain. The most recent consensus change as of the pinned commit.',
    cite: 'chainparams.cpp:125',
    quest: 4,
  },
  {
    term: 'Little-endian',
    match: ['little-endian'],
    category: 'Addresses & encoding',
    definition:
      'Bitcoin serializes numbers least-significant byte first, and displays hashes byte-reversed from how it computes them: the flip you performed to land on the famous genesis hash. Not a convention anyone loves; a convention everyone must follow exactly.',
    quest: 8,
  },

  // --- The network & your node ---
  {
    term: 'Node (full node)',
    category: 'The network & your node',
    definition:
      'A computer running Bitcoin software that independently verifies every block and transaction against the consensus rules, keeping its own copy of the chain. Running one means taking nobody\'s word for anything, which is the point of this entire site.',
    quest: 9,
  },
  {
    term: 'Bitcoin Core',
    category: 'The network & your node',
    definition:
      'The reference implementation descended from Satoshi\'s original code: the program whose source every quest excerpt is copied from, at one pinned commit. Not the only implementation (see Bitcoin Knots), but the one most nodes run. [Core vs. Knots, side by side](/core-vs-knots).',
    quest: 9,
  },
  {
    term: 'FOSS (free and open source software)',
    match: ['FOSS', 'open source'],
    category: 'The network & your node',
    definition:
      'Software whose source code anyone can read, check, and rebuild. It is the difference between a claim you believe and a claim you can verify, which is why every wallet checklist starts here. Open source does not mean somebody *has* checked it, only that somebody *can*. Don\'t trust. Verify.',
  },
  {
    term: 'Library (dependency)',
    match: ['library', 'libngu', 'dependency'],
    category: 'The network & your node',
    definition:
      'Pre-written code that developers reuse instead of rebuilding from scratch. It saves enormous effort and quietly inherits enormous risk: a flaw deep in a shared library reaches every product built on it, which is how a single mistake in one randomness routine can empty wallets made by a device thousands of people trusted. (`libngu`, "library number go up", is one such Bitcoin library.)',
  },
  {
    term: 'Commit',
    match: ['commit message'],
    category: 'The network & your node',
    definition:
      'One saved change to a codebase, with a note explaining what changed and why. Because every commit is timestamped and kept forever, open code carries its own audit trail: researchers can walk back through years of history to find the exact change that introduced a bug, and a lazy one-word commit message is precisely what makes that archaeology harder.',
  },
  {
    term: 'Bitcoin Knots',
    match: ['Knots'],
    category: 'The network & your node',
    definition:
      'A derivative of Bitcoin Core maintained by Luke Dashjr: the same consensus engine with a patch set of much stricter relay-policy defaults (data filtering on, bare multisig off). Its 2025 growth was node operators voting against Core v30\'s open OP_RETURN default. [Core vs. Knots, side by side](/core-vs-knots).',
    quest: 13,
  },
  {
    term: 'Relay policy',
    match: ['relay policy'],
    category: 'The network & your node',
    definition:
      'Each node\'s own rules about which waiting transactions it will pass along: fee minimums, data limits, standardness. Policy is personal taste, not law; a transaction your node refuses to relay can still reach a miner another way, and once mined, your node accepts the block. Only consensus binds everyone.',
    cite: 'policy.cpp:137',
    quest: 12,
  },
  {
    term: 'Economic node',
    match: ['economic node', 'economic nodes'],
    category: 'The network & your node',
    definition:
      'A full node whose operator accepts bitcoin as payment: an exchange, a merchant, you when someone pays you. These are the nodes whose rules define which chain is "bitcoin," because miners can only sell coins the economy recognizes. In 2017 they outvoted over 80% of hashpower without mining anything.',
    quest: 12,
  },
  {
    term: 'Initial block download (IBD)',
    match: ['initial block download'],
    category: 'The network & your node',
    definition:
      'A new node\'s first days: fetch every block since 2009 from peers and re-run the audit on each (signature checks on deep history are skipped by default; see assumevalid), rebuilding the entire state of Bitcoin from block zero. Nobody hands your node a balance sheet; it derives one.',
    quest: 9,
  },
  {
    term: 'assumevalid',
    match: ['assumevalid'],
    code: true,
    category: 'The network & your node',
    definition:
      'The disclosed shortcut: by default, script checks (signatures being the expensive part) are skipped for blocks buried beneath a reviewed block hash baked into each release. Amounts, subsidies, and double-spends are still fully verified, and `-assumevalid=0` refuses even this.',
    cite: 'chainparams.cpp:142',
    quest: 9,
  },
  {
    term: 'nMinimumChainWork',
    match: ['nMinimumChainWork'],
    code: true,
    category: 'The network & your node',
    definition:
      'A floor on total accumulated proof-of-work: your syncing node ignores any chain claiming less. It makes feeding a fresh node a cheap fake history economically absurd rather than merely difficult.',
    cite: 'chainparams.cpp:141',
    quest: 9,
  },
  {
    term: 'DNS seeds',
    match: ['dns seeds', 'dns seed'],
    category: 'The network & your node',
    definition:
      "How a brand-new node finds the network with no signup: a short list of introduction services run by named developers, hard-coded and normally consulted only when the node knows no peers. Seeds can only say hello; every block they lead you to still gets fully verified.",
    cite: 'chainparams.cpp:168',
    quest: 9,
  },
  {
    term: 'Peer-to-peer gossip',
    match: ['gossip'],
    category: 'The network & your node',
    definition:
      'How everything travels: your node tells its peers, they tell theirs. There is no central server to submit anything to, and every hop re-verifies before relaying, so lies die at the first honest node.',
    quest: 7,
  },
  {
    term: 'bitcoin-cli & RPC',
    match: ['bitcoin-cli'],
    code: true,
    category: 'The network & your node',
    definition:
      'The command-line remote control for your own node. Type `bitcoin-cli getblockchaininfo` and your machine (not a website) answers. RPC is the protocol underneath ("remote procedure call").',
    quest: 9,
  },
  {
    term: 'gettxoutsetinfo',
    match: ['gettxoutsetinfo'],
    code: true,
    category: 'The network & your node',
    definition:
      'The supply audit command: your node walks its own coin database, counts every unspent output, and reports `total_amount`: the money supply, measured from your disk rather than quoted from anyone.',
    cite: 'blockchain.cpp:1046',
    quest: 9,
  },
  {
    term: 'Pruned node',
    match: ['pruned mode', 'pruned node'],
    category: 'The network & your node',
    definition:
      'A full node that verifies everything during sync but then discards old raw blocks, keeping only the current state (roughly 10 GB instead of a terabyte). Same rules enforced, same trust in nobody; it just can\'t serve history to others.',
    quest: 9,
  },
  {
    term: 'Light wallet (SPV)',
    match: ['light wallet'],
    category: 'The network & your node',
    definition:
      "A wallet that checks proof-of-work headers but not full blocks, trusting that the heaviest chain is valid. Fine for coffee money; the opposite of this site's ethos for anything serious. It's the thing running a node graduates you from.",
    quest: 9,
  },
  {
    term: 'Mainnet & testnet',
    match: ['mainnet', 'testnet'],
    category: 'The network & your node',
    definition:
      'Mainnet is the Bitcoin, with real value. Testnets are parallel play-money networks for breaking things safely: different prefixes (tb1 addresses), different genesis, worthless by design.',
    quest: 10,
  },
  {
    term: 'chainparams',
    match: ['chainparams'],
    code: true,
    category: 'The network & your node',
    definition:
      "The file that defines what \"the Bitcoin network\" even is: halving interval, genesis block, address prefixes, activation heights, seeds. Half this site's excerpts come from it; it is Bitcoin's constitution in one place.",
    cite: 'chainparams.cpp:111',
    quest: 1,
  },

  // --- Rules, forks & history ---
  {
    term: 'Consensus rules',
    match: ['consensus rules', 'consensus-critical'],
    category: 'Rules, forks & history',
    definition:
      'The checks every node runs on every block and transaction: subsidy limits, signature validity, no double-spends, proof-of-work. Break one and your block isn\'t punished; it\'s *ignored*, by everyone, automatically.',
    quest: 4,
  },
  {
    term: 'Soft fork',
    match: ['soft fork', 'soft forks'],
    category: 'Rules, forks & history',
    definition:
      'A *tightening* of the rules that old software still tolerates, and the only way Bitcoin\'s rules have changed in over a decade. Each one activated only after near-unanimous adoption, and its block height is carved into the code like a tree ring.',
    cite: 'chainparams.cpp:119',
    quest: 4,
  },
  {
    term: 'Hard fork',
    match: ['hard fork', 'hard forks'],
    category: 'Rules, forks & history',
    definition:
      'A rule *loosening* that old nodes reject, which splits the network into two currencies unless literally everyone moves. Bitcoin\'s immune response to unwanted ones is Quest #4\'s lesson: changing your own code is easy; changing everyone else\'s is the hard part.',
    quest: 4,
  },
  {
    term: 'BIP',
    match: ['bips'],
    category: 'Rules, forks & history',
    definition:
      '"Bitcoin Improvement Proposal": the public design documents changes go through (BIP34, BIP173/350 for addresses, and so on). Proposing costs nothing; only near-unanimous voluntary adoption makes one real.',
    quest: 4,
  },
  {
    term: 'Activation height',
    match: ['activation height', 'activation heights'],
    category: 'Rules, forks & history',
    definition:
      "The exact block where an upgrade's rules switched on (BIP34 at 227,931, SegWit at 481,824, and friends), recorded permanently in chainparams. Bitcoin's constitutional history, machine-checkable.",
    cite: 'chainparams.cpp:119',
    quest: 4,
  },
  {
    term: 'The 2010 overflow bug',
    category: 'Rules, forks & history',
    definition:
      'August 2010: a transaction exploited integer overflow to mint 184 *billion* BTC. Satoshi shipped a fix within hours and the network abandoned the poisoned chain, the origin of the overflow checks every transaction passes today.',
    cite: 'tx_check.cpp',
    quest: 5,
  },
  {
    term: 'CVE-2018-17144',
    match: ['cve-2018-17144'],
    category: 'Rules, forks & history',
    definition:
      'The 2018 inflation bug: a refactor briefly made it possible (never exploited) for a miner to spend the same coin twice in one block. Quietly patched, then fully disclosed. The lesson isn\'t "Bitcoin is bug-free"; it\'s that the checks are public, so bugs get found and the fix is verifiable.',
    quest: 5,
  },
  {
    term: '“Don\'t trust, verify”',
    category: 'Rules, forks & history',
    definition:
      'The habit this site exists to teach: never take a claim about Bitcoin on authority (including ours) when you can check the code, the math, or your own node instead. Every quest ends with you having done exactly that.',
    quest: 1,
  },
  {
    term: 'Pinned commit',
    match: ['pinned commit'],
    category: 'Rules, forks & history',
    definition:
      'This site\'s anti-tampering rule. Every excerpt is copied letter-for-letter from one exact snapshot of its source repository: Bitcoin Core at commit `18c05d9`, the BIPs repository at `8c369ac`. Automated checks re-diff all of them against the real repositories on every change, and the "verify on GitHub" link under each excerpt lets you do the same.',
  },
  {
    term: 'OP_RETURN',
    code: true,
    match: ['OP_RETURN'],
    category: 'Transactions & the mempool',
    definition:
      'An output type that declares "this carries data and can never be spent," letting nodes prune it instead of tracking it forever. Added in 2014 as harm reduction for data stuffing; how much of it a node relays (`-datacarriersize`) became Bitcoin\'s loudest argument in 2025.',
    cite: 'policy.h:84',
    quest: 13,
  },
  {
    term: 'Inscription',
    match: ['inscription', 'inscriptions'],
    category: 'Transactions & the mempool',
    definition:
      'Data (often an image or token mint) parked inside taproot witness space, where SegWit prices bytes at a 75% discount. The 2023 inscription waves outbid ordinary payments across the whole mempool and reignited the war over what the ledger is for.',
    quest: 13,
  },
  {
    term: 'Fee floor (rolling minimum)',
    match: ['fee floor'],
    category: 'Transactions & the mempool',
    definition:
      'The mempool\'s automatic price of admission when it overflows: eviction ratchets the floor up to what the evicted bidder paid, then the floor decays by half every 12 hours until it snaps back to zero. For feel: even a 100× fee spike decays to nothing in under four days of calm, faster once the queue drains. Congestion prices itself and cures itself; nobody chooses the number.',
    cite: 'txmempool.cpp:851',
    quest: 12,
  },
  {
    term: 'Weight units',
    match: ['weight units', 'weight unit'],
    category: 'Transactions & the mempool',
    definition:
      "How block space is really measured since SegWit: a block holds 4,000,000 weight units, where ordinary bytes cost 4 each and witness (signature) bytes cost 1, which is the \"75% discount\" inscriptions exploit. Divide by 4 and you get the friendlier unit: ~1,000,000 vbytes per block. A typical payment spends ~560 of the 4M, about one seven-thousandth of a block.",
    quest: 13,
  },
  {
    term: 'Lightning Network',
    match: ['Lightning Network', 'Lightning'],
    category: 'The network & your node',
    definition:
      'A network of payment channels above the base chain: coins locked to two keys, balances updated by mutually signed splits nobody broadcasts, cheating punished by the revocation script, and payments routed across channels between strangers. A thousand payments, two on-chain transactions; the chain is the courtroom, not the cash register.',
    quest: 16,
  },
  {
    term: 'Payment channel',
    site: 'bitcoin',
    match: ['payment channel', 'payment channels'],
    category: 'Lightning & channels',
    definition:
      "Two parties lock coins in a 2-of-2 multisig on-chain, then pay each other by re-signing the split off-chain, each update revoking the last. Either side can exit to the chain unilaterally with the latest state; broadcasting an old one forfeits everything to the counterparty's penalty key (BOLT #3, quoted verbatim in Quest #16).",
    cite: '03-transactions.md:79',
    quest: 16,
  },
  {
    term: 'Revocation key',
    site: 'bitcoin',
    match: ['revocation key', 'revocation'],
    category: 'Lightning & channels',
    definition:
      "The secret each channel party surrenders for its *previous* state whenever the balance updates: the price of the new split. Holding it makes the counterparty's old commitment instantly spendable via the OP_IF penalty branch, which is what makes stale states radioactive and channels honest.",
    quest: 16,
  },
  {
    term: 'UASF (user-activated soft fork)',
    match: ['UASF'],
    category: 'Rules, forks & history',
    definition:
      'A rule change enforced by economic nodes on a schedule regardless of miner support: the 2017 escalation that pressured miners into activating SegWit and sank the SegWit2x hard fork. The proof, run live, that hashpower follows the economy and not the reverse.',
    quest: 12,
  },
  // --- Lightning & channels ---
  {
    term: 'Payment channel',
    site: 'lightning',
    match: ['payment channel', 'payment channels'],
    category: 'Lightning & channels',
    definition:
      'Coins locked in a **2-of-2 output** on the Bitcoin blockchain, plus a running balance between the two owners that they update privately and the chain never sees. Opening and closing are ordinary on-chain transactions; everything in between is free, instant, and invisible. The coins never leave Bitcoin — the chain simply is not asked about them in the meantime.',
    cite: '03-transactions.md:79',
    quest: 1,
    questSite: 'lightning',
  },
  {
    term: 'BOLT',
    match: ['BOLT', 'BOLTs'],
    category: 'Lightning & channels',
    definition:
      "Basis of Lightning Technology: the numbered specification documents that define the Lightning protocol, the way BIPs define Bitcoin proposals. There is no reference implementation blessed above the others — the BOLTs are the authority, and several independent nodes implement them. Unusually, they also ship machine-readable test vectors, so an implementation can be checked against the spec rather than against another implementation.",
  },
  {
    term: 'Commitment transaction',
    match: ['commitment transaction'],
    category: 'Lightning & channels',
    definition:
      'A signed Bitcoin transaction that spends a channel\'s funding output back to its two owners at the balance they currently agree on. Each side holds its own copy and can broadcast it unilaterally at any time, which is what makes a channel trustless — but broadcasting an outdated one is punished (see [[Revocation key]]).',
    quest: 1,
    questSite: 'lightning',
  },
  {
    term: 'Revocation key',
    site: 'lightning',
    match: ['revocation key', 'revocationpubkey'],
    category: 'Lightning & channels',
    definition:
      "The key that guards the penalty branch of every channel balance. It is built from two halves — one from each party — so that **neither can compute the private key alone**. Moving to a new balance requires handing your counterparty the secret that completes their half, which is precisely what makes the balance you just left behind dangerous to publish.",
    cite: '03-transactions.md:817',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'per_commitment_secret',
    code: true,
    match: ['per_commitment_secret', 'per-commitment secret'],
    category: 'Lightning & channels',
    definition:
      'A fresh secret for each channel balance. Its public counterpart (`per_commitment_point`, the secret times G) goes into deriving that state\'s keys; the secret itself is surrendered when the state is revoked. Handing it over is what lets your counterparty compute the [[Revocation key]] for the state you are leaving.',
    cite: '03-transactions.md:812',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'to_self_delay',
    code: true,
    match: ['to_self_delay'],
    category: 'Lightning & channels',
    definition:
      'The number of blocks you must wait before you can spend your own funds after force-closing a channel, enforced by `OP_CHECKSEQUENCEVERIFY`. It exists to give your counterparty a window in which to punish you if the balance you published was an old one. This is why a force close feels slow: the delay is the security.',
    cite: '03-transactions.md:121',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'Force close',
    match: ['force close', 'force-close'],
    category: 'Lightning & channels',
    definition:
      'Closing a channel by broadcasting your latest commitment transaction unilaterally, without your counterparty\'s cooperation. Always available — that is the point — but it costs on-chain fees and puts your own funds behind `to_self_delay`. A cooperative close, where both sides sign one tidy transaction, is cheaper and immediate.',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'Penalty transaction',
    match: ['penalty transaction'],
    category: 'Lightning & channels',
    definition:
      "The transaction that takes a cheater's entire channel balance after they publish a revoked state. The specification names it in the script itself, as a comment. It needs no delay and no permission — only the [[Revocation key]], which the cheater handed over themselves when they moved on from that balance.",
    cite: '03-transactions.md:118',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'Millisatoshi',
    match: ['millisatoshi', 'millisat', 'msat'],
    category: 'Lightning & channels',
    definition:
      'One thousandth of a satoshi: the unit Lightning accounts in. It exists only above the chain — Bitcoin itself has no denomination smaller than a satoshi — and is there so routing fees, which are often a tiny fraction of a satoshi, can be expressed without rounding to zero. Amounts are rounded down to whole satoshis when a channel actually settles on-chain.',
  },
  // --- Lightning vocabulary and the script it is built from ---
  {
    term: 'HTLC',
    match: ['HTLC', 'HTLCs', 'Hashed Timelock Contract'],
    category: 'Lightning & channels',
    definition:
      "Hashed Timelock Contract: a promise of money with two exits and no third. Either someone produces the [[Preimage]] of a given hash and takes it immediately, or a deadline passes and it refunds to whoever offered it. Chain those promises along a route, all locked to the same hash, and a payment either completes at every hop or at none of them — which is why a stranger in the middle can never keep it.",
    cite: '03-transactions.md:214',
    quest: 4,
    questSite: 'lightning',
  },
  {
    term: 'Preimage',
    match: ['preimage'],
    category: 'Lightning & channels',
    definition:
      'The secret that hashes to a given value. The payee invents one, publishes only its hash in the invoice, and releases it when paid — so holding it afterwards, next to their signed invoice, is a receipt nobody can forge or revoke. The specification puts it plainly: the preimage of the payment hash *provides proof of payment*.',
    cite: '11-payment-encoding.md:145',
    quest: 3,
    questSite: 'lightning',
  },
  {
    term: 'Onion routing',
    match: ['onion routing', 'sphinx'],
    category: 'Lightning & channels',
    definition:
      'Wrapping a payment in one encrypted layer per hop, so each node can open exactly one — learning who to forward to and nothing else. The packet is always **1,366 bytes**, because a packet that shrank as it travelled would tell every node how far along the route it was.',
    cite: '04-onion-routing.md:144',
    quest: 5,
    questSite: 'lightning',
  },
  {
    term: 'Watchtower',
    match: ['watchtower', 'watchtowers'],
    category: 'Lightning & channels',
    definition:
      "A third party you pay (or ask nicely) to watch the chain for revoked channel states on your behalf, and to broadcast the [[Penalty transaction]] if one appears. It exists because the penalty only works if somebody notices during the `to_self_delay` window — and your phone is not always online. A watchtower is given enough to punish a cheat and not enough to learn your balances.",
  },
  {
    term: 'Inbound liquidity',
    match: ['inbound liquidity', 'inbound capacity'],
    category: 'Lightning & channels',
    definition:
      "How much someone can currently send *to* you: the money sitting on the far side of your channels. This is the single most common practical confusion in Lightning — a channel can only push what is on your side of it, so a brand-new channel you funded yourself can send but cannot receive a satoshi until some of it moves.",
    quest: 4,
    questSite: 'lightning',
  },
  {
    term: 'Routing node',
    match: ['routing node', 'routing nodes', 'forwarding node'],
    category: 'Lightning & channels',
    definition:
      'A node that forwards other people’s payments between its channels and keeps a small fee. It is never handed anything spendable — only an [[HTLC]] it cannot open — so its honesty is irrelevant rather than assumed. The worst it can do to you is fail, and failing earns it nothing.',
    quest: 4,
    questSite: 'lightning',
  },
  {
    term: 'Timelock',
    match: ['timelock', 'timelocks', 'timelocked'],
    category: 'Keys & ownership',
    definition:
      'A condition in a script that makes coins unspendable until a given time or block height. Bitcoin enforces it at the consensus layer, which is what lets Lightning build refunds and penalties on top: a promise that expires on its own needs no referee.',
  },
  {
    term: 'P2WSH',
    code: true,
    match: ['P2WSH', 'pay-to-witness-script-hash'],
    category: 'Addresses & encoding',
    definition:
      'Pay-to-witness-script-hash: an output that commits to the *hash* of a script rather than the script itself. The script stays private until the money moves, and only then is it revealed and run. Both of a Lightning channel’s important outputs — the funding lock and the delay-or-punish output — are this shape.',
    cite: '03-transactions.md:77',
    quest: 1,
    questSite: 'lightning',
  },
  {
    term: 'OP_CHECKMULTISIG',
    code: true,
    match: ['OP_CHECKMULTISIG'],
    category: 'Keys & ownership',
    definition:
      '[[OP_CHECKSIG]] in the plural: this many signatures, from these keys, or the coins do not move. A Lightning channel opens by locking coins with `2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG` — two of two, so neither party can touch the money alone. The keys are sorted lexicographically so two strangers’ software builds byte-identical scripts.',
    cite: '03-transactions.md:79',
    quest: 1,
    questSite: 'lightning',
  },
  {
    term: 'OP_CHECKSEQUENCEVERIFY',
    code: true,
    match: ['OP_CHECKSEQUENCEVERIFY', 'CSV'],
    category: 'Keys & ownership',
    definition:
      'The relative [[Timelock]] opcode: this output cannot be spent until so many blocks have passed since it confirmed. It is what puts a force-closing party’s own money behind a delay — and that delay is precisely the window in which a cheated counterparty can take everything instead.',
    cite: '03-transactions.md:122',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'OP_IF',
    code: true,
    match: ['OP_IF', 'OP_ELSE', 'OP_ENDIF', 'OP_NOTIF'],
    category: 'Keys & ownership',
    definition:
      'Branching inside a Bitcoin script. The spender chooses which branch to take by what they put on the stack, so one output can offer several different ways to be spent. Lightning leans on this hard: the channel balance output has an honest branch behind a delay and a penalty branch with none.',
    cite: '03-transactions.md:117',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'update_add_htlc',
    code: true,
    match: ['update_add_htlc'],
    category: 'Lightning & channels',
    definition:
      'The message that offers a payment into a channel. Five fields: which channel, an id, `amount_msat`, the `payment_hash`, a `cltv_expiry` deadline, and a sealed 1,366-byte onion the sender cannot read. Notice what is absent — no payer, no payee, no route.',
    cite: '02-peer-protocol.md:2783',
    quest: 4,
    questSite: 'lightning',
  },
  {
    term: 'payment_hash',
    code: true,
    match: ['payment_hash'],
    category: 'Lightning & channels',
    definition:
      'The SHA-256 hash at the centre of a payment, copied unchanged from the invoice into every hop along the route. That sameness is what makes the hops one atomic payment: reveal the [[Preimage]] to claim at the far end, and every hop behind you can claim too.',
    cite: '11-payment-encoding.md:145',
    quest: 3,
    questSite: 'lightning',
  },
  {
    term: 'cltv_expiry',
    code: true,
    match: ['cltv_expiry', 'cltv_expiry_delta'],
    category: 'Lightning & channels',
    definition:
      'The block height after which an [[HTLC]] expires and refunds. Deadlines *descend* along a route so every hop has time to claim its incoming promise after paying out — which is why long routes need long timelocks, and why a stuck payment can lock funds for hours.',
    cite: '02-peer-protocol.md:2789',
    quest: 4,
    questSite: 'lightning',
  },
  {
    term: 'amount_msat',
    code: true,
    match: ['amount_msat'],
    category: 'Lightning & channels',
    definition:
      'A payment amount in [[Millisatoshi]] — thousandths of a satoshi. The extra precision exists only above the chain, so that routing fees, which are often a tiny fraction of a satoshi, do not round to nothing.',
    cite: '02-peer-protocol.md:2787',
    quest: 4,
    questSite: 'lightning',
  },
  {
    term: 'onion_routing_packet',
    code: true,
    match: ['onion_routing_packet', 'hop_payloads'],
    category: 'Lightning & channels',
    definition:
      'The sealed 1,366-byte envelope carried by every `update_add_htlc`: a version byte, an ephemeral public key, 1,300 bytes of layered routing instructions, and an HMAC. Each hop peels exactly one layer and re-pads what it forwards, so the size never changes. See [[Onion routing]].',
    cite: '04-onion-routing.md:144',
    quest: 5,
    questSite: 'lightning',
  },
  {
    term: 'per_commitment_point',
    code: true,
    match: ['per_commitment_point'],
    category: 'Lightning & channels',
    definition:
      'A fresh public key for each channel balance, derived as `per_commitment_secret * G`. It is one of the two halves the [[Revocation key]] is built from — the half you contribute — and surrendering its secret is what revokes a state.',
    cite: '03-transactions.md:812',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'revocation_basepoint',
    code: true,
    match: ['revocation_basepoint', 'revocation basepoint'],
    category: 'Lightning & channels',
    definition:
      'Your counterparty’s long-lived contribution to every [[Revocation key]] in the channel — the other half from your [[per_commitment_point]]. Because each side holds only one half’s secret, neither can compute the private key alone, which the specification states outright.',
    cite: '03-transactions.md:817',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'local_delayedpubkey',
    code: true,
    match: ['local_delayedpubkey', 'delayed payment key'],
    category: 'Lightning & channels',
    definition:
      'The key that can finally spend your own balance after a force close — but only once `to_self_delay` blocks have passed. It is kept separate from your other keys so a [[Watchtower]] can be given what it needs to punish a cheat without learning anything else about the channel.',
    cite: '03-transactions.md:124',
    quest: 2,
    questSite: 'lightning',
  },
  {
    term: 'Routing fee',
    match: ['routing fee', 'routing fees'],
    category: 'Lightning & channels',
    definition:
      'What a node charges to forward someone else’s payment. There is no schedule and no authority: each node picks two numbers per direction — [[fee_base_msat]] and [[fee_proportional_millionths]] — and advertises them. The **sender pays every fee on the route in advance**, so the payee always receives exactly the invoice amount.',
    cite: '07-routing-gossip.md:981',
    quest: 6,
    questSite: 'lightning',
  },
  {
    term: 'fee_base_msat',
    code: true,
    match: ['fee_base_msat', 'base fee'],
    category: 'Lightning & channels',
    definition:
      'The flat part of a [[Routing fee]]: charged on every forward regardless of size, in millisatoshis. Set by the node itself and broadcast in a [[channel_update]]. Plenty of nodes advertise zero because they want the traffic.',
    cite: '07-routing-gossip.md:456',
    quest: 6,
    questSite: 'lightning',
  },
  {
    term: 'fee_proportional_millionths',
    code: true,
    match: ['fee_proportional_millionths', 'ppm', 'proportional fee'],
    category: 'Lightning & channels',
    definition:
      'The proportional part of a [[Routing fee]], in millionths of the amount forwarded — so 1,000 is 0.1%. Multiplied by the amount and divided by a million, with the division **truncating**, which is why the specification’s worked example comes to 10,199 and not 10,200.',
    cite: '07-routing-gossip.md:457',
    quest: 6,
    questSite: 'lightning',
  },
  {
    term: 'channel_update',
    code: true,
    match: ['channel_update'],
    category: 'Lightning & channels',
    definition:
      'The gossip message in which a node announces its current terms for one direction of one channel: its two fee numbers, the timelock it insists on, and the smallest and largest payment it will carry. Replaceable at any time — a node changes its prices by broadcasting a new one.',
    cite: '07-routing-gossip.md:446',
    quest: 6,
    questSite: 'lightning',
  },
  {
    term: 'Gossip',
    match: ['gossip', 'gossip protocol'],
    category: 'Lightning & channels',
    definition:
      'How the network map spreads: nodes announce their own channels and terms, neighbours pass the announcements on, and every wallet builds its own copy. Nobody publishes a directory. Two wallets can briefly hold different maps and both be right, which is one reason a payment can fail for a reason yours could not have known.',
    quest: 6,
    questSite: 'lightning',
  },
  {
    term: 'short_channel_id',
    code: true,
    match: ['short_channel_id'],
    category: 'Lightning & channels',
    definition:
      'A channel’s on-chain birth certificate: the block height, transaction index and output index of its funding transaction. Because it points at a real output, anyone can check a channel announcement against the blockchain — which is what stops invented capacity spreading through [[Gossip]].',
    cite: '07-routing-gossip.md:450',
    quest: 6,
    questSite: 'lightning',
  },
];

/** Glossary entries visible on one front door (shared terms appear on both). */
export function glossaryForSite(site: SiteId): GlossaryEntry[] {
  return glossary.filter((entry) => entry.site === undefined || entry.site === site);
}
