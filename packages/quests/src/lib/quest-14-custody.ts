import type { Quest } from './types.js';
import { BIPS_PIN, BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #14: custody. The site has taught readers to verify Bitcoin;
 * this quest teaches them to HOLD it: what a wallet actually stores,
 * what the 12 words really are (verbatim from the pinned BIP-39 text),
 * what actually kills wallets in practice, and the handful of rules
 * that prevent nearly all of it. Finale: generate real practice seed
 * phrases in-browser and break their checksum on purpose.
 */
export const quest14: Quest = {
  id: 'quest-14',
  slug: 'your-keys-your-coins',
  number: 14,
  kicker: 'Take it home.',
  track: 'Take it home',
  title: 'Where do your coins live while you sleep?',
  summary:
    'Not in your wallet: a wallet is a keychain, not a purse. What the 12 words really are (from the BIP itself), what actually kills wallets, and the few rules that prevent nearly all of it.',
  duration: '11 min',
  pin: BITCOIN_PIN,
  story: {
    stage: 'keys come home',
    text: "Ana started this story with sats in an exchange app: an IOU with a login screen. Tonight she generates twelve words on an offline device, writes them with a pencil, and withdraws everything to an address only those words control. The exchange now holds nothing of hers but a memory.",
  },
  intro: [
    "Fourteen quests taught you to verify Bitcoin. This one teaches you to **keep** it. The sad truth of this industry is that almost nobody loses coins to broken cryptography. Thousands of people lose them every year to a photographed seed phrase, a phishing site, or an exchange that turned out to be a hole in the shape of a bank.",
    "Everything here builds on what you've proven: coins are entries on the shared ledger (Quest #0), locked to keys (Quest #3), in a keyspace no attacker can search (Quest #3's finale). The last piece is the one between the chair and the keyboard: **where those keys live, and how they survive you being human.**",
  ],
  promise:
    "Every snippet below is copied verbatim from the pinned sources: Bitcoin Core at commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b) and the BIPs repository at commit [8c369ac](https://github.com/bitcoin/bips/commit/8c369ac8e60629ac6c032ffe21bb5ec5b35213d7). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'keys-not-coins',
      title: 'Your wallet is a keychain, not a purse',
      takeaway:
        "Coins never leave the ledger; they can't. What a wallet holds is **keys**, and what an exchange account holds is **a promise**. Everything in this quest follows from telling those three things apart.",
      myth: {
        belief: 'My bitcoin is in my wallet, so if I lose my phone I lose my coins.',
        reality:
          "Your coins are entries on the ledger replicated across tens of thousands of nodes; the phone only held keys. Restore the same seed words on any other device and the wallet re-derives the same keys, asks any node about the same ledger entries, and everything is there. Lose the phone *and* the words, though, and the coins stay on the ledger forever: visible, yours, and permanently frozen.",
      },
      prose: [
        "In Quest #3 you watched `OP_CHECKSIG` demand a signature that matches the lock on a coin. A **wallet** is just the machine that holds the signing keys and does the bookkeeping: it derives your addresses, scans the ledger for coins locked to them, and signs when you spend. It holds no coins, the way your house keys hold no house.",
        'An **exchange account** is a different species entirely. There, the company holds the keys, and what you hold is a balance in *their* database: a promise, redeemable as long as they stay solvent, honest, and un-hacked. History grades that promise harshly: Mt. Gox was holding 750,000 customer bitcoin when it collapsed in 2014; FTX was "holding" billions in 2022. Not your keys, not your coins is not a slogan; it is an accounting statement.',
      ],
      contrastLabels: { left: 'An exchange account', right: 'Your own keys' },
      contrast: [
        {
          aspect: 'Who can move the coins',
          bank: 'The company, whenever its database says so',
          bitcoin: 'Only a signature from your keys (Quest #3)',
        },
        {
          aspect: 'Who can freeze or lose them',
          bank: 'The company, a hacker of the company, a court',
          bitcoin: 'Only you, by losing the backup',
        },
        {
          aspect: 'What you must protect',
          bank: 'A password, and their solvency (you cannot)',
          bitcoin: 'One backup of one seed, made once',
        },
        {
          aspect: 'If the company disappears',
          bank: 'You join a line of creditors: Gox 2014, FTX 2022',
          bitcoin: 'Nothing happens. There is no company.',
        },
      ],
    },
    {
      id: 'twelve-words',
      title: 'The 12 words are one number wearing a costume',
      takeaway:
        'A seed phrase is not a password someone chose. It is **random entropy dressed up as words**: 128 to 256 coin-flip bits, plus a built-in checksum so a mistyped word announces itself. Read the recipe from the BIP itself.',
      quiz: [
        {
          question: 'You copy a seed phrase but swap one word for a lookalike. What happens when you restore it?',
          options: [
            'The wallet opens with slightly different addresses and you may not notice',
            'The checksum fails and honest software warns you before any damage',
            'Nothing can detect the mistake',
          ],
          answer: 1,
          explain:
            'The last word carries checksum bits computed from the SHA-256 of the entropy, so a single wrong word makes the whole phrase invalid, and the BIP instructs software to warn you. You will break this on purpose in the finale. (A valid-but-different phrase, like writing down the wrong words entirely, is still unrecoverable: the checksum guards against typos, not against bad backups.)',
        },
      ],
      prose: [
        "Here is the entire recipe, quoted from the BIP-39 specification at our pinned bips commit. Flip 128 coins (ENT bits of entropy). Take the SHA-256 of the result, the same hash function you ran over the genesis block in Quest #8, and append its first 4 bits as a checksum. Chop the 132 bits into twelve 11-bit numbers, each between 0 and 2,047. Look each number up in a fixed list of 2,048 words. Read the words aloud: that's your phrase.",
        'Two things follow. First, the words are not chosen, meaningful, or guessable: they are a **uniform random number** in a space of 2¹²⁸ (Quest #3 showed you how untouchable that is). Second, the checksum means the phrase carries its own tamper-evidence, exactly like the addresses in Quest #10: get one word wrong and the arithmetic refuses to add up.',
        "One honesty note the site owes you: seed phrases are a **wallet convention, not a Bitcoin rule**. Nothing in consensus knows about words; Bitcoin Core itself doesn't use them. This page quotes a BIP, not Core, because that's where this standard actually lives, and nearly every wallet you'll meet speaks it.",
      ],
      annotations: [
        { lines: 'L46–47', text: 'Entropy first, then a checksum: the first ENT/32 bits of the entropy\'s SHA-256 (the Quest #8 hash).' },
        { lines: 'L48–51', text: 'Bits, chopped into 11-bit numbers, each an index into a 2,048-word list. Words are just a friendly spelling of a number.' },
        { lines: 'L58–59', text: 'The whole standard is two formulas.' },
        { lines: 'L63', text: '128 bits of entropy, 4 bits of checksum: the classic 12-word phrase.' },
        { lines: 'L67', text: '256 bits, 8 bits of checksum: the 24-word phrase. More words, same idea.' },
      ],
      excerpt: {
        pin: BIPS_PIN,
        ref: { file: 'bip-0039.mediawiki', startLine: 46, endLine: 68 },
        language: 'text',
        lines: [
          { n: 46, text: 'First, an initial entropy of ENT bits is generated. A checksum is generated by', highlight: true },
          { n: 47, text: 'taking the first <code>ENT / 32</code> bits of its SHA256 hash. This checksum is', highlight: true },
          { n: 48, text: 'appended to the end of the initial entropy. Next, these concatenated bits' },
          { n: 49, text: 'are split into groups of 11 bits, each encoding a number from 0-2047, serving', highlight: true },
          { n: 50, text: 'as an index into a wordlist. Finally, we convert these numbers into words and' },
          { n: 51, text: 'use the joined words as a mnemonic sentence.' },
          { n: 52, text: '' },
          { n: 53, text: 'The following table describes the relation between the initial entropy' },
          { n: 54, text: 'length (ENT), the checksum length (CS), and the length of the generated mnemonic' },
          { n: 55, text: 'sentence (MS) in words.' },
          { n: 56, text: '' },
          { n: 57, text: '<pre>' },
          { n: 58, text: 'CS = ENT / 32' },
          { n: 59, text: 'MS = (ENT + CS) / 11' },
          { n: 60, text: '' },
          { n: 61, text: '|  ENT  | CS | ENT+CS |  MS  |' },
          { n: 62, text: '+-------+----+--------+------+' },
          { n: 63, text: '|  128  |  4 |   132  |  12  |', highlight: true },
          { n: 64, text: '|  160  |  5 |   165  |  15  |' },
          { n: 65, text: '|  192  |  6 |   198  |  18  |' },
          { n: 66, text: '|  224  |  7 |   231  |  21  |' },
          { n: 67, text: '|  256  |  8 |   264  |  24  |', highlight: true },
          { n: 68, text: '</pre>' },
        ],
      },
    },
    {
      id: 'words-to-seed',
      title: 'One backup, every address you will ever have',
      takeaway:
        'The words feed a slow hash (PBKDF2, 2,048 rounds) to produce one 64-byte **seed**, and from that seed a wallet derives *every* key it will ever use. Back up the words once and you have backed up your future.',
      quiz: [
        {
          question: 'You add an optional passphrase to your seed words. You later type it slightly wrong. What does the wallet show?',
          options: [
            'An error: wrong passphrase',
            'A perfectly valid, perfectly empty wallet',
            'Your coins, since the words were right',
          ],
          answer: 1,
          explain:
            'Every passphrase produces a different valid seed and therefore a different wallet (the BIP calls this plausible deniability). Power and danger in one feature: nobody can prove a passphrase exists, and no error message will ever tell you yours was mistyped. If you use one, it needs the same backup discipline as the words.',
        },
      ],
      prose: [
        "Second excerpt, same pinned BIP. The words (plus an optional passphrase) go through **PBKDF2 with 2,048 rounds of HMAC-SHA512** and come out as a 512-bit seed. From there, the BIP-32 standard ('deterministic wallets', line 101) grows an entire tree of keys: every address your wallet has ever shown you, and every one it ever will, is derived from this one number by arithmetic that never needs luck twice.",
        "That's why modern custody is *one* backup made *once*. You are not backing up coins (they're on the ledger), not backing up an app, not backing up addresses. You are backing up 128 bits of entropy in costume, from which everything else re-grows on any device, from any vendor, in any decade.",
        'The passphrase deserves respect: it is a **25th word that creates a different wallet for every value**, including the empty one. Used well, it means a thief with your paper still has nothing. Used casually, it means you can lock yourself out with no error message in the universe to tell you why. The finale lets you feel both edges safely.',
      ],
      annotations: [
        { lines: 'L93–94', text: 'The passphrase is optional; empty string if absent. Every value, including empty, is "correct" for some wallet.' },
        { lines: 'L96–99', text: 'The machinery: PBKDF2, 2,048 iterations of HMAC-SHA512, out comes a 64-byte seed. Deliberately slow, to tax guessers.' },
        { lines: 'L101–02', text: 'The seed feeds BIP-32: one number, a whole deterministic tree of keys. This line is why one backup is enough.' },
      ],
      excerpt: {
        pin: BIPS_PIN,
        ref: { file: 'bip-0039.mediawiki', startLine: 93, endLine: 102 },
        language: 'text',
        lines: [
          { n: 93, text: 'A user may decide to protect their mnemonic with a passphrase. If a passphrase is not' },
          { n: 94, text: 'present, an empty string "" is used instead.' },
          { n: 95, text: '' },
          { n: 96, text: 'To create a binary seed from the mnemonic, we use the PBKDF2 function with a mnemonic', highlight: true },
          { n: 97, text: 'sentence (in UTF-8 NFKD) used as the password and the string "mnemonic" + passphrase (again' },
          { n: 98, text: 'in UTF-8 NFKD) used as the salt. The iteration count is set to 2048 and HMAC-SHA512 is used as', highlight: true },
          { n: 99, text: 'the pseudo-random function. The length of the derived key is 512 bits (= 64 bytes).' },
          { n: 100, text: '' },
          { n: 101, text: 'This seed can be later used to generate deterministic wallets using BIP-0032 or', highlight: true },
          { n: 102, text: 'similar methods.' },
        ],
      },
    },
    {
      id: 'what-kills-wallets',
      title: 'What actually kills wallets',
      takeaway:
        "Not code-breaking. Quest #3 showed you the keyspace; nobody has ever brute-forced a properly generated key. Real losses come from **four boring failures**, and every one of them is preventable this afternoon.",
      myth: {
        belief: 'A hardware wallet stores my coins, so if it breaks or burns, my coins are gone.',
        reality:
          "The device stores keys and signs without exposing them; the coins stay on the ledger. Destroy the device, buy any replacement (any brand that speaks BIP-39), restore the words, and everything reappears. The seed backup is the wallet; the gadget is just a fireproof way to use it.",
      },
      quiz: [
        {
          question: 'A website says: "Wallet update required: enter your 12 words to revalidate." What is this?',
          options: [
            'A routine security step',
            'The single most common way people lose everything',
            'Safe if the site uses HTTPS',
          ],
          answer: 1,
          explain:
            'No legitimate software, service, or human ever needs your existing seed words through a browser or a form. Whoever holds the words holds the coins (that is the whole design), so typing them anywhere networked hands over the wallet. The only place words belong is a wallet device or app you are deliberately restoring onto, ideally offline.',
        },
      ],
      prose: [
        "**Failure one: trusted custody.** The largest losses in Bitcoin's history were exchanges, not cryptography: Mt. Gox (2014, ~750,000 customer BTC), FTX (2022). The fix is this quest.",
        '**Failure two: the seed leaves its cage.** Phishing pages, fake wallet apps, "support" agents, a photo in your camera roll synced to a cloud. The rule is absolute and simple: *the words never touch anything with a network*. Not once, not partially, not into this site. (Our finale generates fresh practice phrases in your browser and will never ask for an existing one; be suspicious of anything that does.)',
        "**Failure three: the backup that wasn't.** Ink fades, houses flood, one copy in one place is a bet against fire, and an unlabeled passphrase is a wallet nobody can ever open again. Paper works; stamped steel shrugs at house fires; a second location defeats disasters; and a **test restore** (wipe a cheap device, restore from your words, see the same addresses) is the only proof a backup is real.",
        '**Failure four: nobody else can find it.** Custody that dies with you is failure with a delay. Someone you trust should know that a backup *exists* and how to use it when it matters, without knowing the words today. Notice what is missing from this list: attackers guessing keys. The math you verified holds; it is the humans who need engineering.',
      ],
    },
    {
      id: 'the-rules',
      title: 'The whole discipline in five rules',
      takeaway:
        'Custody sounds scary and is actually five habits: **generate offline, write on paper or steel, never type words into anything networked, test the restore, match the tool to the amount.** Everything else is commentary.',
      prose: [
        "Match the tool to the stakes, the way you already do with cash: **pocket money** in a reputable open-source phone wallet is fine, the way a wallet with $50 in it is fine. **Savings** belong on a hardware signer whose whole job is keeping keys off networked machines. Practice the entire loop with worthless coins first; that's precisely what Quest #11's signet was for, and the [wallet types page](/wallets) walks the options without selling you anything.",
        'And keep the promise this site has made fourteen times now: verify, don\'t trust, including us. The BIP text above is pinned and letter-checked. The finale below runs the *actual algorithm from that text* in your browser, offline-capable, asking you for nothing. When you do this for real: real device, real pencil, no cameras, no cloud, and coins sent in a small test amount first, exactly like Ana.',
      ],
    },
  ],
  finale: {
    title: 'The seed studio: mint practice phrases, then break one',
    takeaway:
      "Generate real BIP-39 phrases from your browser's own entropy, watch the checksum arithmetic pass, then swap a single word and watch it fail. Practice only: fresh phrases, never yours, nothing sent anywhere.",
    runnerId: 'seed-studio',
    note: 'Runs the algorithm from the pinned BIP text 1:1 (entropy → SHA-256 checksum → 11-bit words → PBKDF2 seed) via your browser\'s WebCrypto, cross-checked in our tests against an independent implementation and the pinned wordlist. Practice phrases only: for real funds, generate on a dedicated offline device, never in a browser.',
  },
  recap: {
    items: [
      {
        text: '**Wallets hold keys, ledgers hold coins, exchanges hold promises.** Restore-from-words works on any device because the coins never moved.',
      },
      {
        text: '**A seed phrase is entropy in costume**: 128–256 random bits plus a SHA-256 checksum, spelled with 2,048 words, so typos announce themselves.',
        cite: 'bip-0039.mediawiki:46',
      },
      {
        text: '**One backup covers forever**: PBKDF2 turns the words into a seed, and BIP-32 grows every future key from it deterministically.',
        cite: 'bip-0039.mediawiki:96',
      },
      {
        text: '**Losses are human, not mathematical**: custodians, leaked words, untested backups, and heirless setups, all preventable with five habits.',
      },
    ],
    closing:
      "**Keep verifying:** the excerpts above are letter-checked against the pinned BIPs repository, and the finale runs the same arithmetic they describe. You came here holding an IOU and a hope. You leave able to hold the real thing.",
  },
  feynman: {
    prompt: 'Explain to a friend what a seed phrase is and why typing it into a website loses everything, in three sentences.',
    model:
      'A seed phrase is a giant random number written as words, and every key your wallet will ever use is re-derived from it by public arithmetic. That means the words ARE the wallet: any person or program that reads them can rebuild all your keys and spend everything, no password or permission needed. So they get written on paper or steel, restored only into wallet devices, and never typed into anything connected to the internet, because no honest service will ever ask.',
  },
};
