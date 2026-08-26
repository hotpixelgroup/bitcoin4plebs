/**
 * The question-first index: real questions newbies actually arrive with,
 * each pointing at the exact stop (or quest) where the site answers it
 * with code rather than assurances. Serializable data, like everything.
 */

import type { SiteId } from './sites.js';

export interface NewbieQuestion {
  /** Which front door this question belongs to. Absent means 'bitcoin'. */
  site?: SiteId;
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
    short: 'Nobody, and the code makes that enforceable. Rules only change when node operators adopt new code nearly unanimously, which has happened six times in seventeen years.',
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
    question: 'My transaction is stuck. Am I just out of luck?',
    short: 'No: the sender can rebroadcast it with a higher bid (replace-by-fee), and even the recipient can bump it by spending the unconfirmed coins with a generous fee (child-pays-for-parent).',
    slug: 'what-happens-when-you-press-send',
    stop: 'stuck-transaction',
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
    question: 'How do I actually keep my bitcoin safe?',
    short: "Guard one secret well: generate offline with real randomness, back it up on steel in two places, test the restore, and for serious amounts use multisig. The full playbook is on the [security page](/security).",
    slug: 'your-keys-your-coins',
    stop: 'the-rules',
  },
  {
    question: 'What happens if my hardware wallet breaks or burns?',
    short: 'Nothing, if your seed words survive: the device holds keys, not coins. Restore the words on any replacement and everything reappears.',
    slug: 'your-keys-your-coins',
    stop: 'what-kills-wallets',
  },
  {
    question: 'Can everyone see my transactions?',
    short: 'Yes, forever, and no: the ledger is public but records addresses, not names. Whether the two get linked is a discipline your wallet already practices for you.',
    slug: 'who-can-see-your-money',
    stop: 'glass-ledger',
  },
  {
    question: 'Why does my wallet show a different address every time?',
    short: "It's protecting you: fresh addresses are free (one seed makes infinitely many) and reusing one stitches your payments together for any watcher.",
    slug: 'who-can-see-your-money',
    stop: 'fresh-addresses',
  },
  {
    question: 'Is Lightning real Bitcoin?',
    short: 'A real channel balance is a signed Bitcoin transaction you can enforce on-chain yourself; the caveat is custodial apps, which hold an IOU instead. Read the actual scripts.',
    slug: 'a-thousand-coffees',
    stop: 'the-network',
  },
  {
    question: 'Why is Bitcoin worth anything at all?',
    short: "Same reason anything is money (its properties plus who accepts it), plus one nothing had before: you can verify all of it yourself. \"Backed by nothing\" is true of the dollar too.",
    slug: 'why-is-this-money',
    stop: 'nothing-is-backed',
  },
  {
    question: "I can't afford a whole bitcoin, is it too late?",
    short: "A misunderstanding: Bitcoin is counted in satoshis, 100 million per coin, so you hold and send any fraction. Whole-coin pricing is a display choice, not a minimum.",
    slug: 'why-is-this-money',
    stop: 'checkable-scarcity',
  },
  {
    question: "Doesn't Bitcoin waste a huge amount of energy?",
    short: 'It really does use a country\'s worth of power, and the mix is not all clean. But that energy is the product, not overhead: it is what makes the ledger impossible to forge. Both columns, honestly.',
    slug: 'does-bitcoin-waste-energy',
    stop: 'the-objection',
  },
  // --- lightning4plebs ---
  {
    site: 'lightning',
    question: 'Do my coins leave Bitcoin when I use Lightning?',
    short: 'No. They sit in an ordinary Bitcoin output locked to two keys: the chain simply is not asked about them while the channel is open.',
    slug: 'what-is-a-channel',
    stop: 'the-lock',
  },
  {
    site: 'lightning',
    question: 'What stops my channel partner stealing from me?',
    short: 'A key built from two halves that neither of you can complete alone and moving to a new balance is what hands them their half.',
    slug: 'why-cheating-fails',
    stop: 'the-two-halves',
  },
  {
    site: 'lightning',
    question: 'What actually is that long lnbc string?',
    short: 'A signed request: an amount, a description, a deadline, and the hash of a secret only the payee knows. You can decode one in your browser.',
    slug: 'what-is-an-invoice',
    stop: 'the-shape',
  },
  {
    site: 'lightning',
    question: 'Why can I only pay a Lightning invoice once?',
    short: 'The hash at its centre commits to a secret that is spent on first payment. Anyone who saw that payment already knows the secret.',
    slug: 'what-is-an-invoice',
    stop: 'not-an-address',
  },
  {
    site: 'lightning',
    question: 'Can the nodes in the middle steal my payment?',
    short: 'They are never given anything spendable, only a promise that opens with a secret they do not have. Failing to forward earns them nothing.',
    slug: 'crossing-strangers',
    stop: 'the-lock',
  },
  {
    site: 'lightning',
    question: 'Why did my payment fail with "no route"?',
    short: 'Usually liquidity pointing the wrong way: a channel can only push what is on your side of it, and the payer often cannot tell in advance.',
    slug: 'crossing-strangers',
    stop: 'the-ladder',
  },
  {
    site: 'lightning',
    question: 'My payment is stuck. Is my money gone?',
    short: 'No: it is locked in an HTLC until its deadline, then it comes back. Long routes mean long deadlines, sometimes hours.',
    slug: 'crossing-strangers',
    stop: 'the-ladder',
  },
  {
    site: 'lightning',
    question: 'Can routing nodes see who I am paying?',
    short: 'No. The specification is precise: a hop learns its neighbours and nothing else, not the route, not its length, not its own position.',
    slug: 'who-paid-whom',
    stop: 'the-claim',
  },
  {
    site: 'lightning',
    question: 'So Lightning is completely private?',
    short: 'No, and the spec says so itself. Your first hop knows you, a custodial wallet sees everything, and traffic analysis is out of scope.',
    slug: 'who-paid-whom',
    stop: 'honest-limits',
  },
  {
    site: 'lightning',
    question: 'Why does closing a channel take so long?',
    short: 'A force close puts your own funds behind a timelock: the window in which your counterparty could prove you cheated. Cooperative closes are immediate.',
    slug: 'why-cheating-fails',
    stop: 'delay-or-punish',
  },
  {
    site: 'lightning',
    question: 'What is a millisatoshi and why does it exist?',
    short: 'A thousandth of a satoshi, and it exists only above the chain, routing fees are often a tiny fraction of a sat and would otherwise round to zero.',
    slug: 'crossing-strangers',
    stop: 'the-message',
  },
  {
    site: 'lightning',
    question: 'How do I prove I paid someone?',
    short: 'You hold a secret that hashes to the number in their signed invoice. Only they could produce it, and only in exchange for payment.',
    slug: 'what-is-an-invoice',
    stop: 'the-hash',
  },
  {
    site: 'lightning',
    question: 'Who actually receives the routing fees?',
    short: 'Each forwarding node keeps its own and never as a separate payment. It is simply offered more on one channel than it sends on the other and keeps the difference.',
    slug: 'finding-a-route',
    stop: 'who-gets-paid',
  },
  {
    site: 'lightning',
    question: 'Does every hop add a fee?',
    short: 'Every hop that forwards does. The sender does not (it forwards for nobody) and the payee does not (it is being paid), so N channels means N−1 fees.',
    slug: 'finding-a-route',
    stop: 'who-gets-paid',
  },
  {
    site: 'lightning',
    question: 'How do I know how many hops my payment will take?',
    short: 'You choose them, route selection happens in your own wallet, so the count and the total cost are settled before anything moves. Nobody on the route knows the length.',
    slug: 'finding-a-route',
    stop: 'who-gets-paid',
  },
  {
    site: 'lightning',
    question: 'Does the number of hops matter?',
    short: 'Less than you would think. A long cheap route beats a short expensive one, and you see the total in advance. The onion caps a route at 20 hops; real ones are far shorter.',
    slug: 'finding-a-route',
    stop: 'who-gets-paid',
  },
  {
    site: 'lightning',
    question: 'Who decides what a Lightning payment costs?',
    short: 'Nobody centrally. Each node picks two numbers, advertises them, and your wallet adds up the cheapest path. The specification fixes the formula, never the numbers.',
    slug: 'finding-a-route',
    stop: 'setting-fees',
  },
];

/** The question-first index for one front door. */
export function questionsForSite(site: SiteId): NewbieQuestion[] {
  return questions.filter((q) => (q.site ?? 'bitcoin') === site);
}
