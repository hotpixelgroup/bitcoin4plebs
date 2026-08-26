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
    text: "Mira has a channel with Tomas and a channel with the market's payment hub. Ines has a channel with the hub too. Nobody has a channel with exactly the right person, which is the normal state of affairs. So the 180,000 sats for the beans has to travel: Mira to the hub, hub to Ines. The hub is a stranger to both of them, it is briefly holding the whole amount, and it must not be able to keep it.",
  },
  intro: [
    "Channels are pairwise. A network is not. If Lightning only worked between people who had already locked money up with each other, it would be a curiosity: you would need a channel with your landlord, your grocer, and everyone else you ever pay, each one funded in advance out of your own coins.",
    "So payments **route**. Mira pays Ines *through* the hub. And the obvious objection arrives immediately: the hub is now a stranger holding 180,000 sats that belong to neither of them. Why does it hand them on? The answer is not reputation, not escrow, and not a rule against stealing. It is that the hub is never given anything it can keep.",
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
          "A routing node never receives a spendable payment. What it receives is a conditional promise: money that becomes claimable only by revealing a secret it does not have, and the only way to get that secret is to pass the payment along and have it come back. Failing to forward earns nothing. Trying to keep it earns nothing. The worst a routing node can do to you is fail, and failing costs it the fee.",
      },
      contrastLabels: { left: 'A bank transfer chain', right: 'A Lightning route' },
      contrast: [
        { aspect: 'What the middle receives', bank: 'The money, in full', bitcoin: 'A promise conditional on a secret it lacks' },
        { aspect: "If the middle vanishes", bank: 'Your money is somewhere in the system', bitcoin: 'The promise expires and everything unwinds' },
        { aspect: 'Who has to be honest', bank: 'Every institution in the chain', bitcoin: 'Nobody. It is arithmetic' },
        { aspect: 'What can go wrong', bank: 'Loss, freeze, reversal', bitcoin: 'Failure, and funds briefly locked up' },
      ],
      prose: [
        "Be honest about the shape of the problem. There is no way to make the hub *not* be involved: it owns one of the two channels the money must cross. The trick has to be in what 'involved' means.",
        "Here is the goal, stated precisely: make the two hops **atomic**. Either the hub is paid by Mira *and* Ines is paid by the hub, or neither happens. Never one without the other. If you can build that, the hub's honesty becomes irrelevant, because there is no state of the world in which cheating leaves it better off.",
        "The mechanism is one hash, the same hash you read in Quest #3's invoice.",
      ],
    },
    {
      id: 'the-message',
      title: 'The message that carries a payment',
      takeaway:
        "`update_add_htlc` is how a payment enters a channel. Five fields, and three of them are the whole design: **how much**, **which hash unlocks it**, **when it expires**, and a sealed 1,366-byte packet the sender cannot read.",
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
        "Look at what travels. `amount_msat`, how much, in thousandths of a satoshi (the satoshi itself being the chain's smallest unit, which [bitcoin4plebs Quest #1](https://hotpixelgroup.github.io/bitcoin4plebs/quests/verify-the-21-million-cap) counts all 2,099,999,997,690,000 of). `payment_hash`, copied straight out of Ines's invoice, unchanged at every hop, which is exactly what makes the hops atomic. `cltv_expiry`, the block height after which this promise dies. And `onion_routing_packet`, always exactly 1,366 bytes, which tells the hub where to send it next and nothing else.",
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
        "An HTLC becomes a real output in the commitment transaction, with a script offering exactly two ways out: **reveal the preimage** and take it now, or **wait for the timeout** and give it back. There is no third branch, and that absence is the security.",
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
            "This is the atomicity, running backwards. The instant Ines takes her money she has published the secret to the hub, and that secret unlocks the hub's incoming HTLC too, because Mira used the same hash. The payment settles from the far end backwards, hop by hop, and no hop can be left holding the loss.",
        },
      ],
      prose: [
        "Read the branches. `OP_HASH160 <RIPEMD160(payment_hash)> OP_EQUALVERIFY OP_CHECKSIG` is the claim path: show a preimage that hashes correctly, sign, take the money, immediately, no delay. The `OP_NOTIF` branch above it is the refund path, and it is timelocked: after the deadline the money goes back where it came from.",
        "And the branch at the very top is one you have met before: the revocation key from Quest #2, because an HTLC output lives inside a commitment transaction and every output of a commitment transaction must be punishable if that commitment is a stale one. Nothing here is a special case. It is the same machinery, applied again.",
        "Now run the whole route. Mira offers the hub an HTLC locked to Ines's hash. The hub offers Ines an HTLC locked to the *same* hash, slightly smaller (it keeps a fee). Ines is the only one who knows the preimage, so she claims. In doing so she hands the secret to the hub, which immediately claims from Mira. The payment settles backwards, and at no point did anyone hold money they could keep.",
        "What if the hub simply refuses to forward? Then nothing happens: Mira's HTLC times out and the money comes back. What if the hub forwards but Ines never claims? Same. The failure mode of Lightning routing is *nothing happening*, which is the correct failure mode for a payment system.",
      ],
      annotations: [
        { lines: 'L203–06', text: 'Quest #2 again: if this is a revoked commitment, the revocation key takes everything. Same machinery, applied to every output.' },
        { lines: 'L210–11', text: 'The refund path, timelocked. After the deadline the money returns to whoever offered it.' },
        { lines: 'L213–14', text: 'The claim path: produce the preimage of the payment hash, and the money is yours immediately.' },
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
        "Each hop's deadline is *earlier* than the one before it, so a hop always has time to claim its incoming HTLC after paying out. That descending ladder is why long routes need long timelocks and why a stuck payment can lock funds for hours.",
      prose: [
        "The deadlines have to descend. If the hub's outgoing HTLC to Ines expired *after* its incoming one from Mira, Ines could wait for Mira's to lapse, then claim, leaving the hub paying out with nothing to claim back. So every hop insists on a comfortable margin, and those margins add up down the route.",
        "That is the real cost, and it is worth naming plainly rather than skipping. **Long routes need long timelocks.** A payment that gets stuck: a hop that goes offline mid-flight, say, can leave funds locked in an HTLC for hours or, on an unlucky route, over a day. Nothing is lost; it comes back. But it is unavailable, and if it was your whole channel balance, you cannot pay anyone else with it in the meantime.",
        "Two more honest costs, since this quest is where they belong. **Liquidity is directional**: the hub can only forward what is on its side of the outgoing channel, so a route can fail simply because the money is pointing the wrong way, and the payer usually cannot tell in advance. And **fees are per hop**, tiny but real: a base amount plus a proportion, which is why millisatoshis exist at all, who chooses those numbers, and how they add up into the price you actually pay, is the next quest.",
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
      "Next time a Lightning payment fails in your wallet, read the error instead of retrying blindly. 'No route' usually means liquidity is pointing the wrong way somewhere. 'Timed out' means an HTLC hit its deadline and unwound: your money is coming back, not gone. Knowing which of those you are looking at turns a mysterious failure into an ordinary one.",
    items: [
      {
        text: '**Routing puts a stranger in the middle**, and the design makes their honesty irrelevant rather than requiring it.',
      },
      {
        text: '**`update_add_htlc` carries the payment**: an amount, the payment hash unchanged from the invoice, a deadline, and a sealed 1,366-byte packet.',
        cite: '02-peer-protocol.md:2788',
      },
      {
        text: '**The HTLC output has exactly two exits**: reveal the preimage and claim immediately, or wait for the timeout and refund. There is no third branch.',
        cite: '03-transactions.md:214',
      },
      {
        text: '**Deadlines descend along the route**, which is what keeps every hop safe and what makes stuck payments lock funds for a while.',
      },
    ],
    closing:
      "**Keep verifying.** The hub moved 180,000 sats between two people it cannot identify and never had the option of keeping a satoshi. That is one hash, used well. Which leaves the last question of this track: the hub had to know where to send the payment next, so how does it not learn who it came from, or where it finally went?",
  },
  feynman: {
    prompt: 'Explain to a friend how a Lightning payment can pass through a stranger without them being able to steal it.',
    model:
      "The person being paid invents a secret and publishes only its hash, and every hop along the route promises money on the same condition: whoever shows the secret can claim it, and if nobody does by a deadline, the promise expires and the money goes home. So the stranger in the middle is never given anything spendable, only a promise it cannot open. When the recipient claims their money they necessarily reveal the secret to the person who paid them, which unlocks that person's own incoming promise too, so the payment settles backwards along the chain and either every hop is paid or none of them are.",
  },
};
