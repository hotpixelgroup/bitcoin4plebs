import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #0: What even is a ledger?
 *
 * The zero-code on-ramp. Before validation.cpp means anything, a true
 * beginner needs the mental model: money as a shared list, why copies of
 * the list matter, and what a "rule" even means in software. No excerpts,
 * no jargon; one interactive figure and a bridge into Quest #1.
 */
export const quest00: Quest = {
  id: 'quest-00',
  slug: 'what-even-is-a-ledger',
  number: 0,
  kicker: 'Start here.',
  track: 'Start here',
  title: 'What even is a ledger?',
  summary:
    'No code in this one, promise. Five minutes on the oldest idea in money: a list of who paid whom, why whoever keeps the list holds all the power, and the trick that changed that.',
  duration: '6 min',
  pin: BITCOIN_PIN,
  story: {
    stage: "an idea",
    text: "Meet **Ana**. She's buying **Bo's** used bike for 0.6 BTC, and you're going to follow that payment through every machine Bitcoin has. Right now it is nothing but an idea: a line that needs adding to a shared list, exactly like the village entries above.",
  },
  intro: [
    'Every other quest on this site shows you real Bitcoin source code. This one shows you **none**, on purpose. Before the code can mean anything, you need the idea underneath it, and the idea is older than computers: a **ledger**, which is just a list of who paid whom.',
    'Read these four stops and the rest of the site stops being "programming" and starts being something much simpler: *checking a list*.',
  ],
  promise:
    'No source code in this quest, and nothing to take on faith either: every claim here is something you can reason through yourself in the figure below. The receipts start in Quest #1.',
  stops: [
    {
      id: 'money-is-memory',
      title: 'Money is a memory of who is owed what',
      takeaway:
        'Strip away the paper and the apps, and money is a **list**: who paid whom, and when. Your bank balance is not a pile of anything. It is one line on a list that a bank keeps.',
      prose: [
        'Picture a village with no cash. The baker gives you bread; everyone remembers "the baker is owed one." Next week you fix the baker\'s roof; the memory updates. Cash, card networks, and banking apps are all just technologies for keeping that shared memory when the village gets too big to remember.',
        'This is worth sitting with, because it dissolves the most common newbie question. "Where ARE my bitcoins?" has the same answer as "where IS your bank balance?": nowhere. Both are entries on a ledger. The only interesting questions about any money are: **who keeps the list, and what stops them from editing it?**',
      ],
      quiz: [
        {
          question: 'Your bank balance is best described as…',
          options: [
            'Cash stored in a vault with your name on it',
            'An entry on a list the bank maintains',
            'A file on your phone',
          ],
          answer: 1,
          explain:
            'Banks hold nothing "yours" in a drawer. Your balance is a row in their ledger, which is exactly why the interesting question is who controls the ledger.',
        },
      ],
    },
    {
      id: 'the-copy-problem',
      contrast: [
        { aspect: "Who keeps the ledger", bank: "The bank keeps the only copy", bitcoin: "Everyone who wants a copy keeps a full one" },
        { aspect: "Who can edit it", bank: "The keeper, and whoever compels the keeper", bitcoin: "Nobody: new lines must pass rules every copy checks" },
        { aspect: "What a frozen account means", bank: "The keeper declined you", bitcoin: "No mechanism for it exists in the rules" },
      ],
      title: 'Whoever keeps the list rules the list',
      takeaway:
        'One list with one keeper means the keeper is in charge: they can freeze a line, edit a line, or add a line for themselves. The fix sounds absurd at first: **let everyone keep a full copy, and agree on rules for new lines.**',
      prose: [
        'Every money system before Bitcoin picked a keeper: a bank, a card network, a government. Usually that works fine. But notice what you\'re trusting: the keeper decides what gets written, and history has plenty of keepers who wrote themselves rich or crossed out lines they disliked.',
        'The figure below lets you feel the alternative. Four people, four complete copies of the same list. An honest entry lands on every copy. Then let Mallory try quietly editing *her* copy, and watch what the other three copies do to her version of reality.',
      ],
      viz: 'shared-ledger',
      myth: {
        belief: 'Bitcoins are files saved on your computer, and stealing the file steals the money.',
        reality:
          'There is no coin file anywhere. There is one giant shared list, copied onto thousands of machines, and "your" bitcoin is a set of entries on it. What lives on your device is a **key** that lets you add a new entry spending them (Quest #3 shows the exact lock).',
      },
      quiz: [
        {
          question: 'In the figure, why does Mallory\'s edit fail?',
          options: [
            'A moderator bans her account',
            'Her copy simply disagrees with everyone else\'s, so the others ignore it',
            'The software deletes her list',
          ],
          answer: 1,
          explain:
            'Nobody punishes her and nothing is deleted. Her copy just stops matching the majority who followed the rules, so her version carries no weight. Quest #4 shows this exact mechanism in Bitcoin\'s code.',
        },
      ],
    },
    {
      id: 'rules-not-referees',
      title: 'A rule only counts if checking it needs no referee',
      takeaway:
        'Shared copies alone aren\'t enough. You also need **rules for new lines** that anyone can check alone: no judge, no manager, no phone call. "Is this entry allowed?" has to be pure arithmetic.',
      prose: [
        'Think about what a rule must look like if four strangers with four copies have to agree without a referee. "Entries must be reasonable" fails: reasonable to whom? The rules must be mechanical. *An entry may only spend money an earlier entry gave you. An entry must carry a valid signature. New money may only appear on schedule.* Anyone can check those with a pencil.',
        'That is all software is in this story: **a pencil that never gets tired.** Bitcoin\'s "code" is a rulebook for list entries, written precisely enough that fifty thousand computers reach the same verdict on every line, forever, without meeting.',
      ],
      quiz: [
        {
          question: 'Which of these could work as a rule for a refereeless shared ledger?',
          options: [
            '"Entries must be fair"',
            '"Large entries need manager approval"',
            '"An entry may only spend money an earlier entry gave you"',
          ],
          answer: 2,
          explain:
            'Only the third is checkable by anyone, alone, with certainty. "Fair" needs a judge and "manager approval" needs a manager, which is exactly the power the shared ledger was built to remove.',
        },
      ],
    },
    {
      id: 'why-code',
      title: 'Why the rest of this site shows you code',
      takeaway:
        'Bitcoin is a shared ledger whose rulebook is public. The rulebook is the code. Reading it is not a programmer\'s privilege; it is **the whole point**, and every quest from here hands you one rule at a time.',
      prose: [
        'Now the site\'s plan makes sense. Quest #1 shows you the rule for how new money appears (ten lines). Quest #3 shows the rule that keeps your entries yours (a lock and a signature). Quest #6 shows how the next page of the list gets chosen. Quest #9 puts the whole rulebook on your own machine.',
        'You will not need to write a line of code. You will read short excerpts with every line explained, then press buttons that run the real arithmetic in your browser. If you followed the village story, you already understand Bitcoin. The rest is receipts.',
      ],
      quiz: [
        {
          question: 'What is Bitcoin\'s "code," in the language of this quest?',
          options: [
            'The rulebook that says which new list entries are allowed',
            'A password that unlocks the network',
            'The app you install to buy bitcoin',
          ],
          answer: 0,
          explain:
            'The code is the rulebook for the shared list, public and mechanical. Every quest after this one shows you a real page of it.',
        },
      ],
    },
  ],
  recap: {
    tryIt:
      'Next time you split a bill with friends, watch who keeps the tally and what happens when two memories disagree. Whatever settles it, a person, an app, a bank, is the referee Bitcoin replaced with copies and rules.',
    items: [
      { text: '**Money is a ledger**: a list of who paid whom. Cash and banks are just ways of keeping it.' },
      { text: '**One keeper means one ruler.** The fix: everyone keeps a full copy and agrees on mechanical rules for new lines.' },
      { text: '**Rules must need no referee**: pure arithmetic anyone can check alone. Software is the pencil that never tires.' },
      { text: '**Bitcoin\'s code is the public rulebook** for such a list, and reading it is exactly what the next ten quests are for.' },
    ],
    closing:
      "**Next:** the first page of the rulebook. Quest #1 shows you the ten lines that decide how new money appears on the list, and then your own browser runs them. No trust required; that's the house style here.",
  },
  feynman: {
    prompt: "Explain to a friend, in two sentences, what money actually is.",
    model:
      "Money is a shared memory of who is owed what, and everything from cash to banking apps is just a way of keeping that list. The only questions that matter about any money are who keeps the list and what stops them from editing it.",
  },
};
