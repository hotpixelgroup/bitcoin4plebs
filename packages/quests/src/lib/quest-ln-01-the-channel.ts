import type { Quest } from './types.js';
import { BOLTS_PIN, LND_PIN } from './excerpts.js';

/**
 * Lightning Quest #1. Everything else on this site stands on this one
 * idea: coins locked so that neither party can move them alone, and a
 * balance between them that the blockchain never sees.
 */
export const questLn01: Quest = {
  id: 'quest-ln-01',
  site: 'lightning',
  slug: 'what-is-a-channel',
  number: 1,
  kicker: "Don't trust. Verify.",
  track: 'The channel',
  title: 'What is a channel, actually?',
  summary:
    "Two people, one shared lock, and a running balance the chain never hears about. The 2-of-2 output that starts every Lightning channel, read from the specification and from a node that implements it.",
  duration: '10 min',
  pin: BOLTS_PIN,
  story: {
    stage: 'the tab',
    text: "Mira sells coffee from a cart outside the market. Tomas buys one most mornings — 4,000 sats, six days a week. Paid on-chain that is 300-odd transactions a year, each one bidding against the entire world for room in a block, to settle a debt worth less than the fee. So they do something older than Bitcoin and older than banks: they open a tab. The difference is that this tab is enforced by the chain, and neither of them has to trust the other for a second.",
  },
  intro: [
    "Every explanation of Lightning you have ever read reaches for the same metaphor: it's a bar tab, it's a running total, it's an IOU you settle later. The metaphor is good. It is also where every misunderstanding lives, because a tab normally requires trust — the bar trusts you'll pay, or you trust the bar not to invent drinks you never had.",
    "A Lightning channel is a tab with the trust removed. Not reduced: **removed**. This quest reads the exact output that does it, from BOLT #3 — the Lightning specification's transaction format — and then from the source of a node that actually implements it. Two independent sources, both pinned, both quoted letter for letter.",
  ],
  promise:
    "Every snippet below is copied verbatim from the pinned sources: the Lightning specifications at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8) and LND v0.21.2-beta at commit [29257ec](https://github.com/lightningnetwork/lnd/commit/29257ecc8892af0c882fa627b66a556190c84fd9). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'the-ceiling',
      title: 'Why a coffee is the wrong thing to put on a blockchain',
      viz: 'channel-footprint',
      takeaway:
        "The base chain is a settlement layer with a hard, permanent ceiling: a few payments per second for the whole planet. That ceiling isn't a bug being worked on — it's the thing that lets anyone verify the whole ledger on cheap hardware. So a coffee doesn't belong there, and no amount of engineering will change that.",
      contrastLabels: { left: 'Paying on-chain', right: 'Paying in a channel' },
      contrast: [
        {
          aspect: 'Who has to check it',
          bank: 'Every node on Earth, forever',
          bitcoin: 'The two people involved',
        },
        {
          aspect: 'What it costs',
          bank: 'Whatever the global fee auction says today',
          bitcoin: 'Fractions of a satoshi',
        },
        {
          aspect: 'How long it takes',
          bank: 'A block, if your fee was high enough',
          bitcoin: 'About as long as the network round trip',
        },
        {
          aspect: 'What it costs to be wrong',
          bank: 'Nothing — the rules are enforced for you',
          bitcoin: 'This is the question the next quest answers',
        },
      ],
      prose: [
        "A block is about 4 million weight units and arrives roughly every ten minutes. A simple payment takes around 140 vbytes. Do the division and the entire world gets a handful of payments per second, permanently. Mira's cart alone would want three a minute at the morning rush.",
        "You could raise the ceiling. That argument was had, at length, and Bitcoin chose the other answer: **write less down**. (The auction that ceiling creates is [Quest #12 on bitcoin4plebs](https://hotpixelgroup.github.io/bitcoin4plebs/quests/who-keeps-bitcoin-usable), if you want to watch it work.) If two people are going to pay each other over and over, the world does not need to witness each payment. The world needs to witness the *opening*, the *closing*, and to stand ready as the court if either of them lies. Everything in this quest is about constructing that court case in advance.",
      ],
    },
    {
      id: 'the-lock',
      title: 'One lock, two keys',
      takeaway:
        "A channel starts as an ordinary on-chain transaction paying into a **2-of-2 multisig**: an output that moves only when *both* people sign. Tomas cannot take the money. Mira cannot take the money. That symmetry is the entire foundation.",
      myth: {
        belief: 'Lightning is a separate network, so my coins leave Bitcoin when I use it.',
        reality:
          "Your coins are sitting in a perfectly ordinary Bitcoin output, on the Bitcoin blockchain, secured by the same rules as every other output — [the same rules bitcoin4plebs reads from Bitcoin Core](https://hotpixelgroup.github.io/bitcoin4plebs/quests/what-stops-someone-spending-your-coins). What is different is that spending it needs two signatures instead of one, and that the two of you keep re-agreeing on how to split it without telling anyone. Nothing left the chain. The chain simply hasn't been asked about it lately.",
      },
      prose: [
        "This is BOLT #3 defining the funding output: a pay-to-witness-script-hash wrapping `2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG`. If you have read any Bitcoin script before, `OP_CHECKMULTISIG` is the plural of the usual signature check — this many signatures, from these keys, or the coins do not move.",
        "Look at the last line, though, because it is doing quiet work. The two keys are not in the order the two nodes happened to mention them. They are sorted: `pubkey1` is the lexicographically smaller one. Two strangers' software, written by different people in different languages, must produce byte-identical scripts or the channel simply does not exist. A specification that left ordering to taste would be a specification that did not interoperate.",
      ],
      annotations: [
        { lines: 'L77', text: 'P2WSH: the output commits to a script, and the script is revealed only when the money moves.' },
        { lines: 'L79', text: 'The whole lock. Two signatures required, from these two keys, or nothing happens.' },
        { lines: 'L81', text: 'Sorted, not as-supplied. Interoperability leaves nothing to preference.' },
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
      id: 'a-node-that-runs-it',
      title: 'The same rule, in a node that actually runs it',
      takeaway:
        "A specification is a claim about what software will do. Here is the software. LND builds the identical script, and does the lexicographic sort in three lines — with a comment explaining that the *signatures* must follow the same order, or the stack won't unwind.",
      quiz: [
        {
          question: 'Why does LND swap the two public keys before building the script?',
          options: [
            'To save space in the transaction',
            "So both peers independently produce byte-identical scripts, whichever order they exchanged keys in",
            'To hide which peer opened the channel',
          ],
          answer: 1,
          explain:
            "Mira's node and Tomas's node each build the funding script locally, then must agree on its hash — that hash is the address the money is paid into. If one sorted and the other didn't, they'd compute different addresses and the channel would never open. This is why specifications nail down ordering: it's not fussiness, it's the difference between interoperating and not.",
        },
      ],
      prose: [
        "This is why quoting two sources matters. A spec can be read charitably; running code cannot. LND checks the keys are compressed (33 bytes — the format from BOLT #3's last line), sorts them, and emits exactly `OP_2 <pubA> <pubB> OP_2 OP_CHECKMULTISIG`.",
        "The comment on lines 156–159 is the part worth keeping. The sort isn't only about the script: the *signatures* later supplied to unlock it must appear in the same order, because `OP_CHECKMULTISIG` walks the stack in order and doesn't backtrack. One rule, enforced in two places, agreed on by every implementation on the network.",
      ],
      annotations: [
        { lines: 'L151–54', text: 'Compressed keys only — 33 bytes, exactly as BOLT #3 specifies.' },
        { lines: 'L160–62', text: 'The lexicographic sort, in three lines. This is BOLT #3 line 81, executing.' },
        { lines: 'L165', text: 'The finished script, identical to the spec\'s: two of these two keys, or nothing.' },
      ],
      excerpt: {
        pin: LND_PIN,
        ref: { file: 'input/script_utils.go', startLine: 148, endLine: 171 },
        language: 'go',
        lines: [
          { n: 148, text: '// GenMultiSigScript generates the non-p2sh\'d multisig script for 2 of 2' },
          { n: 149, text: '// pubkeys.' },
          { n: 150, text: 'func GenMultiSigScript(aPub, bPub []byte) ([]byte, error) {', highlight: true },
          { n: 151, text: '	if len(aPub) != 33 || len(bPub) != 33 {' },
          { n: 152, text: '		return nil, fmt.Errorf("pubkey size error: compressed " +' },
          { n: 153, text: '			"pubkeys only")' },
          { n: 154, text: '	}' },
          { n: 155, text: '' },
          { n: 156, text: '	// Swap to sort pubkeys if needed. Keys are sorted in lexicographical' },
          { n: 157, text: '	// order. The signatures within the scriptSig must also adhere to the' },
          { n: 158, text: '	// order, ensuring that the signatures for each public key appears in' },
          { n: 159, text: '	// the proper order on the stack.' },
          { n: 160, text: '	if bytes.Compare(aPub, bPub) == 1 {', highlight: true },
          { n: 161, text: '		aPub, bPub = bPub, aPub', highlight: true },
          { n: 162, text: '	}', highlight: true },
          { n: 163, text: '' },
          { n: 164, text: '	return txscript.ScriptTemplate(' },
          { n: 165, text: '		`OP_2 {{ hex .pubA }} {{ hex .pubB }} OP_2 OP_CHECKMULTISIG`,', highlight: true },
          { n: 166, text: '		txscript.WithScriptTemplateParams(TemplateParams{' },
          { n: 167, text: '			"pubA": aPub,' },
          { n: 168, text: '			"pubB": bPub,' },
          { n: 169, text: '		}),' },
          { n: 170, text: '	)' },
          { n: 171, text: '}' },
        ],
      },
    },
    {
      id: 'the-running-balance',
      title: 'The balance nobody publishes',
      takeaway:
        "Before the funding transaction is even broadcast, each side holds a signed transaction spending it back out at the agreed split. Buying a coffee doesn't touch the chain — it means signing a *new* pair at a new split. Either party can cash out unilaterally, at any moment, without asking.",
      quiz: [
        {
          question: "Their channel holds 200,000 sats: 200,000 to Tomas, 0 to Mira. Tomas buys a 4,000-sat coffee. What reaches the blockchain?",
          options: [
            'A 4,000-sat payment, in the next block',
            'Nothing. They sign a new split — 196,000 / 4,000 — and keep it',
            'The multisig is unlocked and re-locked at the new amounts',
          ],
          answer: 1,
          explain:
            "The funding output sits untouched. The balance lives in the newest mutually-signed commitment transaction, which either party *could* broadcast but neither needs to. A hundred coffees are a hundred re-signings of a private split, and the chain hears about none of them — until somebody closes.",
        },
      ],
      prose: [
        "Here is the move that turns a shared piggy bank into a payment channel. The funding transaction is built but, crucially, *before it is broadcast*, each side signs a **commitment transaction**: a transaction spending the funding output back out, at the current balance. Only then do they publish the funding transaction. Neither can be held hostage, because each already holds an exit.",
        "Every payment is then just a new pair of commitment transactions at a new split, signed and swapped privately. Instant, free, and invisible. The chain's role has been reduced to a promise: *if either of you brings me a signed commitment, I will enforce it.* That promise is what makes the tab trustless.",
        "Which leaves one enormous hole, and you have probably already found it. Tomas holds every commitment they have ever signed — including the very first one, where all 200,000 sats were his. What stops him from waiting until he has drunk fifty coffees and then broadcasting the state from day one? That is the next quest, and it contains the best script on this site.",
      ],
    },
  ],
  finale: {
    title: 'Run a channel: a hundred coffees, two transactions',
    takeaway:
      "Open a channel, buy coffee after coffee and watch the split move with no chain footprint at all, then close it and count the block space you never had to buy.",
    runnerId: 'channel-simulator',
    note: 'Balances follow the BOLT #3 machinery above (a 2-of-2 funding output, and a latest commitment either side can exit with). Byte counts use typical sizes — about 140 vB for a simple payment, a few hundred for an open or close — and are labelled approximate. This is a simulation of the mechanics, not a wallet.',
  },
  recap: {
    tryIt:
      "Open any Lightning wallet that shows channel details — most do, under something like 'channels' or 'node info' — and find the funding transaction ID. Paste it into a block explorer. You are looking at your own channel's 2-of-2 output, sitting on the Bitcoin blockchain, exactly as specified above. Every payment you have made through that channel is absent, and that is the point.",
    items: [
      {
        text: "**The chain's ceiling is deliberate**, so scaling means writing less down, not printing bigger pages.",
      },
      {
        text: '**A channel is a 2-of-2 output**: `2 <pubkey1> <pubkey2> 2 OP_CHECKMULTISIG`, with the keys sorted lexicographically so two strangers\' software agrees byte for byte.',
        cite: '03-transactions.md:79',
      },
      {
        text: '**A real node does exactly that**, sort and all, and requires the same order from the signatures that later unlock it.',
        cite: 'script_utils.go:160',
      },
      {
        text: '**The balance is a signed transaction nobody broadcasts.** Each side holds an exit before the funding transaction is ever published, so neither can be held hostage.',
      },
    ],
    closing:
      "**Keep verifying.** You have now read the same rule in two independent places — a specification and a running node — and they matched. That is the standard this site holds itself to as well: every excerpt above is diffed against its pinned source on every change, and the tools you'll meet later are graded against the specification's own test vectors. Next: the hole in the story, and the script that fills it.",
  },
  feynman: {
    prompt:
      "Explain to a friend, in three sentences, how two people can pay each other a hundred times while the blockchain only ever sees two transactions.",
    model:
      "They put coins into an output on the Bitcoin blockchain that can only be spent if both of them sign, so neither can touch it alone. Then, instead of paying each other on the chain, they privately sign updated versions of a transaction that splits that output — a new one for each payment — and simply keep the latest. The blockchain only sees the money go in and the final split come out, and its willingness to enforce whichever split they present is what keeps them both honest in between.",
  },
};
