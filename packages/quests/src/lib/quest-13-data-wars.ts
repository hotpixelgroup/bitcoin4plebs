import type { Quest } from './types.js';
import { BIPS_PIN, BITCOIN_PIN, EXCERPT_DATACARRIER_DEFAULTS } from './excerpts.js';

/**
 * Quest #13: The data wars. The live, unresolved fight over what a
 * shared ledger is for, told from primary sources: the relay filter in
 * Core, the v30 default that opened it, and the BIP-110 text that would
 * close the question at the consensus level. Both camps steelmanned;
 * no verdict issued. This quest quotes TWO pinned repos: bitcoin/bitcoin
 * and bitcoin/bips, each verbatim-checked in CI.
 */
export const quest13: Quest = {
  id: 'quest-13',
  slug: 'the-data-wars',
  number: 13,
  kicker: 'Zoom out.',
  track: 'Zoom out',
  title: 'The data wars: what is the ledger for?',
  summary:
    "Bitcoin's loudest live fight, from primary sources: the OP_RETURN valve, the inscription flood, Core v30 vs Knots, and BIP-110's plan to settle it in consensus. You pick a side, or don't.",
  duration: '12 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'what lists are for',
    text: "Someone starts paying real fees to draw doodles on the neighborhood's money list. Half the town wants them scrubbed; half says a list with a doodle police isn't the list they signed up for. Ana notices nobody asks the mayor, because there isn't one: the argument will be settled by what people run.",
  },
  intro: [
    "Everything you've verified so far is settled: the cap, the halvings, the signatures. This quest is different. It's about the one fight happening **right now**, in the code you can read and the nodes you can run: when people pay real fees to store *pictures and tokens* on the money ledger, is that the market working, or the money breaking?",
    "You already have every tool this fight is fought with: the fee auction (Quest #12), relay policy vs consensus (Quest #12, stop 5), soft forks and activation scars (Quest #4). What follows is the story told from **primary sources only**, including, for the first time on this site, verbatim excerpts from a second pinned repository: the BIPs themselves. We steelman both camps and issue no verdict. The whole point of thirteen quests was to make you fit to form your own.",
  ],
  promise:
    "Every snippet below is copied verbatim from the pinned sources: Bitcoin Core at commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b) and the BIPs repository at commit [8c369ac](https://github.com/bitcoin/bips/commit/8c369ac8e60629ac6c032ffe21bb5ec5b35213d7). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'the-valve',
      title: 'OP_RETURN: a valve, not an invitation',
      takeaway:
        "Data on the ledger is as old as the ledger: Satoshi put a newspaper headline in block zero. OP_RETURN exists because people were **faking addresses** to store data, which bloats the database every node keeps forever. The valve made data *less* harmful, not welcome.",
      quiz: [
        {
          question: 'Why did Bitcoin developers add the OP_RETURN data slot in 2014?',
          options: [
            'To invite apps to store files on the chain',
            'To steer unstoppable data-stuffing into a form nodes can prune',
            'To let miners charge more for data',
          ],
          answer: 1,
          explain:
            'People were already embedding data by paying to fake addresses, creating outputs that look spendable and so live in every node\'s UTXO database forever. An OP_RETURN output is provably unspendable: nodes can forget it immediately. The valve was harm reduction for something the fee auction made impossible to ban.',
        },
      ],
      prose: [
        'Quest #8 showed you the original sin, committed by Satoshi personally: *"The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"*, hard-coded into block zero. People have stuffed messages into the ledger ever since, and the earliest method was ugly: encode your data as a **fake address** and pay to it. Nobody can ever spend that output, but no node can *prove* nobody can, so it squats in the UTXO set, the database from Quest #3 that every node must keep hot, forever.',
        "In 2014, Bitcoin Core 0.9 added a pressure valve: **OP_RETURN**, an output type that says out loud \"this carries data and can never be spent.\" Nodes can prune it on sight. The relay default allowed 40 bytes of payload, later 80 (an 83-byte script with overhead), deliberately enough for a hash or a timestamp and nothing more. The code enforcing your node's limit is this stop's excerpt: count the data bytes, compare to your budget, refuse to *relay* anything over it. Note the word relay. Keep noting it.",
      ],
      annotations: [
        { lines: 'L137', text: 'Your budget: the -datacarriersize setting you (or your software\'s defaults) chose.' },
        { lines: 'L145', text: 'NULL_DATA is the OP_RETURN output type: declared data, provably unspendable, prunable.' },
        { lines: 'L147–49', text: 'Over budget? Your node refuses to pass it along, with the reason string "datacarrier".' },
        { lines: 'L152–55', text: 'The older trick, bare multisig stuffing, has its own off-by-default gate.' },
      ],
      excerpt: {
        ref: { file: 'src/policy/policy.cpp', startLine: 137, endLine: 156 },
        language: 'cpp',
        lines: [
          { n: 137, text: '    unsigned int datacarrier_bytes_left = max_datacarrier_bytes.value_or(0);', highlight: true },
          { n: 138, text: '    TxoutType whichType;' },
          { n: 139, text: '    for (const CTxOut& txout : tx.vout) {' },
          { n: 140, text: '        if (!::IsStandard(txout.scriptPubKey, whichType)) {' },
          { n: 141, text: '            reason = "scriptpubkey";' },
          { n: 142, text: '            return false;' },
          { n: 143, text: '        }' },
          { n: 144, text: '' },
          { n: 145, text: '        if (whichType == TxoutType::NULL_DATA) {' },
          { n: 146, text: '            unsigned int size = txout.scriptPubKey.size();' },
          { n: 147, text: '            if (size > datacarrier_bytes_left) {', highlight: true },
          { n: 148, text: '                reason = "datacarrier";', highlight: true },
          { n: 149, text: '                return false;' },
          { n: 150, text: '            }' },
          { n: 151, text: '            datacarrier_bytes_left -= size;' },
          { n: 152, text: '        } else if ((whichType == TxoutType::MULTISIG) && (!permit_bare_multisig)) {' },
          { n: 153, text: '            reason = "bare-multisig";' },
          { n: 154, text: '            return false;' },
          { n: 155, text: '        }' },
          { n: 156, text: '    }' },
        ],
      },
    },
    {
      id: 'the-flood',
      title: '2023: the ledger becomes a bulletin board',
      takeaway:
        'Inscriptions found a bigger door than OP_RETURN: **witness space**, which SegWit prices at a 75% discount. Fees spiked into the hundreds of sats per vbyte, and the fee auction did exactly what Quest #12 said it would: it stayed neutral.',
      myth: {
        belief: '"Spam" transactions are invalid, and nodes that relay them are broken.',
        reality:
          'Every inscription that confirmed followed every consensus rule and paid the auction price; that is the *definition* of valid. "Spam" is a value judgment about intent, and the protocol has no field for intent. Whether it *should* is precisely the fight this quest is about.',
      },
      prose: [
        "In early 2023, the Ordinals protocol showed how to park entire images inside **taproot witness data**: the part of a transaction that carries signatures, which SegWit (Quest #4's activation story) deliberately prices at a quarter of the cost of normal bytes. Suddenly the 80-byte valve was irrelevant; whole JPEGs rode through the signature door. Then BRC-20 tokens turned each inscription into a tradable collectible, and twice in 2023, and again on the 2024 halving day with Runes, data demand outbid payment demand across the whole queue, hundreds of sats per vbyte.",
        'Zoom-out lens, from Quest #12: nothing malfunctioned. The auction sold blockspace to the highest bidders; the fee floor ratcheted and decayed on schedule; patient payments waited and confirmed. And yet plebs trying to *pay* with bitcoin experienced days when a coffee\'s fee cost more than the coffee. Both sentences are true at once. Hold them both; every honest position in this fight starts from that tension.',
        'One more honest asymmetry: OP_RETURN data can be pruned, but some data schemes (fake addresses, bare-multisig stamps) inflate the **UTXO set**, a cost paid by every future node runner, forever, not just by the bidders of that week. This is the strongest technical version of the "distorted incentives" claim: the auction prices *this block*, but not the eternal storage some bytes impose on others.',
      ],
    },
    {
      id: 'the-split',
      title: '2025: Core opens the valve, Knots slams it',
      takeaway:
        'Bitcoin Core v30 raised the default OP_RETURN allowance from 83 bytes to **100,000 vbytes**, arguing filters had failed and prunable data beats UTXO poison. A visible slice of node operators disagreed and switched to **Bitcoin Knots**, which filters hard. Both run the same consensus.',
      myth: {
        belief: 'The Bitcoin Core developers decide what Bitcoin is.',
        reality:
          'Core ships defaults, and defaults are powerful, but every knob here is policy, and the 2025 exodus to Knots is the market for implementations working in the open. What no implementation can do is change consensus by shipping a release: a Knots node and a Core v30 node follow the identical chain today.',
      },
      prose: [
        "Look at line 84 again, knowing what you now know. `MAX_STANDARD_TX_WEIGHT / WITNESS_SCALE_FACTOR` is 400,000 ÷ 4 = **100,000 vbytes**: the v30 (October 2025) default lets an OP_RETURN fill an entire standard transaction. The maintainers' argument was pragmatic harm reduction: the 83-byte filter had visibly failed (the data came in anyway, through the witness door), determined publishers were paying miners *directly* and bypassing filtering nodes entirely, and if data is coming regardless, prunable OP_RETURN is the least toxic place for it. Better a bulletin board you can throw away than graffiti carved into the UTXO set.",
        "A loud minority of operators found that surrender dressed as pragmatism. Many switched to **Bitcoin Knots**, a long-running Bitcoin Core derivative maintained by Luke Dashjr that keeps strict data filters on by default and adds more. Through 2025 its share of reachable nodes grew from a rounding error to a visible slice of the network, node operators voting with their software, exactly the implementation market Quest #12 described. What they did *not* get is a different Bitcoin: policy filters what a node repeats, not what the chain contains. [Core vs. Knots, side by side →](/core-vs-knots)",
        'So by late 2025 the board state was: data flowing, filters leaking by design, defaults opened, a counter-movement running stricter software that consensus renders mostly symbolic. Which left exactly one escalation on the table.',
      ],
      excerpt: EXCERPT_DATACARRIER_DEFAULTS,
    },
    {
      id: 'bip-110',
      title: 'BIP-110: moving the fight into consensus',
      takeaway:
        'Assigned in December 2025, BIP-110 proposes a **temporary, one-year soft fork** that makes oversized data fields *invalid in blocks*, not just unrelayed. That one word, invalid, is the entire escalation: policy asks, consensus binds.',
      quiz: [
        {
          question: 'Under BIP-110, what happens to coins and inscriptions that existed before activation?',
          options: [
            'They are frozen for the one-year deployment',
            'They are deleted from the ledger',
            'Nothing: pre-activation UTXOs are exempt from all the new rules',
          ],
          answer: 2,
          explain:
            'The grandfathering clause (line 35 of the BIP) exempts every UTXO created before activation, so nothing anyone owns becomes unspendable, and after the year expires all restrictions lift. The design is a circuit breaker, not a purge. Whether even a temporary breaker belongs in consensus is the real argument.',
        },
      ],
      prose: [
        "Read the rules yourself; this excerpt is quoted verbatim from the BIPs repository at our second pin, and the verify link goes to the BIP text, not to Core. The shape: for one year, blocks containing oversized output scripts, oversized data pushes, and several taproot data tricks (the annex, giant control blocks, `OP_SUCCESS` placeholders, even tapscripts that *execute* `OP_IF`) are *invalid*. Not unfashionable. Invalid, the same word that stops a 22-million-coin supply.",
        '**The steelman for it:** the auction prices this block but not the forever-costs some bytes impose on every future node; collectible manias monetize attention, so they can outbid money indefinitely rather than fading; policy filters demonstrably leak; and this design is deliberately humble, temporary, narrow, and grandfathered, a circuit breaker to cool a market failure while the ecosystem builds better answers. Bitcoin exists to be money; a rule that defends money-ness is the *most* conservative move available.',
        "**The steelman against it:** Quest #0's founding principle is that a rule only counts if checking it needs no referee, and \"this data is legitimate, that data is not\" is referee work smuggled into arithmetic; consensus has never before adjudicated *content*, and one-year emergencies have a way of renewing; the collateral is real, since tapscripts that execute `OP_IF` include the either/or contracts several second-layer designs are built from; and the precedent cuts forever: the tool that bans their bytes today can ban your bytes when fashions change. The auction being annoying is the price of the auction being neutral.",
      ],
      annotations: [
        { lines: 'L23', text: 'Temporary and time-boxed: the rules expire after one year. Also: "checked". This is consensus, run by every node.' },
        { lines: 'L25', text: 'Output scripts capped near the old normal; OP_RETURN kept at its classic 83 bytes.' },
        { lines: 'L26', text: 'The witness door from 2023 gets a 256-byte frame.' },
        { lines: 'L30–31', text: 'The sharp edge: banning OP_SUCCESS and executed OP_IF in tapscripts also touches how future contracts and some second-layer designs are written.' },
        { lines: 'L35', text: 'The mercy clause: everything from before activation is exempt. No coin freezes.' },
      ],
      excerpt: {
        pin: BIPS_PIN,
        ref: { file: 'bip-0110.mediawiki', startLine: 23, endLine: 35 },
        language: 'text',
        lines: [
          { n: 23, text: 'Blocks during a temporary, one-year deployment are checked with these additional rules:', highlight: true },
          { n: 24, text: '' },
          { n: 25, text: '# New output scriptPubKeys exceeding 34 bytes are invalid, unless the first opcode is OP_RETURN, in which case up to 83 bytes are valid.', highlight: true },
          { n: 26, text: '# OP_PUSHDATA* payloads and [[#script-argument-witness-items|script argument witness items]] exceeding 256 bytes are invalid, except for the redeemScript push in BIP16 scriptSigs.' },
          { n: 27, text: '# Spending undefined witness (or Tapleaf) versions (ie, not Witness v0/BIP 141, Taproot/BIP 341, or P2A) is invalid. (Creating outputs with undefined witness versions is still valid.)' },
          { n: 28, text: '# Witness stacks with a Taproot annex are invalid.' },
          { n: 29, text: '# Taproot control blocks larger than 257 bytes (a merkle tree with 128 script leaves) are invalid.' },
          { n: 30, text: '# Tapscripts including OP_SUCCESS* opcodes anywhere (even unexecuted) are invalid.' },
          { n: 31, text: '# Tapscripts executing the OP_IF or OP_NOTIF instruction (regardless of result) are invalid.' },
          { n: 32, text: '' },
          { n: 33, text: '===UTXO grandfathering===' },
          { n: 34, text: '' },
          { n: 35, text: "'''Inputs spending UTXOs that were created before the activation height are exempt from all of the new rules.'''", highlight: true },
        ],
      },
    },
    {
      id: 'who-decides',
      title: 'How this actually gets decided',
      takeaway:
        'The same way everything here gets decided: **by what people run**. A soft fork with overwhelming economic consensus activates; one without it either dies quietly or splits the chain, and you watched 2017 settle which side of a split survives.',
      quiz: [
        {
          question: 'Who has the final say on whether BIP-110 becomes a rule of Bitcoin?',
          options: [
            'The BIP editors who assigned it a number',
            'A majority of miners, by signaling',
            'The economic nodes that choose to enforce it, or not',
          ],
          answer: 2,
          explain:
            'A BIP number is a filing cabinet label, not a law, and Quest #12 showed miner signaling losing to economic nodes in 2017. Activation is adoption: if the people who accept bitcoin as payment enforce the rule, it is a rule. If they do not, it is a document.',
        },
      ],
      prose: [
        "A BIP is a proposal, not a law: \"Status: Complete\" in its header means the specification is finished, not that Bitcoin adopted it. To become a rule it needs what every rule change since the scars of Quest #4 has needed: an activation mechanism, and then the only vote that counts, **enforcement by the economic majority**. Nodes that check the new rule, exchanges and merchants that stand behind it, and enough of the economy that mining against it means mining a coin nobody buys.",
        'Notice what the machine has already done with this fight, with nobody chairing it: the fee auction priced the flood, the policy layer let dissenters filter in protest, the implementation market gave the protest teeth and a name, and the consensus layer is where the remaining question now waits, wrapped in a deliberately temporary proposal, for the economy to accept or ignore it. Thirteen quests ago you had to trust someone\'s summary of a fight like this. Now you can read the filter, the default, and the proposal in their own words, and decide what *you* will run.',
      ],
    },
  ],
  finale: {
    title: 'Set your own relay policy',
    takeaway:
      "Be the node operator. Pick your datacarrier policy, watch which of four real-shaped transactions your node would relay, then watch a block arrive and learn the lesson every filter operator learns: your policy shapes your mempool, consensus shapes your chain.",
    runnerId: 'policy-picker',
    note: 'The relay check mirrors IsStandardTx (policy.cpp:137–156): compare each OP_RETURN script\'s size to your -datacarriersize budget. Consensus validity of the arriving block is independent of your policy, which is the entire point.',
  },
  recap: {
    items: [
      {
        text: '**OP_RETURN was harm reduction**: prunable declared data instead of fake addresses that poison the UTXO set forever.',
        cite: 'policy.cpp:145',
      },
      {
        text: '**The 2023 flood came through the witness door** at a 75% byte discount, making the 83-byte valve irrelevant and the fee auction the only gate left.',
      },
      {
        text: '**Core v30 opened the default to 100,000 vbytes; Knots kept filtering.** Same consensus, different taste, and operators chose sides with their software.',
        cite: 'policy.h:84',
      },
      {
        text: '**BIP-110 would escalate taste into law**: one year, grandfathered, narrow, and consensus-binding, which is exactly why it is either a circuit breaker or a precedent, depending on who you ask.',
        cite: 'bip-0110.mediawiki:23',
      },
    ],
    closing:
      "**Keep verifying:** the excerpts above link to two pinned repositories now, Core and the BIPs, and the promise is the same for both: not one edited word. You've now read Bitcoin's live constitutional argument from primary sources, which is more than most people shouting about it can say.",
  },
  feynman: {
    prompt: 'Explain the data-wars disagreement fairly, in three sentences, so that neither camp could accuse you of strawmanning them.',
    model:
      'Everyone agrees the data is consensus-valid and paid for; the fight is whether a neutral auction that lets collectibles outbid payments, and lets some bytes impose storage costs on every future node, is the system working or a distorted incentive worth correcting. One camp says filters leak and only a temporary, grandfathered consensus rule can defend the ledger\'s purpose as money; the other says consensus judging content breaks the no-referee principle that makes Bitcoin worth defending at all. Both camps are optimizing for Bitcoin surviving; they disagree about which is the load-bearing wall.',
  },
};
