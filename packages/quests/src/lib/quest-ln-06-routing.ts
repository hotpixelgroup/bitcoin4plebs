import type { Quest } from './types.js';
import { BOLTS_PIN } from './excerpts.js';

/**
 * Lightning Quest #6: gossip, pathfinding and fees.
 *
 * Quest #4 showed a payment crossing hops without saying where the route
 * came from or what it costs. This is that quest: how a node learns the
 * network exists, how each node SETS its own price, and how those prices
 * are ASSESSED into the total a sender pays.
 */
export const questLn06: Quest = {
  id: 'quest-ln-06',
  site: 'lightning',
  slug: 'finding-a-route',
  number: 6,
  kicker: "Don't trust. Verify.",
  track: 'Routing',
  title: 'How does your wallet find a route?',
  summary:
    'Nobody publishes a map of Lightning, and no one sets its prices. Nodes gossip their own terms, senders add them up, and the cheapest path wins — arithmetic you can run against the specification’s own worked example.',
  duration: '12 min',
  pin: BOLTS_PIN,
  story: {
    stage: 'the map',
    text: "Mira's payment to Ines went through the market hub, and it cost her 180 sats. Nobody quoted her that price and no authority set it: the hub had announced its own terms to anyone listening, Mira's wallet had been quietly collecting those announcements for weeks, and when the moment came it added up a few candidate paths and picked the cheapest one that could carry the money. She saw a spinner for half a second.",
  },
  intro: [
    "Quest #4 waved a hand at something important. A payment crosses hops — fine — but *which* hops, chosen by whom, and at what price? There is no directory of Lightning. No company publishes a routing table and no committee sets a fee schedule.",
    "What exists instead is gossip: every node announces its own channels and its own terms, those announcements spread, and every wallet builds its own private map from them. When you pay, your wallet searches that map. This quest reads the announcement format, the fee rule applied to it, and then runs the specification's own worked example — a four-node network the BOLTs carry the arithmetic for, right down to the answer.",
  ],
  promise:
    "Every snippet below is copied verbatim from the Lightning specifications at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8). The finale reproduces the fee the specification calculates in its own worked example — to the satoshi, including the truncation.",
  stops: [
    {
      id: 'the-map',
      title: 'There is no map, so everyone builds their own',
      takeaway:
        "Nodes broadcast two kinds of message: *this channel exists* and *these are my terms right now*. Everything spreads to everyone, so every wallet holds its own copy of the network and its own opinion of what a payment should cost.",
      myth: {
        belief: 'Someone must be coordinating this — a directory, or the big nodes.',
        reality:
          "There is no directory and no coordinator. A node announces its own channels, its neighbours pass the announcement on, and that is the whole mechanism. Two wallets can hold slightly different maps at the same moment and both be right, because an announcement takes time to spread. This is why a payment can fail for a reason your wallet could not have known: it was routing on a map that was a few minutes stale.",
      },
      prose: [
        "A channel announcement is not a claim anyone has to take on faith. It names a `short_channel_id` — the block, the transaction and the output where that channel's funding transaction lives — so any node can go and look at the chain to confirm there really is a 2-of-2 output backing it. **You cannot announce a channel you did not fund.** That is what stops the map filling up with invented capacity.",
        "The second message is the interesting one for this quest. A `channel_update` says: here is what I currently charge, here is how much timelock I want, here is the smallest and largest payment I will carry. It is per direction — Mira's terms for forwarding towards the hub are a different message from the hub's terms for forwarding towards Ines — and a node can replace it whenever it likes.",
        "So a wallet's map is not just a graph of who is connected to whom. It is a graph annotated with prices, and those prices are the input to everything that follows.",
      ],
    },
    {
      id: 'setting-fees',
      title: 'How a fee is set: every node names its own price',
      takeaway:
        "Two numbers, chosen by each node for each direction, and advertised to the whole network: a **flat charge** per forward, and a **proportional charge** in millionths of the amount. Nobody approves them. There is no schedule and no floor.",
      viz: 'fee-calculator',
      quiz: [
        {
          question: 'Who decides what a routing node charges?',
          options: [
            'The Lightning specification sets the rates',
            'The node itself, unilaterally, and it advertises the choice to everyone',
            'The sender bids and the node accepts or declines',
          ],
          answer: 1,
          explain:
            "Each node picks its own two numbers and gossips them. The specification fixes the *formula* those numbers go into, never the numbers. That is why Lightning fees vary so much between nodes and why they can be near zero: an operator wanting traffic can advertise 0 and 0, and plenty do.",
        },
      ],
      prose: [
        "Here is the whole of fee-setting, in two fields of one message. `fee_base_msat` is a flat amount charged on every forward regardless of size. `fee_proportional_millionths` is charged per millionth of the amount — so 1,000 means 0.1%, and 1 means one part per million.",
        "A node picks both, for each direction of each channel, and changes them whenever it wants by broadcasting a fresh `channel_update`. Nobody approves the choice. There is no minimum, which is why plenty of nodes advertise zero and simply want the traffic, and no maximum, which is why a badly-configured node can price itself out of every route and never find out.",
        "Two neighbouring fields matter as much as the fees and get less attention. `cltv_expiry_delta` is how much timelock this hop insists on — Quest #4's descending ladder, chosen here. And `htlc_minimum_msat` / `htlc_maximum_msat` are the smallest and largest payment it will carry; the maximum is usually a node telling you, politely, how much liquidity it actually has in that direction.",
        "All of it is a claim, advertised in advance, that a sender can add up without asking anyone.",
      ],
      annotations: [
        { lines: 'L450', text: "The channel's on-chain identity: block, transaction, output. Anyone can check it exists." },
        { lines: 'L454', text: "This hop's contribution to Quest #4's timelock ladder, chosen by its operator." },
        { lines: 'L455', text: 'The smallest payment this hop will carry.' },
        { lines: 'L456–57', text: 'The two fee numbers. Set unilaterally by the node, advertised to everyone, changeable at will.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '07-routing-gossip.md', startLine: 446, endLine: 458 },
        language: 'text',
        lines: [
          { n: 446, text: '1. type: 258 (`channel_update`)' },
          { n: 447, text: '2. data:' },
          { n: 448, text: '    * [`signature`:`signature`]' },
          { n: 449, text: '    * [`chain_hash`:`chain_hash`]' },
          { n: 450, text: '    * [`short_channel_id`:`short_channel_id`]', highlight: true },
          { n: 451, text: '    * [`u32`:`timestamp`]' },
          { n: 452, text: '    * [`byte`:`message_flags`]' },
          { n: 453, text: '    * [`byte`:`channel_flags`]' },
          { n: 454, text: '    * [`u16`:`cltv_expiry_delta`]', highlight: true },
          { n: 455, text: '    * [`u64`:`htlc_minimum_msat`]' },
          { n: 456, text: '    * [`u32`:`fee_base_msat`]', highlight: true },
          { n: 457, text: '    * [`u32`:`fee_proportional_millionths`]', highlight: true },
          { n: 458, text: '    * [`u64`:`htlc_maximum_msat`]' },
        ],
      },
    },
    {
      id: 'assessing-fees',
      title: 'How a fee is assessed: one line of arithmetic, and who pays it',
      takeaway:
        "One formula, fixed by the specification, applied to each hop's own advertised numbers. The **sender pays every fee on the route**, up front, and each node charges using the channel it forwards *out of* — not the one the payment arrived on.",
      annotationsOpen: true,
      quiz: [
        {
          question: 'A pays C through B. Whose advertised fee does B collect?',
          options: [
            "The fee B advertised on the A→B channel, where the payment arrived",
            'The fee B advertised on the B→C channel, the one it forwards out of',
            'Half of each',
          ],
          answer: 1,
          explain:
            "A node charges for the forward it performs, so it uses the terms of the channel it is forwarding *into the network* — B→C. This trips people up constantly, and the specification settles it in its own worked example: A pays B *the fee it specified in the B->C channel_update*. It also means the first channel of any route is free, because the node forwarding out of it is the sender, and a sender does not charge itself.",
        },
      ],
      prose: [
        "There is exactly one fee formula in Lightning and this is it. Base, plus the amount times the proportional rate divided by a million. Everything else is which numbers go in.",
        "Two details in that arithmetic are easy to miss and both are load-bearing. The division **truncates** — the specification's own example works out to 10,199 rather than 10,200, and an implementation that rounded up would compute a fee the next hop refuses. And the fee is charged on the amount **forwarded**, not the amount the payer sends, which is why routes are costed from the destination backwards: each hop's fee depends on what the hops after it need.",
        "Who pays? The sender, entirely and in advance. A payment of 4,999,999 msat through one intermediate becomes 5,010,198 msat leaving the sender, of which 10,199 is B's. The payee receives exactly what they asked for; fees never come out of the invoice amount. This is the opposite of a card network, where the merchant absorbs the cost, and it is why Lightning fees feel invisible to whoever is being paid.",
        "The last line is the specification doing our homework for us: `200 + ( 4999999 * 2000 / 1000000 ) = 10199`. The finale runs that exact sum in your browser and refuses to claim anything unless it matches.",
      ],
      annotations: [
        { lines: 'L981', text: 'The formula, in full. Base plus proportional, integer division, no rounding up.' },
        { lines: 'L1114–15', text: 'The answer to the quiz above, stated by the spec: A pays the fee from the B->C update.' },
        { lines: 'L1118', text: 'The same formula again, now with real numbers about to go into it.' },
        { lines: 'L1120', text: '10,199 — not 10,200. The truncation is the whole reason to check your arithmetic against this line.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '07-routing-gossip.md', startLine: 979, endLine: 981 },
        language: 'text',
        lines: [
          { n: 979, text: 'The origin node:' },
          { n: 980, text: '  - SHOULD accept HTLCs that pay a fee equal to or greater than:' },
          { n: 981, text: '    - fee_base_msat + ( amount_to_forward * fee_proportional_millionths / 1000000 )', highlight: true },
        ],
      },
    },
    {
      id: 'choosing',
      title: 'Choosing a path, and why it sometimes fails',
      takeaway:
        "With prices on every edge, finding a route is a shortest-path search where 'short' means cheap. The catch is that the map says what nodes *charge*, never what they can currently *carry* — so a wallet is optimising over information it does not fully have.",
      viz: 'route-race',
      prose: [
        "Add the numbers up and the search is almost boring: enumerate plausible paths, cost each one, take the cheapest that fits inside the hops' advertised minimums and maximums. Real implementations dress this up — they weight timelock as a cost too, penalise long routes, and remember which hops failed recently — but the core is arithmetic on a graph you already hold.",
        "The cheapest route is frequently not the shortest. A four-hop path of nodes charging nothing beats a two-hop path through someone charging a thousand base, and wallets take it. That is worth knowing when a payment goes somewhere surprising: the route was chosen by price, not by distance.",
        "Now the honest limit, which is the whole reason Lightning payments fail. **Liquidity is not gossiped.** A `channel_update` tells you a channel exists, what it charges and the largest HTLC it will accept — it does not and cannot tell you how much is currently sitting on the near side. That changes with every payment through it, and broadcasting it would leak everyone's balances to the world.",
        "So your wallet picks a route on price, tries it, and finds out. A failure comes back saying which hop could not continue, the wallet marks it, and tries again. What you experience as a spinner is often two or three real attempts. This is not a bug that will be fixed; it is the direct cost of not publishing everybody's balances, and most people would make the same trade.",
      ],
    },
  ],
  finale: {
    title: "Route a payment across the specification's own network",
    takeaway:
      "Load the four-node network BOLT #7 works through, set your own fees, and watch routes get costed and ranked. Then check the spec's own sum: 200 + (4,999,999 × 2,000 / 1,000,000) should give 10,199, and nothing less will do.",
    runnerId: 'route-finder',
    note: "The graph and its eight channel_update values are the ones printed in BOLT #7's worked example, and CI checks they still match the pinned specification. The fee arithmetic is this site's own TypeScript, integer-only, checked against the number the specification calculates. Real wallets add penalties and retry history this does not model — the costing itself is exact.",
  },
  recap: {
    tryIt:
      "Next Lightning payment you make, look at the fee your wallet reports and divide it by the amount. It will usually be a few thousandths of a percent — and now you know it is not a rate anyone published, but the sum of two numbers chosen independently by each node you happened to route through, added up by your own wallet before it asked you to confirm.",
    items: [
      {
        text: '**Nobody publishes a map.** Nodes gossip their own channels, and a channel announcement names the on-chain output backing it, so invented capacity cannot spread.',
      },
      {
        text: '**Every node sets its own price**, per direction, in two advertised fields — a flat `fee_base_msat` and a proportional `fee_proportional_millionths`. No schedule, no floor, no approval.',
        cite: '07-routing-gossip.md:456',
      },
      {
        text: '**One formula assesses it**, with integer truncation, charged on the amount forwarded — and a node charges using the channel it forwards *out of*.',
        cite: '07-routing-gossip.md:981',
      },
      {
        text: '**The sender pays every fee, in advance**, so the payee always receives exactly the invoice amount.',
      },
      {
        text: '**Liquidity is never gossiped**, so a wallet routes on price and discovers capacity by trying. That is why payments fail and retry rather than being quoted.',
      },
    ],
    closing:
      "**Keep verifying.** The fee you pay on Lightning is not a rate somebody set — it is thousands of independent decisions, advertised in public, added up by your own software before it spends a satoshi. You have now read the announcement that carries those decisions, the one line of arithmetic that turns them into a price, and the reason your wallet sometimes has to guess. One question is left, and it is the one that decides whether any of this is yours.",
  },
  feynman: {
    prompt: 'Explain to a friend who decides what a Lightning payment costs, and how the number is arrived at.',
    model:
      "Nobody decides it centrally. Every node that forwards payments picks two numbers for itself — a flat charge and a percentage — and broadcasts them to the whole network, changing them whenever it likes. When you pay, your wallet already holds those broadcasts, so it works out several possible paths, adds up each hop's two numbers against the amount being carried, and takes the cheapest path that can handle it. The sender covers all of it up front, so the person being paid always receives exactly what they asked for.",
  },
};
