import type { Quest } from './types.js';
import { BOLTS_PIN } from './excerpts.js';

/**
 * Lightning Quest #7: the practical capstone. Five quests of mechanism
 * are worth nothing to a reader whose wallet holds none of the keys, so
 * this one is about the choices that decide whether any of it applies to
 * them and the honest costs nobody mentions in the marketing.
 */
export const questLn07: Quest = {
  id: 'quest-ln-07',
  site: 'lightning',
  slug: 'whose-lightning',
  number: 7,
  kicker: "Don't trust. Verify.",
  track: 'The big questions',
  title: 'Whose Lightning are you using?',
  summary:
    'Lightning channel protections depend on who controls signing and recovery. Learn how to investigate custody, directional liquidity and the ways a channel closes, without treating wallet screens as proof.',
  duration: '12 min',
  pin: BOLTS_PIN,
  story: {
    stage: 'the reckoning',
    text: "Mira's cart has been running on Lightning for a year. She has never opened a channel, never seen a commitment transaction, never held a revocation secret, her payments arrive through an app she downloaded, run by a company in another country. Every protocol guarantee in this curriculum is real, and not one of them currently applies to her. This is the quest that would have told her.",
  },
  intro: [
    "Five quests of mechanism, and every one of them rests on a quiet assumption: **that you are a party to the channel**. The 2-of-2 lock protects you because one of the two keys is yours. The penalty branch protects you because you hold the revocation secret. The onion protects you because you built it.",
    "Take the key away and every one of those sentences becomes false, not weaker, false. This is the quest that asks who is actually holding it, what it costs to hold it yourself, and what happens when things go wrong. It is the least cryptographic quest here and probably the most useful.",
  ],
  promise:
    "Every snippet below is copied verbatim from the Lightning specifications at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8). Where this quest describes wallet behaviour rather than protocol, it says so: that part is a map of the landscape, not a claim from a specification, and it is the part most likely to age.",
  stops: [
    {
      id: 'the-question',
      title: 'The question that decides everything else',
      takeaway:
        "There is exactly one question to ask of a Lightning wallet: **if this company disappeared tonight, could I still get my money?** If the answer is no, you do not have a Lightning channel. You have an account, and everything this site taught you is describing somebody else's protection.",
      myth: {
        belief: 'I use Lightning, so I am using a trustless payment protocol.',
        reality:
          "You may be. You may also be using a company's database that settles over Lightning somewhere behind the scenes, which is a completely different arrangement with completely different risks, closer to a payment app than to Bitcoin. Both are called 'a Lightning wallet' in the app store. The protocol cannot tell you which you have; only the answer to the question above can.",
      },
      contrastLabels: { left: 'Custodial', right: 'Self-custodial' },
      contrast: [
        { aspect: 'Who holds the key', bank: 'The company', bitcoin: 'You' },
        { aspect: 'If they vanish', bank: 'You are a creditor, and you queue', bitcoin: 'You force close and take your money' },
        { aspect: 'Who sees your payments', bank: 'They see all of them, in the clear', bitcoin: 'Peers see local payment data; correlation and collusion can reveal more' },
        { aspect: 'Who can freeze you', bank: 'They can, and may be required to', bitcoin: 'No custodian is required, but peers can refuse routing and liquidity can be unavailable' },
        { aspect: 'What it costs you', bank: 'Nothing. That is the appeal', bitcoin: 'On-chain fees, and attention' },
      ],
      prose: [
        'Custodial services can simplify setup, receiving and availability, but their fees, speed, restrictions and reliability vary. The provider controls the keys and the user depends on its solvency and policies. Convenience does not establish protocol-level control.',
        'A recovery phrase, account or channel screen is only a clue. Some phrases back up only on-chain funds, and some noncustodial designs use other recovery mechanisms or optional accounts. Check the documented signing and recovery architecture, required backups and provider-disappearance path.',
        'The following channel discussion assumes you control the required signing keys and recovery data and can operate without the provider. Custody and recovery depend on the actual design, not merely the name of the app.',
      ],
    },
    {
      id: 'three-ways',
      title: 'The good, the bad and the ugly',
      takeaway:
        "The specification names the three ways a channel can end, in its own words, with its own labels and then makes the claim that matters: **there is no risk of loss of funds in any of the three cases**, provided the situation is properly handled. Read that proviso carefully.",
      annotationsOpen: true,
      quiz: [
        {
          question: 'Your channel partner goes offline permanently and never comes back. Which case is that, and what happens to your money?',
          options: [
            'The ugly way: you have been cheated and need the penalty transaction',
            'The bad way, you force close with your latest balance, wait out the delay, and get everything back',
            'Your money is stuck until they return',
          ],
          answer: 1,
          explain:
            "A peer vanishing is the *bad* way, not the ugly way: nothing dishonest has happened, they just stopped answering. You publish your own latest commitment, wait out `to_self_delay`, and take your balance. It costs an on-chain fee and some patience. This is the failure mode people fear most and it is the least dangerous of the three.",
        },
      ],
      prose: [
        "Three endings, and the spec's names for them are worth memorising because they map exactly onto how worried you should be.",
        "**The good way, mutual close.** Both sides agree, sign one tidy closing transaction, and the money is spendable immediately with no delay. This is what happens when you tap 'close channel' and your peer is online and cooperative. Cheapest and fastest.",
        "**The bad way, unilateral close.** Something broke. Your peer crashed, went offline, or simply stopped talking. You publish your own latest commitment. Nothing is lost, but *your* funds sit behind `to_self_delay`, hundreds of blocks, while your peer's side is spendable immediately. That asymmetry is deliberate: it is the window in which you could have been proven a cheat.",
        "**The ugly way, a revoked close.** Someone published an old state deliberately. This is Quest #2's territory, and it is the case where the penalty makes the attempt self-defeating.",
        "Now the proviso on lines 24–25, which is the honest part: *provided that the situation is properly handled.* No loss of funds is a conditional promise. Something has to be watching the chain during the delay window. If your node is your phone and your phone has been in a drawer for a fortnight, the 'properly handled' clause is doing a lot of work, which is what [[Watchtower]]s exist for.",
      ],
      annotations: [
        { lines: 'L13–16', text: 'The good way. Both agree, one clean transaction, funds spendable immediately.' },
        { lines: 'L17–19', text: 'The bad way, and note "possibly without evil intent", a crash counts. This is the common one.' },
        { lines: 'L20–22', text: 'The ugly way: a deliberate cheat, which Quest #2 showed forfeits everything.' },
        { lines: 'L24–25', text: 'The claim, and its condition. "Properly handled" is where watchtowers and uptime live.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '05-onchain.md', startLine: 11, endLine: 25 },
        language: 'text',
        lines: [
          { n: 11, text: 'There are three ways a channel can end:' },
          { n: 12, text: '' },
          { n: 13, text: '1. The good way (*mutual close*): at some point the local and remote nodes agree', highlight: true },
          { n: 14, text: 'to close the channel. They generate a *closing transaction* (which is similar to a' },
          { n: 15, text: 'commitment transaction, but without any pending payments) and publish it on the' },
          { n: 16, text: 'blockchain (see [BOLT #2: Channel Close](02-peer-protocol.md#channel-close)).' },
          { n: 17, text: '2. The bad way (*unilateral close*): something goes wrong, possibly without evil', highlight: true },
          { n: 18, text: 'intent on either side. Perhaps one party crashed, for instance. One side' },
          { n: 19, text: 'publishes its *latest commitment transaction*.' },
          { n: 20, text: '3. The ugly way (*revoked transaction close*): one of the parties deliberately', highlight: true },
          { n: 21, text: 'tries to cheat, by publishing an *outdated commitment transaction* (presumably,' },
          { n: 22, text: 'a prior version, which is more in its favor).' },
          { n: 23, text: '' },
          { n: 24, text: 'Because Lightning is designed to be trustless, there is no risk of loss of funds', highlight: true },
          { n: 25, text: 'in any of these three cases; provided that the situation is properly handled.', highlight: true },
        ],
      },
    },
    {
      id: 'the-liquidity',
      title: 'Why you cannot receive, and cannot spend it all',
      takeaway:
        'Outbound and inbound liquidity depend on the channel split. A single-funded channel can begin with zero remote balance, so it initially has no inbound liquidity from that peer. Reserves, commitment fees, pending HTLCs and peer availability further constrain what can actually be sent.',
      viz: 'liquidity-seesaw',
      quiz: [
        {
          question: 'You open a channel with 500,000 sats of your own money. How much can someone pay you through it right now?',
          options: [
            '500,000 sats',
            'Nothing, all the money is on your side, so there is no room on theirs',
            'Half of it',
          ],
          answer: 1,
          explain:
            "This is the single most common surprise in Lightning. Capacity is not the same as inbound capacity: the 500,000 sats are yours to *send*, and until you spend some, or someone opens a channel towards you, or you buy inbound liquidity from a provider, nobody can pay you a satoshi through it. Wallets that hide this well are doing real work on your behalf.",
        },
      ],
      prose: [
        "Picture the channel as a seesaw with a fixed total. Paying moves coins from your end to theirs; being paid moves them back. What you can send is your end; what you can receive is theirs. Nothing creates or destroys the total, which is why a freshly funded channel is all send and no receive.",
        'A peer advertises a reserve the other party must retain as its direct balance. Initial balances may be zero or below reserve; protocol rules constrain further reductions rather than guaranteeing both parties always begin above it. Reserves can differ. Available liquidity also accounts for commitment fees and in-flight HTLCs. Capacity and advertised HTLC maximum are not live spendable balances.',
        "The practical effect is that a channel's usable balance is a little smaller than its size, in both directions, permanently. A wallet showing you 500,000 sats of capacity is not lying, but you will never move all 500,000 through it.",
        "None of this is a defect. It is what it costs to have a payment network with no central balance sheet: liquidity has to be somewhere, somebody has to have committed it, and it can only ever be in one place at a time.",
      ],
      annotations: [
        { lines: 'L734–35', text: 'The reserve: a slice each side must leave the other, always.' },
        { lines: 'L735–36', text: 'Why it exists: a party with nothing left to lose has nothing to deter them.' },
        { lines: 'L736–37', text: 'And a floor on HTLC size, because tiny outputs are not economically enforceable on-chain.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '02-peer-protocol.md', startLine: 734, endLine: 737 },
        language: 'text',
        lines: [
          { n: 734, text: 'will not propagate through the Bitcoin network. `channel_reserve_satoshis`', highlight: true },
          { n: 735, text: 'is the minimum amount that the other node is to keep as a direct', highlight: true },
          { n: 736, text: 'payment. `htlc_minimum_msat` indicates the smallest value HTLC this', highlight: true },
          { n: 737, text: 'node will accept.' },
        ],
      },
    },
    {
      id: 'the-scorecard',
      title: 'An honest scorecard',
      takeaway:
        'Lightning can settle payments off-chain without a custodial intermediary. Cost, latency, availability and safe recovery depend on routing, liquidity, channel state, monitoring and on-chain conditions.',
      prose: [
        'Successful off-chain fulfillment can be fast and avoids recording each payment separately on-chain. Routing fees, failed attempts and recovery costs vary. The scripts enforce spending conditions, but do not guarantee instantaneous delivery, privacy or lossless recovery for an offline participant.',
        "**What it costs.** Funding, closing and recovery require on-chain fees. Receiving needs inbound liquidity; failed payments can reserve funds temporarily. Unilateral-close output delays depend on the output and negotiated parameters, and maturity does not itself broadcast or confirm a sweep.",
        "**Privacy boundaries.** A forwarding node sees adjacent peers, local amounts and timing; the first hop sees its direct peer, not necessarily the ultimate payer’s real-world identity. Colluding nodes can correlate shared payment hashes and metadata. A custodian’s visibility depends on architecture. Onion routing alone does not provide anonymity or hide every payment relationship.",
        "**What to actually do about it**, if you want the guarantees rather than the branding: keep small amounts in a convenient wallet and don't pretend it is self-custody; hold larger amounts on the base layer where the security model is simpler; and if you run channels, run more than one, to more than one peer, and let something watch the chain while you sleep.",
        "That is the whole honest picture. It is a good technology with real trade-offs, which is the most any technology can be.",
      ],
    },
  ],
  finale: {
    title: 'Work out what you are actually using',
    takeaway:
      "Answer four questions about your own wallet and get a straight assessment: what you control, who can see your payments, what happens if the provider disappears, and which parts of this curriculum currently apply to you.",
    runnerId: 'custody-check',
    note: 'This is a clue-gathering exercise, not a custody audit. Recovery phrases, accounts and channel screens cannot certify independent signing or recovery. Verify the documented architecture, what balance a backup covers and the provider-disappearance procedure. Never submit keys or real phrases.',
  },
  recap: {
    tryIt:
      'Read the wallet’s custody and recovery documentation. Identify who can sign, what the backup covers, whether current channel state is recoverable and how withdrawal works if the provider disappears. Screens and phrases alone do not answer those questions.',
    items: [
      {
        text: "**One question decides the rest**: if the provider vanished tonight, could you still get your money? Everything in this curriculum assumes the answer is yes.",
      },
      {
        text: '**The specification names three endings**, mutual, unilateral and revoked and promises no loss of funds in any of them, *provided the situation is properly handled*.',
        cite: '05-onchain.md:24',
      },
      {
        text: "**Liquidity is directional and reserved.** Funding allocation, previous payments, pending HTLCs, fees and reserves constrain sending and receiving. A side may initially be below its reserve; payment updates must respect the applicable BOLT constraints.",
        cite: '02-peer-protocol.md:734',
      },
      {
        text: '**The honest scorecard:** fast off-chain settlement is possible, with variable fees, liquidity and uptime constraints, recovery duties and limited privacy. Wallet custody must be investigated separately.',
      },
    ],
    closing:
      "**Keep verifying.** You have explored channels, breach remedies, invoices, HTLCs, routing and onion privacy with source excerpts and selected vectors. These exercises explain mechanisms and limits; they do not certify a wallet, guarantee anonymity or make cheating impossible. Recovery and monitoring remain essential.",
  },
  feynman: {
    prompt: "Explain to a friend how to tell whether their Lightning wallet is actually protecting them, and what it costs to do it properly.",
    model:
      'Ask who can sign and recover the Lightning balance if the provider disappears. A phrase or channel screen is not proof. Self-managed channels require usable backups, monitoring, directional liquidity and fees for on-chain recovery; custodial balances instead depend on a provider. No short quiz can certify those properties.',
  },
};
