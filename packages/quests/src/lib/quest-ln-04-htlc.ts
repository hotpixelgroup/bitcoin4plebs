import type { Quest } from './types.js';
import { BOLTS_PIN } from './excerpts.js';

/**
 * Lightning Quest #4: the HTLC. How a payment crosses people who have
 * never met, without any of them being able to steal it, the hash from
 * Quest #3, used as a lock that opens the whole chain at once.
 */
export const questLn04: Quest = {
  id: 'quest-ln-04',
  site: 'lightning',
  slug: 'crossing-strangers',
  number: 4,
  kicker: "Don't trust. Verify.",
  track: 'Routing',
  title: 'How does a payment cross strangers?',
  summary:
    'Mira has no channel with Ines. The payment goes through someone neither of them fully trusts and cannot be stolen in transit, because every hop is locked to the same secret and opens only in one direction.',
  duration: '12 min',
  pin: BOLTS_PIN,
  story: {
    stage: 'the relay',
    text: "Mira has a channel with Tomas and a channel with the market's payment hub. Ines has a channel with the hub too. Nobody has a channel with exactly the right person, which is the normal state of affairs. So the 180,000 sats for the beans has to travel: Mira to the hub, hub to Ines. The hub is a stranger to both of them, it is briefly promised the whole amount and must put up the same amount of its own, and it must not be able to keep Mira's.",
  },
  intro: [
    "Channels are pairwise. A network is not. If Lightning only worked between people who had already locked money up with each other, it would be a curiosity: you would need a channel with your landlord, your grocer, and everyone else you ever pay, each one funded in advance out of your own coins.",
    'Routing uses conditional promises on separate channels. The hub must reserve its own outgoing liquidity; no coin physically travels between funding outputs. The preimage lets it fulfill upstream after paying downstream, provided it follows the timing and recovery rules.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Lightning specifications at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8). The finale runs a real payment across a route in your browser and lets you try to steal it from the middle.",
  stops: [
    {
      id: 'the-stranger',
      title: 'The problem with the middle',
      takeaway:
        "Routing means a stranger stands between payer and payee. Any design where the middle *receives* money and is then *expected* to pass it on has reinvented trust. The only acceptable answer is a payment that cannot be completed halfway.",
      myth: {
        belief: "Routing nodes hold your money in transit, so you have to trust them not to run off with it.",
        reality:
          'A router gets an incoming conditional HTLC and uses separate outbound liquidity for its outgoing HTLC. It can delay or fail a payment and tie up liquidity. Hash conditions and deadlines protect correct participants that act and confirm recovery in time; they do not make every failure harmless.',
      },
      contrastLabels: { left: 'A bank transfer chain', right: 'A Lightning route' },
      contrast: [
        { aspect: 'What the middle receives', bank: 'The money, in full', bitcoin: 'A promise conditional on a secret it lacks' },
        { aspect: "If the middle vanishes", bank: 'Your money is somewhere in the system', bitcoin: 'Failure is resolved off-chain or through actively confirmed timeout transactions' },
        { aspect: 'Who has to be honest', bank: 'Every institution in the chain', bitcoin: 'No custodial intermediary is needed, but correct operation, monitoring and timely confirmation matter' },
        { aspect: 'What can go wrong', bank: 'Loss, freeze, reversal', bitcoin: 'Failure, temporary liquidity locks, fees, and potential loss if recovery deadlines are missed' },
      ],
      prose: [
        "Be honest about the shape of the problem. There is no way to make the hub *not* be involved: it owns one of the two channels the money must cross. The trick has to be in what 'involved' means.",
        'The goal is conditional multi-hop settlement: the same preimage lets the recipient fulfill and lets each forwarder claim upstream. Descending deadlines give intermediaries time to act. This protects parties that follow the protocol, monitor and confirm claims in time; it is not an unconditional guarantee against delay, chain congestion or implementation failures.',
        "The mechanism is one hash, the same hash you read in Quest #3's invoice.",
      ],
    },
    {
      id: 'the-message',
      title: 'The message that carries a payment',
      takeaway:
        "update_add_htlc carries amounts, a payment hash, an absolute expiry and an onion packet. The ordinary sender constructs and knows the route; an intermediary decrypts only its hop instructions, while still seeing its adjacent peers and local payment data.",
      quiz: [
        {
          question: 'What does the hub learn from the update_add_htlc that Mira sends it?',
          options: [
            'The full route, including that Ines is the final recipient',
            'The amount, the payment hash, an expiry, and an opaque packet it can open exactly one layer of',
            'Nothing at all: it is entirely encrypted',
          ],
          answer: 1,
          explain:
            "The hub sees the amount and the hash, because it needs both to construct the matching HTLC on its next channel. What it does not see is where the payment is ultimately going. That is inside the onion packet: the last field, which is Quest #5, and it is why this message carries 1,366 bytes it cannot read.",
        },
      ],
      prose: [
        "HTLC stands for Hashed Timelock Contract, and the name is a fair description: a promise locked by a hash, with a deadline. This message is how one is offered.",
        'The update includes an amount in millisatoshis, a payment hash, an absolute CLTV expiry and an onion packet. The hash links fulfillment conditions; expiry enables timeout recovery rather than automatically moving funds. The deadline lab makes these separate steps visible.',
        "Notice what is *absent*: no recipient, no sender, no route, no description. A routing node handles a number, a hash, a deadline and a sealed envelope. That is the whole job.",
      ],
      annotations: [
        { lines: 'L2787', text: 'Millisatoshis: the unit that exists only above the chain, so routing fees need not round to zero.' },
        { lines: 'L2788', text: 'The same hash at every hop along the route. This is what makes the hops one atomic payment rather than several.' },
        { lines: 'L2789', text: 'The deadline, as a block height. The next stop is about why each hop gets a different one.' },
        { lines: 'L2790', text: 'A fixed 1,366 bytes, always. Quest #5 is about what is inside and why the size never changes.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '02-peer-protocol.md', startLine: 2783, endLine: 2790 },
        language: 'text',
        lines: [
          { n: 2783, text: '1. type: 128 (`update_add_htlc`)' },
          { n: 2784, text: '2. data:' },
          { n: 2785, text: '   * [`channel_id`:`channel_id`]' },
          { n: 2786, text: '   * [`u64`:`id`]' },
          { n: 2787, text: '   * [`u64`:`amount_msat`]' },
          { n: 2788, text: '   * [`sha256`:`payment_hash`]', highlight: true },
          { n: 2789, text: '   * [`u32`:`cltv_expiry`]', highlight: true },
          { n: 2790, text: '   * [`1366*byte`:`onion_routing_packet`]', highlight: true },
        ],
      },
    },
    {
      id: 'the-lock',
      title: 'A lock that only the secret opens',
      viz: 'htlc-chain',
      takeaway:
        'An untrimmed HTLC can appear as an output in a commitment transaction. Its payment paths use a preimage or a timeout, and the quoted script also has a revocation path for a revoked commitment. Dust HTLCs may be trimmed. The spending conditions depend on which commitment was broadcast; on-chain recovery can involve second-stage transactions.',
      annotationsOpen: true,
      quiz: [
        {
          question: 'The hub has an HTLC from Mira locked to hash X. Ines reveals the preimage to claim her payment from the hub. What happens next?',
          options: [
            'The hub is out of pocket until Mira chooses to pay it',
            "The hub now knows the preimage, so it immediately uses it to claim Mira's HTLC: it is the same hash",
            'The payment has to be started again from the beginning',
          ],
          answer: 1,
          explain:
            'Ines reveals the preimage to the hub. That same preimage lets the hub fulfill its incoming HTLC. The deadline margin gives the hub time to act, but safe recovery also depends on monitoring, available fees and timely confirmation; a node that waits too long can lose money.',
        },
      ],
      prose: [
        'The preimage path requires the correct secret and signature. The timeout path permits a timeout transaction after its deadline; it does not transfer coins automatically. The outer revocation branch allows penalty spending of a revoked commitment. Expiry does not switch off all competing preimage spends. BOLT #3 defines the scripts and BOLT #5 explains on-chain resolution. The script shown is the original (non-anchor) version; anchor channels, the modern default, add a one-block wait to the claim and timeout paths.',
        "And the branch at the very top is one you have met before: the revocation key from Quest #2, because an HTLC output lives inside a commitment transaction and every output of a commitment transaction must be punishable if that commitment is a stale one. Nothing here is a special case. It is the same machinery, applied again.",
        'For a 180,000-sat invoice and a 180-sat forwarding fee, Mira offers the hub 180,180 sats and the hub offers Ines the full 180,000 sats. Ines reveals the secret on fulfillment; the hub uses it to fulfill upstream. The sender covers fees on top, rather than deducting them from the invoice.',
        'If forwarding fails, HTLCs are normally failed and removed off-chain. If a peer will not cooperate, recovery can require force-close and timeout spends. Height passing alone does not return funds; transactions must be broadcast and confirmed, and liquidity may remain locked meanwhile.',
      ],
      annotations: [
        { lines: 'L203–06', text: 'Quest #2 again: if this is a revoked commitment, the revocation key takes everything. Same machinery, applied to every output.' },
        { lines: 'L210–11', text: 'Timeout path: after the deadline a qualifying timeout transaction can spend the output. Recovery requires action and confirmation, not merely the passage of time.' },
        { lines: 'L213–14', text: 'The claim path: produce the preimage of the payment hash, and the money is yours as soon as the claim confirms.' },
        { lines: 'L215', text: 'A signature is still required, knowing the secret is not enough, you must also be the intended recipient.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '03-transactions.md', startLine: 203, endLine: 217 },
        language: 'text',
        lines: [
          { n: 203, text: '    # To remote node with revocation key' },
          { n: 204, text: '    OP_DUP OP_HASH160 <RIPEMD160(SHA256(revocationpubkey))> OP_EQUAL' },
          { n: 205, text: '    OP_IF' },
          { n: 206, text: '        OP_CHECKSIG' },
          { n: 207, text: '    OP_ELSE' },
          { n: 208, text: '        <remote_htlcpubkey> OP_SWAP OP_SIZE 32 OP_EQUAL' },
          { n: 209, text: '        OP_NOTIF' },
          { n: 210, text: '            # To local node via HTLC-timeout transaction (timelocked).' },
          { n: 211, text: '            OP_DROP 2 OP_SWAP <local_htlcpubkey> 2 OP_CHECKMULTISIG' },
          { n: 212, text: '        OP_ELSE' },
          { n: 213, text: '            # To remote node with preimage.', highlight: true },
          { n: 214, text: '            OP_HASH160 <RIPEMD160(payment_hash)> OP_EQUALVERIFY', highlight: true },
          { n: 215, text: '            OP_CHECKSIG', highlight: true },
          { n: 216, text: '        OP_ENDIF' },
          { n: 217, text: '    OP_ENDIF' },
        ],
      },
    },
    {
      id: 'the-ladder',
      title: 'The ladder of deadlines, and the honest costs',
      takeaway:
        'Each outgoing deadline is earlier than the incoming one, giving the forwarder a safety margin. This is time to monitor and confirm a claim, not a guarantee that congestion or an offline node cannot cause loss. Real wallets account for CLTV margins and chain fees.',
      prose: [
        "The deadlines have to descend. If the hub's outgoing HTLC to Ines expired *after* its incoming one from Mira, Ines could wait for Mira's to lapse, then claim, leaving the hub paying out with nothing to claim back. So every hop insists on a comfortable margin, and those margins add up down the route.",
        "Long routes accumulate timelock margins. A failed payment can lock liquidity until peers fail it off-chain or recovery transactions confirm on-chain. The passage of time alone does not guarantee return, and missing a competing-spend race can lose funds, as the deadline lab demonstrates.",
        "Two more honest costs, since this quest is where they belong. **Liquidity is directional**: the hub can only forward what is on its side of the outgoing channel, so a route can fail simply because the money is pointing the wrong way, and the payer usually cannot tell in advance. And **fees are per hop**, tiny but real: a base amount plus a proportion, which is why millisatoshis exist at all, who chooses those numbers, and how they add up into the price you actually pay, is Quest #6.",
        "None of this is a flaw in the design so much as the price of the design. A system where a stranger cannot steal from you is a system where a stranger can still fail to help you, and where the money you have committed to a promise is genuinely committed until the promise resolves.",
      ],
    },
  ],
  finale: {
    title: 'Route a payment, then try to steal it',
    takeaway:
      "Send 180,000 sats from Mira to Ines through a hub. Watch the HTLCs go out with the same hash and a descending ladder of deadlines, watch the preimage settle the route backwards, then play the hub and try to keep the money.",
    runnerId: 'htlc-relay',
    note: 'The preimage and payment hash are real SHA-256, computed in your browser: the "steal" attempt fails because the hash genuinely does not match, not because a simulation says no. Amounts, fees and the timelock ladder follow the BOLT #2 and #4 rules described above; block heights are illustrative.',
  },
  recap: {
    tryIt:
      "Read the wallet’s status and recovery documentation. A timeout message is not proof of an automatic refund: distinguish an off-chain failure, an unresolved on-chain output and a confirmed recovery spend. Do not infer guaranteed return merely because an expiry height has passed.",
    items: [
      {
        text: "**HTLCs replace custodial forwarding with conditional claims.** Safe resolution still depends on correct operation, monitoring, liquidity and timely confirmed spends.",
      },
      {
        text: '**`update_add_htlc` carries the payment**: an amount, the payment hash unchanged from the invoice, a deadline, and a sealed 1,366-byte packet.',
        cite: '02-peer-protocol.md:2788',
      },
      {
        text: '**HTLCs have conditional payment and timeout paths; revoked commitments also have penalty paths.** Timeout enables a spend rather than automatically returning coins. Monitoring, fees and confirmation deadlines matter.',
        cite: '03-transactions.md:214',
      },
      {
        text: "**Staggered deadlines give forwarders time to act.** They do not disable preimage or penalty paths on maturity, guarantee inclusion, or protect an output after a competing spend confirms.",
      },
    ],
    closing:
      '**Keep verifying.** The success path delivers the invoice amount using conditional HTLCs. Failed payments may lock liquidity and require active recovery. The next quest studies what the onion hides and what amounts, payment hashes and timing can still reveal.',
  },
  feynman: {
    prompt: 'Explain to a friend how a Lightning payment can pass through a stranger without them being able to steal it.',
    model:
      'The recipient chooses a secret and the route uses its hash. Revealing the preimage enables fulfillment backwards through the route. If payment fails, participants remove HTLCs off-chain or actively recover on-chain with timeout transactions. Deadlines, monitoring and confirmation matter; funds do not move merely because time passes.',
  },
};
