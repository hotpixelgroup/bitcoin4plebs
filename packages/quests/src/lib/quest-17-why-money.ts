import type { Quest } from './types.js';
import { BITCOIN_PIN, EXCERPT_COIN_DEFINITION, EXCERPT_MAX_MONEY } from './excerpts.js';

/**
 * Quest #17: Why is this money? The keystone question the whole site
 * gestures at but never lands: a reader can verify the cap and the
 * signatures and still not answer "why is it worth anything?" This quest
 * answers it with the properties of money and the double-spend problem,
 * strictly as education, never as a reason to buy. Appended (not
 * inserted) so no existing quest number shifts.
 */
export const quest17: Quest = {
  id: 'quest-17',
  slug: 'why-is-this-money',
  number: 17,
  kicker: 'The big question.',
  track: 'The big questions',
  title: 'Why is this money at all?',
  summary:
    "The question every quest earned and none answered: why is a number on a list worth anything? Not faith, not hype: the properties of good money, and the one problem no digital cash could solve until Bitcoin.",
  duration: '10 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'worth wanting',
    text: "Seventeen chapters ago Bo took Ana's 0.6 BTC for his bike. Why? Not because a government promised it, and not because it glitters. He took it because he could check everything about it himself: that it was real, that it was scarce, that it was now his and only his. This chapter is why that was enough.",
  },
  intro: [
    "You have verified the cap, the signatures, the mining, the whole machine. And a skeptic can still stop you cold with five words: **why is it worth anything?** It is a fair question, and 'because it's scarce' is only half an answer. Scarce dirt is worthless.",
    "This quest answers the question properly, and it stays scrupulously on one side of a line: it explains why Bitcoin *functions as money*, not whether you should own any. That's not our department. What is our department: money is a **technology**, judged like any tool by how well it does its job, and this is the job.",
  ],
  promise:
    "Two of the snippets below are copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). The rest is reasoning you can check against your own life. Don't trust this page either.",
  stops: [
    {
      id: 'nothing-is-backed',
      title: "What does “backed by” mean?",
      takeaway:
        "“Backed by” can mean a redeemable claim on an asset or issuer, or it can refer more loosely to confidence and acceptance. Bitcoin has no issuer promising redemption. Its usefulness and market acceptance are separate questions from such a promise.",
      myth: {
        belief: 'Real money is backed by gold or by the government. Bitcoin is backed by nothing, so it is fake.',
        reality:
          "Some monetary instruments are redeemable claims; others are not. Bitcoin does not promise redemption for gold or an issuer’s assets. That distinction alone does not settle its usefulness, risks or future purchasing power.",
      },
      prose: [
        "A currency’s acceptance depends on institutions, laws, obligations, network effects and expectations. Commodity money also has uses and market demand. These explanations should not be reduced to one universal backing rule.",
        "Absence of a redemption promise is a feature to understand, not proof of either worthlessness or guaranteed value. Compare what the instrument lets you do, the risks you bear and the conditions under which others accept it.",
      ],
    },
    {
      id: 'the-scorecard',
      title: 'What makes money good, scored honestly',
      takeaway:
        "Scarcity, durability, portability, divisibility, fungibility and verifiability are useful comparison dimensions. Their importance varies with the user and situation; no single score proves what will become money.",
      prose: [
        "Monetary history includes commodity use, credit, institutions, law and coordination. This scorecard is an explanatory lens, not a law of nature or a complete causal history.",
        "Tap through the figure and be honest with each cell, because the point is not that Bitcoin wins everything. It doesn't: on **fungibility** it scores *worse* than cash, because its ledger is public (that was Quest #15's whole lesson) and coins can carry a visible history. Where Bitcoin is unprecedented is the last row, **verifiability**: for the first time, ordinary people can check the entire supply and every rule themselves, which is the thing you have literally been doing for sixteen quests.",
      ],
      viz: 'money-scorecard',
      myth: {
        belief: "Gold is the perfect money, so a digital version is pointless.",
        reality:
          "Gold scores brilliantly on scarcity and durability and terribly on portability, divisibility, and verifiability: you cannot email it, cannot pay exact change in it, and cannot check a bar is real without an assay. Every property gold is weak on is one Bitcoin was designed to be strong on. They are not rivals so much as gold's strengths, minus its weaknesses, in software.",
      },
    },
    {
      id: 'the-double-spend',
      title: 'The problem that made digital money impossible',
      takeaway:
        "A digital coin is a file, and files copy perfectly. So 'digital cash' always meant a bank stopping you from spending the same coin twice. Bitcoin is the **first system to stop double-spending with no bank**, and that, not the price, is the invention.",
      prose: [
        "Here is the wall every attempt hit for thirty years. Cash can't be double-spent because handing you a coin means I no longer hold it. But a digital coin is just data, and I can copy data endlessly, so I could 'pay' ten people with the same file. The only fix anyone found was a trusted middleman keeping the master list and refusing the second spend. Digital money meant a bank, by definition.",
        "Now recognize what you built across this whole site. A shared ledger every node keeps (Quest #0), rules anyone can check without a referee (Quest #3's signature, Quest #1's supply), and one agreed history extended by proof-of-work (Quest #6). Stack those and the double-spend problem dissolves: the second spend of a coin contradicts the ledger everyone holds, so every node rejects it, with nobody in charge. That is the entire reason the machinery exists.",
        "This is why 'it's just a number' misses it. So is your bank balance. The difference is that keeping *your* number honest used to require trusting an institution, and now it requires trusting arithmetic you can run yourself. Money that needs no custodian to stay sound is a genuinely new thing in the world, and the finale lets you try to break it.",
      ],
      quiz: [
        {
          question: 'What did Bitcoin actually invent that decades of "digital cash" could not achieve?',
          options: [
            'Making money digital, which had never been done',
            'Stopping the same coin from being spent twice without any trusted middleman',
            'Encrypting payments so nobody can see them',
          ],
          answer: 1,
          explain:
            "Digital money existed for decades (your bank balance is digital). The unsolved problem was double-spending without a trusted party to police the master list. Bitcoin's shared ledger plus refereeless rules solved exactly that, which is the whole breakthrough. (And payments aren't encrypted; the ledger is public, per Quest #15.)",
        },
      ],
    },
    {
      id: 'checkable-scarcity',
      title: 'Scarcity you can check, not scarcity you are promised',
      takeaway:
        "Bitcoin's scarcity is a different kind from gold's or the dollar's: supply is **fixed and self-auditable**. Nobody can print more, and, uniquely, you do not take that on faith. The comment beside `MAX_MONEY` is blunt that the number is consensus-critical.",
      prose: [
        "Return to the scarcity row of the scorecard, because Bitcoin's version is special. Gold is scarce, but you cannot verify the world's gold supply; you trust surveys. Dollars are unscarce by design. Bitcoin is the first money whose *entire supply is checkable by anyone*, and the comment beside its `MAX_MONEY` constant is refreshingly honest: the number is consensus-critical, so change it and you are simply no longer on the same money as everyone else.",
        "This is the payoff of every earlier quest. 'Scarce because a central bank says so' asks you to trust. 'Scarce because these lines run on every node and you have read them' asks you to check. Scarcity you can audit is a genuinely new property in the history of money, and it is the backbone of why anyone treats the thing as sound.",
      ],
      annotations: [
        { lines: 'L19–20', text: 'The developers themselves note the real supply is not even the round 21,000,000; the point is that it is fixed and everyone checks it.' },
        { lines: 'L26', text: 'One constant, consensus-critical. Scarcity you audit, not scarcity you are promised.' },
      ],
      excerpt: EXCERPT_MAX_MONEY,
    },
    {
      id: 'divisible',
      title: "'You can't afford a whole coin' misunderstands the unit",
      takeaway:
        "The most common barrier to entry falls to one line of code. `COIN` is 100,000,000: one bitcoin is a hundred million **satoshis**, and sats are the real unit the code counts in. You transact in fractions, down to a single sat.",
      prose: [
        "Here is the line that dissolves 'Bitcoin is too expensive, I can't afford one.' Deep in the code, `COIN` is defined as 100,000,000. The software does not really count in bitcoin at all; it counts in **satoshis**, and one bitcoin is just a display name for a hundred million of them (you met this in Quest #1).",
        "So 'I can't afford a whole bitcoin' is like saying you can't afford water because you can't buy the ocean. You hold, send, and receive sats, down to a single one, which makes Bitcoin divisible in a way physical cash and especially gold never managed. Divisibility was a whole row on the scorecard, and this one constant is why Bitcoin scores strong on it.",
      ],
      annotations: [
        { lines: 'L14–15', text: 'The real unit: 100,000,000 satoshis to a bitcoin. Whole-coin pricing is a display choice, never a minimum.' },
      ],
      excerpt: EXCERPT_COIN_DEFINITION,
      quiz: [
        {
          question: '"I can\'t afford Bitcoin, one coin is far too expensive." What is the misunderstanding?',
          options: [
            'There is no misunderstanding; you must buy a whole coin',
            'Bitcoin is counted in satoshis (100,000,000 per coin), so you can hold and send any fraction',
            'You have to mine a coin yourself first',
          ],
          answer: 1,
          explain:
            "The unit that matters is the satoshi: one bitcoin is 100 million of them (the COIN constant). You can own, send, or receive a handful of sats. Whole-coin pricing is a display choice, not a minimum, exactly like buying $3 of gasoline without buying a whole barrel.",
        },
      ],
    },
    {
      id: 'why-worth-wanting',
      title: 'So: why is it worth anything?',
      takeaway:
        "Usefulness, acceptance and expectations can support monetary demand. Independent verification is a valuable capability, with software, hardware and network assumptions; it does not establish a price or eliminate every form of trust.",
      contrastLabels: { left: 'Money you trust', right: 'Money you verify' },
      contrast: [
        {
          aspect: 'Why you believe the supply',
          bank: 'A central bank publishes a figure',
          bitcoin: 'You audit every coin yourself (Quest #1, #9)',
        },
        {
          aspect: 'Why you believe it is yours',
          bank: 'The institution says so, and can say otherwise',
          bitcoin: "Spending must satisfy the output’s script: signatures, thresholds and other conditions can apply (Quest #3)",
        },
        {
          aspect: 'What holds the value up',
          bank: 'Law, habit, and the issuer staying honest',
          bitcoin: 'Its properties, plus a network choosing to accept it',
        },
        {
          aspect: 'What you must trust',
          bank: 'People and institutions',
          bitcoin: 'Arithmetic you can run yourself',
        },
      ],
      prose: [
        "Acceptance, usefulness and expectations can support monetary demand, but neither protocol rules nor this scorecard guarantee value. A full node can independently check the chain under chosen rules using software, data, hardware and energy. Verification has costs and assumptions.",
        "Here is the honest boundary this site will not cross. Whether that makes Bitcoin a good thing to *own*, at what price, in what amount, is a question about your life and the future, and anyone who answers it with certainty is selling something. What you can now do, that almost nobody arguing about Bitcoin can, is explain from first principles why it is money in the first place. That was the missing piece, and now you have it.",
      ],
    },
  ],
  finale: {
    title: 'The double-spend duel: try to break it',
    takeaway:
      "You have one coin. Try to spend it to two people at once, the exact trick that made digital cash impossible before 2009, and watch the refereeless network do what no code did before it: reject the second spend, with nobody in charge.",
    runnerId: 'double-spend',
    note: 'A faithful model of the double-spend rule: two payments spending the same coin, the network keeping whichever confirms first and rejecting the other as already-spent. No real coins, no live network; the logic mirrors the input-already-spent check every node runs.',
  },
  recap: {
    tryIt:
      "Ask someone why a $20 bill is worth $20. Most people reach for 'the government' or 'gold' and then falter. You can now give the real answer (properties plus acceptance) for both the dollar and Bitcoin, which is a genuinely rare thing to be able to do.",
    items: [
      {
        text: "**Distinguish redemption from acceptance.** Some money represents redeemable claims; Bitcoin has no issuer promising redemption. Neither fact alone determines value.",
      },
      {
        text: "**Compare monetary tradeoffs.** Scarcity, durability, portability, divisibility, fungibility and verifiability are useful dimensions, not a universal ranking. Public verification and public transaction history create different benefits and risks.",
      },
      {
        text: "**The real invention is stopping double-spends without a bank**: the shared ledger plus refereeless rules, not the price.",
        cite: 'amount.h:26',
      },
      {
        text: "**It is counted in satoshis**: a hundred million per coin, so the money is fully divisible and 'a whole coin' is never the minimum.",
        cite: 'amount.h:15',
      },
    ],
    closing:
      "**Keep verifying:** the two code excerpts here are the same lines you can open on GitHub, and the reasoning between them is yours to check against the world. You came to this site able to buy Bitcoin. You leave able to say, from the ground up, why it is money.",
  },
  feynman: {
    prompt: 'A friend says "Bitcoin is worthless, it\'s not backed by anything." Answer them in three sentences without mentioning price.',
    model:
      "Bitcoin has no issuer promising redemption, while other monetary instruments may represent claims on assets or institutions. Acceptance, usefulness, institutions and expectations help explain monetary demand; none guarantees future purchasing power. Bitcoin’s distinctive contribution is a system for independently validating spending rules and choosing a valid chain by cumulative work, under explicit software and network assumptions.",
  },
};
