import type { Quest } from './types.js';
import { BITCOIN_PIN, BOLTS_PIN } from './excerpts.js';

/**
 * Quest #16: Lightning. The curriculum's closing move: after fifteen
 * quests about what the chain writes down, one about what it doesn't
 * have to. Channels as tabs the chain enforces, the revocation script
 * quoted verbatim from the BOLT specifications (the site's THIRD
 * pinned repository), and a channel simulator that shows a thousand
 * coffees fitting into two on-chain transactions.
 */
export const quest16: Quest = {
  id: 'quest-16',
  slug: 'a-thousand-coffees',
  number: 16,
  kicker: 'Beyond the chain.',
  track: 'Beyond the chain',
  title: 'Where do a thousand coffees fit?',
  summary:
    "Not on the chain, and that's the trick: open a tab secured by Bitcoin, pay a thousand times for free, settle twice. Lightning from primary sources, honest limits included.",
  duration: '11 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'the tab',
    text: "Ana and Bo trade every week now, and every payment queues in the auction with everyone else's. So they open a tab the chain itself enforces: coins locked to both their keys, a running balance only they update, and the ledger hears about it exactly twice. Sixteen chapters in, they've stopped renting blockspace for coffee.",
  },
  intro: [
    "Quest #12 taught the hard truth: block space is ~4 million weight units every ten minutes, forever, and everyone on Earth bids for it. That auction is what keeps the base layer honest, and it's also why buying coffee on it will always be like settling a $3 debt by international wire: possible, secure, and absurd.",
    "The scaling wars (Quest #13's ancestors) offered one answer: bigger blocks, cheaper seats, heavier nodes, fewer verifiers. Bitcoin chose the other: **write less**. If two people will pay each other many times, they don't need the whole world to audit every round; they need the world to audit the *opening*, the *closing*, and to stand ready as the courtroom if either cheats. That idea is the Lightning Network, and this quest reads it from its actual specifications, the BOLTs, a **third pinned repository** verified letter for letter like everything else here.",
  ],
  promise:
    "Every snippet below is copied verbatim from the pinned sources: Bitcoin Core at commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b) and the Lightning specifications (BOLTs) at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'the-limit',
      title: 'The cash register the whole world shares',
      takeaway:
        "The base chain processes a handful of transactions per second, **by design**: small blocks are what keep Quest #9's 'run it on an old laptop' promise alive. Scaling without breaking that promise means changing *what needs writing down*, not how big the page is.",
      myth: {
        belief: "Bitcoin can't scale, so it failed as payments and is only 'digital gold.'",
        reality:
          'The base layer is a settlement system anyone on Earth can audit on cheap hardware. It scales the way settlement systems always have: most payments happen in enforceable agreements *above* it, which touch the ledger only to open, close, or dispute. The question was never "can the chain hold every coffee" but "can a coffee be secured by the chain without living on it." Lightning is the working answer, with real trade-offs this quest will not hide.',
      },
      contrastLabels: { left: 'On the chain', right: 'On Lightning' },
      contrast: [
        {
          aspect: 'Who verifies your payment',
          bank: 'Every node on Earth, forever',
          bitcoin: 'The two ends of a channel; the chain only if they disagree',
        },
        {
          aspect: 'Speed and cost',
          bank: 'Minutes to hours; you bid in the fee auction',
          bitcoin: 'Instant; fees are fractions of a sat',
        },
        {
          aspect: 'What is public',
          bank: 'Everything (Quest #15)',
          bitcoin: 'Only the open and close reach the ledger',
        },
        {
          aspect: 'The catch',
          bank: 'Cost and queueing',
          bitcoin: 'Liquidity limits, uptime duties, and custodial shortcuts that reintroduce trust',
        },
      ],
      prose: [
        'Do the arithmetic you learned in Quest #12: ~1,000,000 vbytes per block, a typical payment ~140 vbytes, one block per ten minutes. That is a global ceiling of a few payments per second, shared by all of humanity. Raise it a hundredfold and you get Quest #13\'s trade in its starkest form: nodes only institutions can run, which quietly repeals Quest #9.',
        "So flip the question. A payment needs the chain for exactly one thing: **enforcement**. If Ana and Bo could hold signed, chain-enforceable IOUs that either can cash at any moment, they wouldn't need the world to witness every coffee; the *threat* of settlement does the honest-keeping. The next two stops show the two scripts that make that threat real, quoted from the Lightning specs themselves.",
      ],
    },
    {
      id: 'the-tab',
      title: 'Opening the tab: one lock, two keys',
      takeaway:
        'A channel begins as an ordinary on-chain transaction locking coins to a **2-of-2 multisig**: spendable only with *both* signatures. From that moment, updating who owns what inside the lock needs no blockchain at all, just two signatures on a new split.',
      quiz: [
        {
          question: 'Ana and Bo\'s channel holds 100,000 sats. Ana buys a 5,000-sat coffee. What happens on the blockchain?',
          options: [
            'A 5,000-sat transaction confirms in the next block',
            'Nothing at all: they both sign an updated split (55,000 / 45,000) and keep it',
            'The multisig unlocks and relocks with new amounts',
          ],
          answer: 1,
          explain:
            'The funding output sits on-chain untouched. The balance lives in the latest mutually signed commitment transaction, which either party COULD broadcast but neither needs to. A thousand coffees are a thousand re-signings of a private split, and the chain hears about none of them until the close.',
        },
      ],
      prose: [
        "This is BOLT #3, the Lightning transaction spec, defining the **funding output**: a pay-to-witness-script-hash wrapping `2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG`. You've read `OP_CHECKSIG` demand one signature since Quest #3; this is its plural: two required, two provided, or the coins never move. Neither Ana nor Bo can take anything alone. (Even the pubkey *ordering* is nailed down, lexicographically, because a spec two strangers' software must agree on can leave nothing to taste.)",
        "Now the trick that makes it a payment network rather than a shared piggy bank: before funding ever confirms, each side holds a signed **commitment transaction** spending the funding output back out at the current split. Buy a coffee, and both wallets sign a fresh pair at the new split. The latest commitment is an exit either party can use unilaterally, at any time, no permission needed. The chain became the enforcer of a private, constantly-rewritten contract. One problem remains: what stops Bo from broadcasting an *old* split where he had more? That's the next stop, and it's the best script on this site.",
      ],
      annotations: [
        { lines: 'L77', text: 'P2WSH: the same address machinery from Quest #10, wrapping a script instead of a single key.' },
        { lines: 'L79', text: 'The whole lock: 2 signatures required from these 2 keys. OP_CHECKMULTISIG is Quest #3\'s checkpoint, pluralized.' },
        { lines: 'L81', text: 'Even key order is specified. Interoperability means no ambiguity anywhere.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '03-transactions.md', startLine: 75, endLine: 81 },
        language: 'text',
        lines: [
          { n: 75, text: '## Funding Transaction Output' },
          { n: 76, text: '' },
          { n: 77, text: '* The funding output script is a P2WSH to:' },
          { n: 78, text: '' },
          { n: 79, text: '`2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG`', highlight: true },
          { n: 80, text: '' },
          { n: 81, text: '* Where `pubkey1` is the lexicographically lesser of the two `funding_pubkey` in compressed format, and where `pubkey2` is the lexicographically greater of the two.' },
        ],
      },
    },
    {
      id: 'the-penalty',
      title: 'The script that makes cheating suicidal',
      takeaway:
        'Every commitment pays its broadcaster through a **delay-or-punish script**. The honest path: wait `to_self_delay` blocks, then take your share. The cheating path: broadcast an outdated split, and your counterparty instantly takes *everything*, using the **revocation key** you surrendered when the channel updated.',
      quiz: [
        {
          question: 'Bo broadcasts an old commitment where his share was bigger. What does the to_local script let Ana do?',
          options: [
            'File a dispute for arbitration',
            'Nothing: whoever broadcasts first wins',
            'Use the revocation key Bo surrendered when they updated the channel, and take his entire balance before his delay expires',
          ],
          answer: 2,
          explain:
            "Each update trades revocation secrets: accepting the new split means handing over the key that makes your OLD commitment's OP_IF branch spendable by the other side. Bo's cheating broadcast must sit through to_self_delay blocks (the OP_ELSE branch), while Ana's penalty path works immediately. Cheating doesn't risk the stolen amount; it forfeits everything. Rational nodes never try.",
        },
      ],
      prose: [
        "Here it is, verbatim from BOLT #3: the `to_local` output script that guards a broadcaster's own share. Read the two branches like the Quest #3 veteran you are. **OP_ELSE path:** the honest exit; wait `to_self_delay` blocks (`OP_CHECKSEQUENCEVERIFY`, a real consensus timelock), then your key spends your share. **OP_IF path:** labeled `# Penalty transaction` right in the spec; the *other* party spends this output instantly, with no delay, if they hold the revocation key.",
        "The genius is in when that key changes hands: every time the channel updates, each side **surrenders the revocation secret for its previous state** as the price of the new one. Result: broadcasting the latest commitment is safe (nobody holds its revocation key yet); broadcasting any older one puts your entire balance behind a script your counterparty can raid for `to_self_delay` blocks. The chain doesn't know which state is 'latest.' It doesn't have to. The incentives make old states radioactive.",
        "One more echo before we zoom out: an `OP_IF` doing either/or duty inside a script securing real money is exactly the construction Quest #13 flagged as BIP-110 collateral (its rule 7 bans tapscripts that *execute* `OP_IF`). Today's Lightning channels use pre-taproot scripts and are untouched by that proposal, but the lesson stands: layers are built from the base chain's script legos, so consensus fights about the legos are never only about 'spam.'",
      ],
      annotations: [
        { lines: 'L115', text: 'The spec\'s own summary: timelocked for the owner, instantly claimable by the other side with the revocation key.' },
        { lines: 'L117–19', text: 'Branch one, labeled "Penalty transaction" in the spec itself: the counterparty\'s revocation key spends immediately.' },
        { lines: 'L120–24', text: 'Branch two, the honest path: wait to_self_delay blocks (a real consensus timelock), then take your share.' },
        { lines: 'L126', text: 'Either way, Quest #3\'s toll booth: no signature, no coins.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '03-transactions.md', startLine: 113, endLine: 126 },
        language: 'text',
        lines: [
          { n: 113, text: '#### `to_local` Output' },
          { n: 114, text: '' },
          { n: 115, text: 'This output sends funds back to the owner of this commitment transaction and thus must be timelocked using `OP_CHECKSEQUENCEVERIFY`. It can be claimed, without delay, by the other party if they know the revocation private key. The output is a version-0 P2WSH, with a witness script:' },
          { n: 116, text: '' },
          { n: 117, text: '    OP_IF', highlight: true },
          { n: 118, text: '        # Penalty transaction', highlight: true },
          { n: 119, text: '        <revocationpubkey>' },
          { n: 120, text: '    OP_ELSE' },
          { n: 121, text: '        `to_self_delay`' },
          { n: 122, text: '        OP_CHECKSEQUENCEVERIFY', highlight: true },
          { n: 123, text: '        OP_DROP' },
          { n: 124, text: '        <local_delayedpubkey>' },
          { n: 125, text: '    OP_ENDIF' },
          { n: 126, text: '    OP_CHECKSIG', highlight: true },
        ],
      },
    },
    {
      id: 'the-network',
      title: 'From a tab to a network, honestly',
      takeaway:
        "Chain channels together and Ana can pay strangers through Bo without trusting anyone en route: that's the *network* in Lightning. It works today at real scale, and it carries real duties: liquidity, uptime, and the ever-present custodial shortcut that quietly reintroduces banks.",
      myth: {
        belief: "Lightning isn't real Bitcoin; it's some separate system where you just trust servers.",
        reality:
          "A Lightning balance in a real channel is a signed Bitcoin transaction you can enforce on-chain unilaterally; the base chain's full rules (all fifteen quests of them) back every sat. The caveat hides in wallet choice: many popular 'Lightning wallets' are custodial, meaning a company holds the channels and you hold an IOU, which is Quest #14's exchange problem wearing a lightning bolt. The protocol is trustless; your app may not be.",
      },
      prose: [
        "Payments route. If Ana↔Bo and Bo↔Carla have channels, Ana can pay Carla *through* Bo. A cryptographic gadget (a hash-locked contract) makes sure Bo can't pocket the payment in transit: either he passes it along and earns a routing fee measured in millisats, or nothing moves at all. Chain those hops and you get a network where most participants are a few handshakes apart.",
        "Now the honest bill, itemized. **Liquidity:** a channel can only push what's on your side of it; receiving needs capacity pointed at you, and managing that is real work the marketing skips. **Uptime:** the penalty script only defends you if someone is watching the chain during `to_self_delay`; be offline too long and delegated watchers (or luck) are your defense. **On-chain gravity:** opens, closes, and disputes still bid in Quest #12's auction, so base-layer fee crises raise Lightning's floor too. **The custodial slide:** because self-managed channels take effort, many users drift to custodians, and Quest #14 already told you what an IOU is. Lightning removes the *need* for trust; it cannot remove the convenience of it.",
      ],
    },
  ],
  finale: {
    title: 'Run a channel: a thousand coffees, two transactions',
    takeaway:
      'Open a channel, buy coffee after coffee and watch the split move with zero chain footprint, let Bo try broadcasting an old state and watch the penalty script eat him, then close and count the bytes you never bought.',
    runnerId: 'channel-simulator',
    note: 'Balances and penalties follow the BOLT #3 machinery you just read (latest-commitment exits, revocation on update, to_self_delay on the honest path); byte counts use typical sizes (~140 vB per simple payment, a few hundred per open or close) and are labeled approximate. A simulation of two honest-by-incentive strangers, not a wallet.',
  },
  recap: {
    tryIt:
      "Next payment QR you meet in the wild, read its first letters before anything else: bc1 means an address, a seat in the on-chain auction; lnbc means a Lightning invoice, a tab. You now know exactly which ledger each one writes to, and what that costs.",
    items: [
      {
        text: '**Block space is deliberately scarce**, so scaling means writing less, not printing bigger pages: agreements above the chain, enforcement on it.',
      },
      {
        text: '**A channel is coins locked to two keys**: `2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG`, updated by trading signed splits nobody broadcasts.',
        cite: '03-transactions.md:79',
      },
      {
        text: "**Old states are radioactive**: each update surrenders the previous state's revocation key, so cheating forfeits everything via the OP_IF penalty branch while honesty waits out to_self_delay.",
        cite: '03-transactions.md:117',
      },
      {
        text: '**The network is real and so are the duties**: liquidity, watching the chain, and the custodial shortcut that turns a trustless protocol back into an IOU.',
      },
    ],
    closing:
      "**Keep verifying:** this quest quoted a third pinned repository, and the promise never changed: letter for letter, link after link. Sixteen quests ago the ledger was a mystery someone else understood. Now you can read its constitution, audit its supply, hold its keys, and follow its money above the chain. There is nobody left you have to believe.",
  },
  feynman: {
    prompt: 'Explain to a friend how two people can pay each other a thousand times while the blockchain only sees two transactions, in three sentences.',
    model:
      'They lock coins on-chain in a box that opens only with both signatures, then privately re-sign an updated split of that box every time one pays the other, so the thousand payments are just a thousand rewrites of who-owns-what. Either person can cash out to the chain at any moment using the latest split, and cheating with an old one fails because each update handed the other person a penalty key that instantly confiscates a cheater\'s entire share. The blockchain only sees the box open and the final split close it, and its readiness to enforce is what keeps every unwritten payment honest.',
  },
};
