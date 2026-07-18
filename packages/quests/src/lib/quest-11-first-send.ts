import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #11: Send your first (play) bitcoin.
 *
 * The hands-on quest. Bitcoin ships with built-in practice networks where
 * coins are worthless by design; the reader gets free signet coins, sends
 * a real transaction with a real wallet, and then watches THEIR OWN txid
 * confirm through the site's tracker. The site never touches keys.
 */
export const quest11: Quest = {
  id: 'quest-11',
  slug: 'send-your-first-play-bitcoin',
  number: 11,
  kicker: 'Hands on. Risk off.',
  track: 'Advanced',
  title: 'Send your first bitcoin, with play money.',
  summary:
    'Reading about swimming only goes so far. Bitcoin ships with built-in practice networks where the coins are worthless by design: get some free, send a real transaction, and watch your own txid confirm.',
  duration: '15 min',
  pin: BITCOIN_PIN,
  story: {
    stage: "your turn",
    text: "You've followed Ana's payment from idea to burial. Now be Ana: send your own payment on the practice network, then watch every stage of this story happen to **your** txid in the tracker below.",
  },
  intro: [
    'Ten quests of reading and verifying deserve a graduation exercise you can *feel*: sending a real Bitcoin transaction. Not a simulation, a real one, signed by a real wallet and mined into a real chain. The trick is choosing which chain.',
    'Bitcoin Core ships several complete parallel networks. This quest uses **signet**, the stable practice network: real software, real blocks, real wallets, and coins that anyone can get for free, which is exactly what makes them worthless. Perfect.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'practice-networks',
      title: 'Bitcoin ships with practice networks built in',
      takeaway:
        'Signet is not a toy someone bolted on. It is defined **in the same file as mainnet**, with the same machinery: its own parameters, its own seeds run by the same named developers you met in Quest #9.',
      prose: [
        'Scroll back through this file and you pass Quest #1\'s halving interval, Quest #8\'s genesis block, Quest #10\'s address prefixes. Keep scrolling and you reach this class: a complete second Bitcoin universe, defined by the same code with different constants.',
        'Signet\'s one twist: blocks must carry a signature from a known coordinator (the "challenge" on line 453). That sounds like centralization, and for the *practice net* it is, deliberately: it keeps the training chain stable and spam-free. Mainnet has no such line, which you can verify by scrolling up.',
      ],
      annotations: [
        { lines: 'L444', text: 'A whole second network, as a class, in the same file as the real one.' },
        { lines: 'L453', text: 'The signet twist: blocks need this signature. Training wheels, on purpose, for the practice chain only.' },
        { lines: 'L455–56', text: 'Familiar names: the same kind of DNS seeds, run by the same public individuals, as mainnet.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 444, endLine: 456 },
        language: 'cpp',
        lines: [
          { n: 444, text: 'class SigNetParams : public CChainParams {', highlight: true },
          { n: 445, text: 'public:' },
          { n: 446, text: '    explicit SigNetParams(const SigNetOptions& options)' },
          { n: 447, text: '    {' },
          { n: 448, text: '        std::vector<uint8_t> bin;' },
          { n: 449, text: '        vFixedSeeds.clear();' },
          { n: 450, text: '        vSeeds.clear();' },
          { n: 451, text: '' },
          { n: 452, text: '        if (!options.challenge) {' },
          {
            n: 453,
            text: '            bin = "512103ad5e0edad18cb1f0fc0d28a3d4f1f3e445640337489abb10404f2d1e086be430210359ef5021964fe22d6f8e05b2463c9540ce96883fe3b278760f048f5189f2e6c452ae"_hex_v_u8;',
            highlight: true,
          },
          { n: 454, text: '            vFixedSeeds = std::vector<uint8_t>(std::begin(chainparams_seed_signet), std::end(chainparams_seed_signet));' },
          { n: 455, text: '            vSeeds.emplace_back("seed.signet.bitcoin.sprovoost.nl.");', highlight: true },
          { n: 456, text: '            vSeeds.emplace_back("seed.signet.achownodes.xyz."); // Ava Chow, only supports x1, x5, x9, x49, x809, x849, xd, x400, x404, x408, x448, xc08, xc48, x40c' },
        ],
      },
    },
    {
      id: 'worthless-by-design',
      title: 'Same genesis builder, worthless coins, on purpose',
      takeaway:
        'Signet\'s genesis block is built by **the exact function from Quest #8**, Times headline and all: check line 524, the merkle root is *identical* to mainnet\'s. Different time, nonce, and difficulty give it a different hash, and a different universe.',
      myth: {
        belief: 'Maybe my testnet coins will be worth something someday.',
        reality:
          'They cannot be, by construction: anyone can get unlimited practice coins for free from faucets, so scarcity is impossible. That is not a flaw. Worthlessness is the feature that makes fearless practice possible.',
      },
      prose: [
        'Read line 521 next to Quest #8\'s line 158: same builder, same 50 BTC reward, same embedded newspaper headline from 2009, because the coinbase construction is byte-for-byte the same. That is why line 524 asserts the *same* merkle root you recomputed in Quest #8.',
        'What differs: the timestamp (1598918400 is 1 September 2020), the nonce, and much easier difficulty bits. Different header fields, different hash, different chain. Every rule you have verified in this curriculum runs identically over there, which is exactly what makes it honest practice.',
      ],
      annotations: [
        { lines: 'L521', text: 'Quest #8\'s builder, called with 2020 parameters: signet\'s big bang.' },
        { lines: 'L523', text: 'Signet\'s own startup assert, exactly like mainnet\'s.' },
        { lines: 'L524', text: 'The famous 4a5e1e… merkle root again: same single coinbase, same Times headline inside.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 521, endLine: 524 },
        language: 'cpp',
        lines: [
          { n: 521, text: '        genesis = CreateGenesisBlock(1598918400, 52613770, 0x1e0377ae, 1, 50 * COIN);', highlight: true },
          { n: 522, text: '        consensus.hashGenesisBlock = genesis.GetHash();' },
          { n: 523, text: '        assert(consensus.hashGenesisBlock == uint256{"00000008819873e925422c1ff0f99f7cc9bbb232af63a077a480a3633bee1ef6"});' },
          { n: 524, text: '        assert(genesis.hashMerkleRoot == uint256{"4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"});', highlight: true },
        ],
      },
    },
    {
      id: 'tb-addresses',
      title: 'Play addresses cannot cross into real money',
      takeaway:
        'Signet addresses start **tb1**, not bc1, because its prefixes are different in this file, and Quest #10 taught you the prefix lives *inside the checksum*. A play address pasted into a mainnet wallet fails arithmetic, instantly.',
      prose: [
        'This is the safety rail that makes the whole exercise carefree. The two universes cannot leak into each other by accident: every address carries its network in its own checksum, and every wallet checks it before anything moves.',
        'So when the faucet hands you a tb1 address, or your practice wallet shows one, you are looking at Quest #10\'s machinery doing quiet safety work. Mistype it, wrong-network it, mangle it: arithmetic catches all of it.',
      ],
      quiz: [
        {
          question: 'Why can\'t you accidentally send real bitcoin to a signet address?',
          options: [
            'A moderator reviews cross-network sends',
            'The prefix is part of the checksum, so mainnet wallets reject tb1 addresses as invalid',
            'Signet addresses are secret',
          ],
          answer: 1,
          explain:
            'The network prefix feeds the bech32 checksum from Quest #10. A tb1 address handed to a mainnet wallet fails validation before any transaction exists.',
        },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 541, endLine: 547 },
        language: 'cpp',
        lines: [
          { n: 541, text: '        base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1,111);' },
          { n: 542, text: '        base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1,196);' },
          { n: 543, text: '        base58Prefixes[SECRET_KEY] =     std::vector<unsigned char>(1,239);' },
          { n: 544, text: '        base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x35, 0x87, 0xCF};' },
          { n: 545, text: '        base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x35, 0x83, 0x94};' },
          { n: 546, text: '' },
          { n: 547, text: '        bech32_hrp = "tb";', highlight: true },
        ],
      },
    },
    {
      id: 'do-it',
      title: 'Now actually do it: coins in, payment out',
      takeaway:
        'Ten minutes, three steps, zero risk: get a practice wallet, collect free signet coins from a faucet, and send some. **This site never sees your keys**; the wallet and the network do all the real work, which is the point.',
      prose: [
        'Step one, a wallet: install [Sparrow Wallet](https://sparrowwallet.com) on a computer and switch its network to *Signet* (Tools → Network), or use any wallet that lists signet support. Create a fresh wallet and let it generate a practice seed phrase. (House rule from the glossary applies even here: never type a seed phrase that guards real money into anything.)',
        'Step two, free coins: copy a receive address from your wallet (it will start with tb1) and paste it into a public signet faucet such as [signetfaucet.com](https://signetfaucet.com). Coins arrive within a block or two. Step three, the graduation move: send some back to the faucet\'s return address, or to a second address of your own. Your wallet builds the boxes (Quest #3), signs, and gossips it (Quest #7). Then copy the **transaction ID** it shows you and bring it to the finale below.',
      ],
      quiz: [
        {
          question: 'What should you never type into a website, including this one?',
          options: [
            'A signet address',
            'A transaction ID',
            'A seed phrase that guards real money',
          ],
          answer: 2,
          explain:
            'Addresses and txids are public by design. A seed phrase IS the money; no legitimate site or person ever needs it. Practice seeds guarding worthless signet coins are the only kind you can afford to be casual with.',
        },
      ],
    },
  ],
  finale: {
    title: 'Watch your own transaction confirm',
    takeaway:
      'Paste the transaction ID your wallet gave you and follow it live: into the waiting room, into a block, under confirmations. Everything you will see is a concept you have already verified; this time it is **your** payment on the wire.',
    runnerId: 'signet-tracker',
    note: 'This tracker asks a public signet node (mempool.space) about your txid, which means trusting their answer. Quest #9 is the cure: your own node answers the same questions from its own disk. No txid yet? The sample button follows a real, already-confirmed signet payment.',
  },
  recap: {
    items: [
      {
        text: '**Practice networks are built into Bitcoin itself**: signet lives in the same file as mainnet, with the same rules and its own training-wheel signature.',
        cite: 'chainparams.cpp:444',
      },
      {
        text: '**Play coins are worthless by design**, and the design is the feature: fearless practice with real software.',
      },
      {
        text: '**tb1 addresses cannot leak into real money**: the network prefix lives inside the Quest #10 checksum.',
        cite: 'chainparams.cpp:547',
      },
      {
        text: '**You sent a real Bitcoin transaction**: real wallet, real signature, real block, and you watched your own txid get buried under proof-of-work.',
      },
    ],
    closing:
      "**You've now done the thing this site is about.** You read the rules, verified them, and then used them: a payment signed with your key, checked by strangers' machines, and sealed under work nobody can fake. When you're ready to do it with real money, everything transfers except the fearlessness, so keep a little of that too. Practice again any time; the coins will never mind.",
  },
  feynman: {
    prompt: 'Explain to a friend, in two sentences, why practicing on signet is completely safe.',
    model:
      'Signet is a parallel Bitcoin network built into the same software, where anyone can get coins for free, so they can never be worth anything. Its addresses even fail the checksum on the real network, which means play money and real money physically cannot mix.',
  },
};
