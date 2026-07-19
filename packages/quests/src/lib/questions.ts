/**
 * The question-first index: real questions newbies actually arrive with,
 * each pointing at the exact stop (or quest) where the site answers it
 * with code rather than assurances. Serializable data, like everything.
 */

export interface NewbieQuestion {
  question: string;
  /** One-line answer, RichText (the link is where the proof lives). */
  short: string;
  /** Quest slug the answer lives in. */
  slug: string;
  /** Optional stop id to deep-link. */
  stop?: string;
}

export const questions: NewbieQuestion[] = [
  {
    question: 'Where do my bitcoins actually live?',
    short: 'Nowhere, and everywhere: they are entries on a shared ledger copied across thousands of machines. Your wallet holds keys, not coins.',
    slug: 'what-stops-someone-spending-your-coins',
    stop: 'locked-boxes',
  },
  {
    question: 'Is there really a limit of 21 million? Says who?',
    short: 'Says ten lines of arithmetic that your own browser can run. The cap is an outcome of halving math, not a promise.',
    slug: 'verify-the-21-million-cap',
    stop: 'schedule',
  },
  {
    question: "Can't someone just change the 21 million number?",
    short: 'Anyone can edit their own copy. Their node then disagrees with every other node on Earth and gets ignored.',
    slug: 'who-can-change-bitcoins-rules',
    stop: 'no-admin-key',
  },
  {
    question: 'Who is in charge of Bitcoin?',
    short: 'Nobody, enforceably: rules only change when node operators near-unanimously adopt new code, which has happened six times in seventeen years.',
    slug: 'who-can-change-bitcoins-rules',
    stop: 'how-rules-change',
  },
  {
    question: 'Can Bitcoin be hacked?',
    short: 'The rules have survived two serious bugs, both documented in the code with CVE numbers. Read the scars and run the attacks yourself.',
    slug: 'the-2018-inflation-bug',
    stop: 'the-door',
  },
  {
    question: 'What stops someone from stealing my coins?',
    short: 'A lock that accepts exactly one thing: a signature from your private key. Every node checks it on every spend.',
    slug: 'what-stops-someone-spending-your-coins',
    stop: 'checkpoint',
  },
  {
    question: 'What if someone guesses my key?',
    short: 'The key space has 78 digits. Your browser can start guessing right now and you can do the honest arithmetic on when it would finish.',
    slug: 'what-stops-someone-spending-your-coins',
    stop: 'op-checksig',
  },
  {
    question: 'What happens if I lose my keys?',
    short: 'The coins stay on the ledger forever, locked to a key nobody holds. There is no reset button, which is the price of nobody being in charge.',
    slug: 'what-stops-someone-spending-your-coins',
    stop: 'locked-boxes',
  },
  {
    question: 'What do miners actually do?',
    short: 'They guess: hash an 80-byte header until the number comes out small enough. No equations, no cleverness, and you can mine a block yourself.',
    slug: 'how-does-mining-actually-work',
    stop: 'the-header',
  },
  {
    question: 'Do miners control Bitcoin?',
    short: 'No. Even 51% of hashpower cannot print a coin or change a rule; rule-breaking blocks are discarded no matter how much work they carry.',
    slug: 'who-can-change-bitcoins-rules',
    stop: 'majority-cant-print',
  },
  {
    question: 'Why does my transaction take so long sometimes?',
    short: 'Block space is auctioned. Your fee is a bid, and you wait until the auction reaches it. Watch the auction clear in real time.',
    slug: 'what-happens-when-you-press-send',
    stop: 'the-auction',
  },
  {
    question: 'Who sets the fees?',
    short: 'Nobody. You bid whatever you like; miners take the best-paying megabyte first. An empty waiting room confirms tiny bids next block.',
    slug: 'what-happens-when-you-press-send',
    stop: 'the-auction',
  },
  {
    question: 'What does "confirmed" actually mean?',
    short: 'Your transaction is in a mined block, and every later block buries it under more proof-of-work. Undoing it means re-mining everything on top.',
    slug: 'what-happens-when-you-press-send',
    stop: 'set-in-stone',
  },
  {
    question: 'Why do exchanges make me wait for 6 confirmations?',
    short: 'Each confirmation multiplies the luck an attacker needs to rewrite history. Run a thousand attack races and watch the wall grow.',
    slug: 'who-can-change-bitcoins-rules',
    stop: 'majority-cant-print',
  },
  {
    question: 'What is the halving everyone talks about?',
    short: 'Integer division changing its answer: every 210,000 blocks the new-coin reward halves. No ceremony, no announcement, just arithmetic.',
    slug: 'what-happens-at-a-halving',
    stop: 'the-switch',
  },
  {
    question: 'Where did the very first bitcoins come from?',
    short: "Block zero, mined by Satoshi in January 2009, with that day's newspaper headline inside it. You can rebuild and hash it yourself.",
    slug: 'hash-the-genesis-block',
    stop: 'headline',
  },
  {
    question: 'Who is Satoshi?',
    short: "Nobody knows, and it doesn't matter: the rules are enforced by every node, not by their author. The code outlived the founder's identity.",
    slug: 'hash-the-genesis-block',
    stop: 'birth-certificate',
  },
  {
    question: 'What is a wallet address, really?',
    short: 'Not an account: a spelling of a lock, invented offline by your wallet, with a checksum that catches every typo.',
    slug: 'what-is-an-address',
    stop: 'respelled-lock',
  },
  {
    question: 'What happens if I mistype an address?',
    short: 'The checksum math guarantees up to 4 typos are always caught. Plant typos yourself and watch every wallet refuse them.',
    slug: 'what-is-an-address',
    stop: 'checksum',
  },
  {
    question: 'What even is a blockchain?',
    short: 'A shared list where each page is sealed by a hash of the page before it. Edit history anywhere and everything after it shatters.',
    slug: 'what-even-is-a-ledger',
    stop: 'the-copy-problem',
  },
  {
    question: 'Is Bitcoin anonymous?',
    short: 'No: it is public. Every coin sits in plain view; what protects you is a lock, not secrecy. Reusing addresses links your history.',
    slug: 'what-is-an-address',
    stop: 'network-tag',
  },
  {
    question: 'How do I actually check any of this instead of trusting websites?',
    short: 'Run a node: an ordinary computer re-verifies all of history and answers questions from its own disk, including "how many bitcoin exist?"',
    slug: 'run-your-own-node',
    stop: 'rebuild-history',
  },
  {
    question: 'How many bitcoin exist right now?',
    short: 'Your own node can count every coin on its disk with one command, and the total must land at or under the schedule. Audit it.',
    slug: 'run-your-own-node',
    stop: 'interrogate',
  },
  {
    question: 'Do I need to be technical to run a node?',
    short: 'If you can install a browser, you can run a node. Disk space and patience are the real requirements, and the quest walks the fine print.',
    slug: 'run-your-own-node',
  },
  {
    question: 'Can I try Bitcoin without risking real money?',
    short: 'Yes: Bitcoin ships with built-in practice networks where the coins are worthless by design. Send your first transaction with play money.',
    slug: 'send-your-first-play-bitcoin',
  },
  {
    question: 'Why are fees sometimes huge? Is that Bitcoin failing?',
    short: 'Fees are an open auction for limited space, and spikes are demand doing the bidding. The code even guarantees every spike decays: the floor halves every 12 hours.',
    slug: 'who-keeps-bitcoin-usable',
    stop: 'fee-floor',
  },
  {
    question: 'Can miners censor my transaction?',
    short: 'One miner can skip you; that just donates your fee to the next one. Block assembly is a blind best-bid-first auction, and you can read the loop.',
    slug: 'who-keeps-bitcoin-usable',
    stop: 'auctioneer',
  },
  {
    question: 'Who decides what counts as "spam" on Bitcoin?',
    short: 'Right now: nobody, which is exactly the fight. Your node can filter what it relays, the auction prices what confirms, and BIP-110 proposes moving the question into consensus.',
    slug: 'the-data-wars',
    stop: 'the-flood',
  },
  {
    question: 'Should I run Bitcoin Core or Bitcoin Knots?',
    short: 'Same consensus, different relay taste and governance. Either one gives you full sovereignty; the comparison page and this stop give you the honest trade-offs.',
    slug: 'the-data-wars',
    stop: 'the-split',
  },
  {
    question: 'What actually is a seed phrase?',
    short: 'One giant random number wearing a word costume, with a built-in checksum so typos announce themselves. Read the recipe from the BIP itself, then mint practice phrases.',
    slug: 'your-keys-your-coins',
    stop: 'twelve-words',
  },
  {
    question: 'Is it safe to leave my coins on an exchange?',
    short: 'An exchange balance is a promise, not coins: the company holds the keys, you hold an IOU. Mt. Gox and FTX graded that promise. Learn what withdrawing actually means.',
    slug: 'your-keys-your-coins',
    stop: 'keys-not-coins',
  },
  {
    question: 'What happens if my hardware wallet breaks or burns?',
    short: 'Nothing, if your seed words survive: the device holds keys, not coins. Restore the words on any replacement and everything reappears.',
    slug: 'your-keys-your-coins',
    stop: 'what-kills-wallets',
  },
];
