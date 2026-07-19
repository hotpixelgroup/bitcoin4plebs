import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #15: privacy. The ledger the reader spent fourteen quests
 * verifying is public forever, and that cuts both ways. What the chain
 * reveals, how analysts cluster it, what wallets quietly do to protect
 * you, and the handful of habits that keep your finances yours. The
 * finale puts the reader in the analyst's chair, because nothing
 * teaches defense like running the offense once.
 */
export const quest15: Quest = {
  id: 'quest-15',
  slug: 'who-can-see-your-money',
  number: 15,
  kicker: 'Take it home.',
  track: 'Take it home',
  title: 'Who can see your money?',
  summary:
    'Everyone, forever: the ledger is glass. What the chain reveals and what it hides, how watchers cluster addresses, and the quiet code in your wallet that fights back.',
  duration: '10 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'seen, not named',
    text: "The bike payment is three years of chapters old now, and it is still right there, visible to anyone, forever. Nothing on the ledger says 'Ana' or 'Bo'; it says an address paid an address. Tonight Ana learns what those addresses can quietly confess, and how her wallet keeps them from confessing more.",
  },
  intro: [
    "Here's the trade you made without noticing. Every quest so far celebrated the same property: **anyone can check everything**. That's where the trust-nobody magic comes from. But 'anyone can check everything' has a second reading: your payments sit in a public ledger, copied to tens of thousands of machines, queryable forever, by anyone, for any reason.",
    "Bitcoin's answer is not secrecy; it's **pseudonymity plus discipline**. The chain records addresses, not names, and whether those addresses trace back to you depends on habits, most of which your wallet already practices on your behalf. This quest shows you the watcher's tools and the defender's code, both, because you can't evaluate your own exposure with half the picture.",
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'glass-ledger',
      title: 'The ledger is glass, not frosted',
      takeaway:
        'Every transaction you have ever made is **public, permanent, and free to query**. What the chain does *not* record is names. Bitcoin is pseudonymous: the strength of the link between an address and you is the whole game.',
      myth: {
        belief: 'Bitcoin is anonymous. Criminals use it because nobody can see anything.',
        reality:
          "Closer to the opposite: it's the most traceable money ever built, a permanent public record that analysts replay at leisure, which is how many high-profile thefts and markets were unwound. What the chain omits is *names*, and connecting names to addresses is a discipline problem, not a cryptography problem, in both directions.",
      },
      contrastLabels: { left: 'Your bank account', right: 'The Bitcoin ledger' },
      contrast: [
        {
          aspect: 'Who sees your transactions',
          bank: 'The bank, its partners, and any authority that asks it',
          bitcoin: 'Literally anyone, forever, without asking',
        },
        {
          aspect: 'What they see',
          bank: 'Your name on every line',
          bitcoin: 'Addresses and amounts; names only if you leak them',
        },
        {
          aspect: 'Can history be sealed later',
          bank: 'Policies change; records can close or leak',
          bitcoin: 'Never. What is published stays published',
        },
      ],
      prose: [
        "Pull up any block explorer and you're reading the same database your Quest #9 node holds: every payment since 2009, amounts, addresses, timestamps. No login. This is not a flaw; it's the price of a system where **everyone audits everyone** (Quest #1's enforcement only works because the books are open).",
        "What's missing from the record is identity. An address (Quest #10) is a spelling of a lock, and nothing in consensus links locks to passports. The linking happens *off* the chain: the exchange that verified your ID before selling you coins knows exactly which withdrawals are yours; the friend you paid knows your address; the merchant knows another. Privacy on a glass ledger means managing those links, and the first tool for it is one your wallet already uses relentlessly.",
      ],
    },
    {
      id: 'fresh-addresses',
      title: 'Why your wallet never repeats itself',
      takeaway:
        "Wallets hand out a **fresh address for every payment** because Quest #14's seed makes new ones free, and because a reused address stitches your payments together for any watcher. Core even ships an *avoid reuse* mode, and its comment says the quiet part out loud.",
      quiz: [
        {
          question: 'Your wallet shows a different receive address every time. Is something wrong?',
          options: [
            'Yes: the old addresses stopped working',
            'No: all of them stay yours forever; fresh ones just keep your payments unlinked',
            'Yes: you should reuse one address so people recognize you',
          ],
          answer: 1,
          explain:
            'Every address your seed ever derived stays spendable forever (Quest #14: one backup, every key). Handing out a fresh one per payment costs nothing and denies watchers the easiest join in the book: "these payments share an address, so they share an owner."',
        },
      ],
      prose: [
        'Read the comment in this excerpt slowly, because Bitcoin Core rarely says "privacy" this plainly. The wallet tracks whether an address has **previously been spent**. Why? So coin selection can avoid "creating different transactions that spend from the same addresses." Address reuse is the cardinal sin of chain privacy. One repeated address turns scattered payments into a labeled timeline.',
        "This is also why Quest #14's architecture matters here. Because every address derives from one seed, fresh addresses are free and infinite, and *not* reusing them costs you nothing. The etiquette follows: request a new address per payment (your wallet does this), don't publish one address as a permanent tip jar unless you accept that its whole history becomes your public guestbook.",
        '(And yes, the excerpt contains a small typo, "the the." It has sat in the real source through review after review. The code is human; that\'s rather the point of this site.)',
      ],
      annotations: [
        { lines: 'L257–58', text: 'The wallet remembers which addresses have received AND spent: the "used" list. (Spot the doubled "the": verbatim means verbatim.)' },
        { lines: 'L259–61', text: 'The stated purpose, in Core\'s own words: coin selection avoids tying transactions together "to increase privacy."' },
        { lines: 'L263', text: 'One boolean per address, defending you by default.' },
      ],
      excerpt: {
        ref: { file: 'src/wallet/wallet.h', startLine: 256, endLine: 263 },
        language: 'cpp',
        lines: [
          { n: 256, text: '    /**' },
          { n: 257, text: '     * Whether coins with this address have previously been spent. Set when the' },
          { n: 258, text: '     * the wallet avoid_reuse option is enabled and this is an IsMine address' },
          { n: 259, text: '     * that has already received funds and spent them. This is used during coin', highlight: true },
          { n: 260, text: '     * selection to increase privacy by not creating different transactions', highlight: true },
          { n: 261, text: '     * that spend from the same addresses.', highlight: true },
          { n: 262, text: '     */' },
          { n: 263, text: '    bool previously_spent{false};' },
        ],
      },
    },
    {
      id: 'change',
      title: 'The second output is talking about you',
      takeaway:
        "Coins are boxes (Quest #3), so paying 0.6 from a 1.0 box creates **two outputs**: Bo's 0.6 and your 0.4 in *change*. Watchers guess which output is the change to keep following you, and your wallet answers by sending change to a brand-new address, every time.",
      quiz: [
        {
          question: 'A transaction has two outputs: 0.6 BTC to a reused shop address, 0.39724 BTC to a never-seen-before address. Which is probably the change?',
          options: [
            'The 0.6: round amounts are always change',
            'The 0.39724 to the fresh address: odd amount, never seen, classic change signature',
            'Impossible to guess, ever',
          ],
          answer: 1,
          explain:
            'Heuristics, not certainties: change tends to be the odd, unround amount going to a freshly created address, while payments are often round and go to addresses with history. Wallets fight back (fresh change addresses always, and better coin selection); analysts refine. The finale lets you play both sides.',
        },
      ],
      prose: [
        "Quest #7 showed you the mechanics; here's the surveillance angle. Because a UTXO must be spent whole, most payments produce change back to yourself, and the transaction itself doesn't label which output is which. A watcher who guesses the change output correctly gets to keep following *you* through the graph, hop after hop.",
        "This excerpt is your wallet's counter-move, and its name says everything: `GetNewChangeDestination`. Not 'get the change address', **new**, every single time. Your change never returns to an address the watcher has already seen, which strips away the easiest tell. It can't erase the amount heuristics (0.39724 still *looks* like change next to a round 0.6), but it denies the address-based joins for free.",
      ],
      annotations: [
        { lines: 'L2639', text: 'The name is the policy: change goes to a NEW destination. There is no "the change address."' },
        { lines: 'L2643–44', text: 'Reserve a fresh destination from the keypool your Quest #14 seed makes infinite.' },
        { lines: 'L2645', text: 'Only once the destination is actually used does the wallet consume it for good.' },
      ],
      excerpt: {
        ref: { file: 'src/wallet/wallet.cpp', startLine: 2639, endLine: 2648 },
        language: 'cpp',
        lines: [
          { n: 2639, text: 'util::Result<CTxDestination> CWallet::GetNewChangeDestination(const OutputType type)', highlight: true },
          { n: 2640, text: '{' },
          { n: 2641, text: '    LOCK(cs_wallet);' },
          { n: 2642, text: '' },
          { n: 2643, text: '    ReserveDestination reservedest(this, type);', highlight: true },
          { n: 2644, text: '    auto op_dest = reservedest.GetReservedDestination(true);' },
          { n: 2645, text: '    if (op_dest) reservedest.KeepDestination();' },
          { n: 2646, text: '' },
          { n: 2647, text: '    return op_dest;' },
          { n: 2648, text: '}' },
        ],
      },
    },
    {
      id: 'clustering',
      title: "The watcher's one great trick",
      takeaway:
        'When a transaction spends **several inputs at once**, one signer almost certainly controls all of them. That single assumption, the *common-input heuristic*, is how analysts collapse thousands of addresses into one "wallet," and Satoshi warned about it in the whitepaper.',
      myth: {
        belief: 'I get a fresh address for every payment, so my history cannot be connected.',
        reality:
          "Fresh addresses protect you until you *spend*. The moment your wallet gathers three old coins to fund one payment, it has signed a public confession that one owner held all three (plus, usually, the change of each earlier hop). Privacy on-chain is won or lost mostly at spend time, which is why coin selection, consolidation habits, and avoid-reuse matter more than receiving etiquette.",
      },
      prose: [
        "Time to think like the other side. You're an analyst with the whole glass ledger and one confirmed fact: address A belongs to the corner shop. Fresh addresses everywhere should stop you cold. They don't, because of one pattern: **multi-input spending**. When the shop pays its supplier by combining eight incoming payments into one transaction, all eight input addresses collapse into one cluster. Add the change heuristic from the last stop, and each spend also donates its change address to the cluster. Repeat until the shop's 'privacy' is a single labeled blob with a revenue chart.",
        'This is not a secret exploit; it\'s in the Bitcoin whitepaper itself: "some linking is still unavoidable with multi-input transactions, which necessarily reveal that their inputs were owned by the same owner." Chain-analysis firms industrialized that sentence. The defenses are behavioral. Avoid reuse (the code you just read). Avoid carelessly consolidating everything into one transaction. And know that any address an exchange gave you is already linked to your ID by *them*, off-chain, no heuristics required.',
      ],
    },
    {
      id: 'defense',
      title: 'The defender’s checklist',
      takeaway:
        'You cannot make the glass frosted, but you can stop writing your name on it: **fresh addresses (automatic), deliberate spending, your own node, and knowing exactly who already holds your links**. Privacy here is hygiene, not wizardry.',
      prose: [
        "The realistic list, in order of value. **One:** let your wallet's fresh-address behavior work; never hand out one address twice when you can avoid it. **Two:** spend deliberately: consolidating every coin you own into one transaction is publishing your net worth; some wallets offer *coin control* so you choose which boxes open together. **Three:** run your own node for your own wallet (Quest #9): asking someone else's server about your addresses tells that server exactly which addresses are yours, and a block explorer is just such a server with a nice interface. **Four:** remember who holds off-chain links: the exchange that KYC'd you, the merchant you shipped to. On-chain discipline can't unsay those.",
        "And the honest frame, because this site doesn't sell fog: none of this is about hiding wrongdoing, any more than envelopes are. It's about your salary, your savings, and your donations not being a public dataset joined to your name for strangers, advertisers, and thieves (Quest #14's threat list applies: people who can see wealth can target it). The ledger is glass by design and it bought you a bank with no banker. Handle it accordingly.",
      ],
    },
  ],
  finale: {
    title: 'The cluster detective: run the offense once',
    takeaway:
      "Play analyst against a toy neighborhood ledger: one known address, the common-input and change heuristics, and watch a 'private' shop collapse into one labeled cluster. Then flip on disciplined habits and watch the same trick starve.",
    runnerId: 'cluster-detective',
    note: 'The clustering below runs the real heuristics (common-input ownership + fresh-change detection) over a fixed toy ledger, deterministically. Real chain-analysis is this, at industrial scale, with subpoenas. No live data is used and nothing you do here touches any real chain.',
  },
  recap: {
    tryIt:
      'Open any block explorer and look up one address from your own wallet (a practice one from Quest #11 counts). Follow its transaction once: find the change output, then notice the explorer now knows you cared about that address. Both lessons in one minute.',
    items: [
      {
        text: '**The ledger is glass**: every payment public forever, names omitted. Pseudonymity is real but it is a discipline, not a feature.',
      },
      {
        text: '**Your wallet defends you by default**: fresh receive addresses, a tracked "used" list, and change that always goes somewhere brand-new.',
        cite: 'wallet.cpp:2639',
      },
      {
        text: '**Spending is where privacy leaks**: multi-input transactions confess common ownership, and the whitepaper itself said so.',
      },
      {
        text: '**The links that hurt most are off-chain**: exchanges and merchants already hold name-to-address joins no heuristic needs.',
      },
    ],
    closing:
      "**Keep verifying:** the wallet code above links to the pinned source like every other excerpt on this site. You now know what the watchers see, what your software already does about it, and which habits are yours to keep. That's the whole defense; there is no more secret than that.",
  },
  feynman: {
    prompt: 'Explain to a friend why Bitcoin is both the most public and the most private money they use, in three sentences.',
    model:
      'Every Bitcoin payment is published to a ledger anyone can read forever, so in that sense it is radically public: amounts, addresses, timestamps, all of it. But the ledger records addresses instead of names, wallets generate a fresh address for every payment and every bit of change, so nothing links the entries to you unless your habits or your exchange leak the connection. Whether Bitcoin is transparent or private is decided by behavior, not by the protocol, and mostly at the moment you spend.',
  },
};
