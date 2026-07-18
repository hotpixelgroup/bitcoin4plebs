import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #8 — Hash the genesis block yourself.
 *
 * First quest of the Advanced track: from rules to artifacts. The reader
 * decodes the newspaper headline Satoshi buried in block zero, then
 * reconstructs the 80-byte header from the four numbers in chainparams.cpp
 * and recomputes the most famous hash in Bitcoin, in their own browser.
 *
 * Every excerpt is VERBATIM from Bitcoin Core at the pinned commit — the
 * BITCOIN_SRC test diffs every line against the real source.
 */
export const quest08: Quest = {
  id: 'quest-08',
  slug: 'hash-the-genesis-block',
  number: 8,
  kicker: "Don't trust. Verify.",
  track: 'Advanced',
  title: 'Hash the genesis block — with your own machine.',
  summary:
    'Block zero has been sitting in every node on Earth since January 2009. Decode the newspaper headline Satoshi buried in it — then recompute the most famous hash in Bitcoin and watch it match, byte for byte.',
  duration: '9 min',
  pin: BITCOIN_PIN,
  intro: [
    'The Foundations quests taught you Bitcoin\'s **rules**. The Advanced quests are about **artifacts** — real objects on the real chain, starting with the very first one: the genesis block, mined by Satoshi on 3 January 2009. It isn\'t in a museum. Byte for byte, it sits on the disk of every node on Earth, and its exact construction is written in the file you\'re about to read.',
    'By the end of this quest your own computer will have rebuilt block zero\'s header from four numbers, hashed it with the same double SHA-256 you ran in Quest #6, and reproduced the hash that every Bitcoin node checks **every time it starts up**.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either — every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'headline',
      title: 'A newspaper headline, hard-coded into block zero',
      takeaway:
        'The first block ever mined carries a message: **that day\'s front-page headline from The Times**. It\'s a timestamp you can\'t fake — and, given what it says, a mission statement.',
      prose: [
        'Why a headline? Proof of freshness. A block containing the 3 January 2009 front page **cannot have been mined before 3 January 2009** — Satoshi couldn\'t have pre-mined the chain in secret and backdated it. It\'s the same trick as photographing a hostage with today\'s newspaper, except the hostage is a monetary system.',
        'And of all the headlines to land on: *Chancellor on brink of second bailout for banks*. Nobody can prove Satoshi chose it as commentary — but the code preserves it forever either way. When your node finishes this curriculum\'s journey and stores block zero, these exact bytes are what it stores.',
      ],
      annotations: [
        { lines: 'L71', text: 'The headline, verbatim, as a C string. In the finale you\'ll meet it again — as raw bytes inside the block itself.' },
        {
          lines: 'L72',
          text: 'The lock on the first 50 BTC ever minted: Satoshi\'s public key plus `OP_CHECKSIG` — Quest #3\'s locked box, serial number one.',
        },
        { lines: 'L73', text: 'Hand both to the builder function you\'ll read at the next stop.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 69, endLine: 74 },
        language: 'cpp',
        lines: [
          {
            n: 69,
            text: 'static CBlock CreateGenesisBlock(uint32_t nTime, uint32_t nNonce, uint32_t nBits, int32_t nVersion, const CAmount& genesisReward)',
          },
          { n: 70, text: '{' },
          {
            n: 71,
            text: '    const char* pszTimestamp = "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks";',
            highlight: true,
          },
          {
            n: 72,
            text: '    const CScript genesisOutputScript = CScript() << "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f"_hex << OP_CHECKSIG;',
          },
          {
            n: 73,
            text: '    return CreateGenesisBlock(pszTimestamp, genesisOutputScript, nTime, nNonce, nBits, nVersion, genesisReward);',
          },
          { n: 74, text: '}' },
        ],
      },
    },
    {
      id: 'construction',
      title: 'Block zero is built exactly like block 900,000',
      takeaway:
        'No special cases: the genesis block is assembled from the same parts as every block since — one coinbase transaction and the 80-byte header you met in Quest #6. **One field gives away its rank: the previous-block hash is set to nothing.**',
      prose: [
        'Read the assembly. The headline is packed into the coinbase input (line 43 — the same trick miners use for messages to this day), the 50 BTC reward is locked to Satoshi\'s key (lines 44–45), and then the six header fields you know from Quest #6 are filled in, one per line.',
        'Line 53 is the beautiful one: `hashPrevBlock.SetNull()`. Every other block that will ever exist points at a parent. This one points at **zero** — and that\'s not a placeholder, it\'s the definition of "first." When your node verifies history in Quest #9, it walks the parent pointers back until it lands exactly here.',
      ],
      annotations: [
        { lines: 'L43', text: 'The headline goes into the coinbase\'s input script — you\'ll decode these exact bytes in the finale.' },
        { lines: 'L44–45', text: 'The first 50 BTC, locked to Satoshi\'s public key.' },
        { lines: 'L48–51', text: 'Quest #6\'s header fields: time, difficulty bits, the winning nonce, version.' },
        { lines: 'L53', text: 'The birthmark: **no parent block exists**, so the pointer is all zeros.', },
        { lines: 'L54', text: 'The merkle root — a fingerprint of the block\'s single transaction.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 43, endLine: 55 },
        language: 'cpp',
        lines: [
          {
            n: 43,
            text: '    txNew.vin[0].scriptSig = CScript() << 486604799 << CScriptNum(4) << std::vector<unsigned char>((const unsigned char*)pszTimestamp, (const unsigned char*)pszTimestamp + strlen(pszTimestamp));',
            highlight: true,
          },
          { n: 44, text: '    txNew.vout[0].nValue = genesisReward;' },
          { n: 45, text: '    txNew.vout[0].scriptPubKey = genesisOutputScript;' },
          { n: 46, text: '' },
          { n: 47, text: '    CBlock genesis;' },
          { n: 48, text: '    genesis.nTime    = nTime;' },
          { n: 49, text: '    genesis.nBits    = nBits;' },
          { n: 50, text: '    genesis.nNonce   = nNonce;' },
          { n: 51, text: '    genesis.nVersion = nVersion;' },
          { n: 52, text: '    genesis.vtx.push_back(MakeTransactionRef(std::move(txNew)));' },
          { n: 53, text: '    genesis.hashPrevBlock.SetNull();', highlight: true },
          { n: 54, text: '    genesis.hashMerkleRoot = BlockMerkleRoot(genesis);' },
          { n: 55, text: '    return genesis;' },
        ],
      },
    },
    {
      id: 'birth-certificate',
      title: 'The exact numbers — and the check your node runs at every boot',
      takeaway:
        'Here is the birth certificate: timestamp, the winning nonce, the easiest-ever difficulty, 50 BTC. And below it, an `assert` — **your node refuses to even start** unless its own genesis block hashes to the famous value.',
      prose: [
        'Four arguments on line 158: `1231006505` is 3 January 2009, 18:15:05 UTC. `2083236893` is a Quest #6 lottery ticket — the winning nonce, one value out of the four billion a 32-bit field allows. `0x1d00ffff` is the easiest difficulty Bitcoin has ever had, and it has only gone up since.',
        'Then look at line 160. This is not documentation — `assert` means the program **checks its own birth certificate on startup and dies if it doesn\'t match**. If a single byte of the genesis construction were corrupted — in your download, on your disk, anywhere — your node would refuse to run. Seventeen years on, every node still verifies block zero before it verifies anything else. That hash is what you\'re about to recompute.',
      ],
      annotationsOpen: true,
      annotations: [
        {
          lines: 'L158',
          text: 'The four numbers: time `1231006505`, nonce `2,083,236,893`, bits `0x1d00ffff` (Quest #6\'s target encoding), version 1 — plus the 50 BTC reward.',
        },
        { lines: 'L159', text: 'Hash the freshly built block — double SHA-256 over the 80-byte header.' },
        { lines: 'L160', text: 'The check: if the result isn\'t `000000000019d668…`, the program refuses to start.' },
        { lines: 'L161', text: 'Same deal for the merkle root — the block\'s single transaction is pinned too.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 158, endLine: 161 },
        language: 'cpp',
        lines: [
          {
            n: 158,
            text: '        genesis = CreateGenesisBlock(1231006505, 2083236893, 0x1d00ffff, 1, 50 * COIN);',
            highlight: true,
          },
          { n: 159, text: '        consensus.hashGenesisBlock = genesis.GetHash();' },
          {
            n: 160,
            text: '        assert(consensus.hashGenesisBlock == uint256{"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"});',
            highlight: true,
          },
          {
            n: 161,
            text: '        assert(genesis.hashMerkleRoot == uint256{"4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"});',
          },
        ],
      },
    },
    {
      id: 'raw-bytes',
      title: 'The developers left you the raw bytes — and a confession',
      takeaway:
        'Above the builder sits a printout of the finished block: the coinbase bytes with the headline inside (you\'ll decode them next) — and a strange confession: **the first 50 BTC can never be spent.**',
      prose: [
        'Read lines 59–61 slowly. Satoshi\'s code never entered the genesis reward into the database of spendable coins — so the network\'s very first 50 BTC are frozen forever. Bug or symbolism? Nobody knows. But it\'s enforced by every node, it\'s why the true supply runs *below* even Quest #1\'s schedule, and it matters again in Quest #9 when you make your own node count every coin in existence.',
        'And that long hex string on line 65? That\'s not decoration — it\'s the genesis coinbase input, byte for byte. Somewhere in there, `54 68 65` spells "The". In the finale, your browser decodes the whole thing.',
      ],
      annotations: [
        { lines: 'L59–61', text: 'The confession: the genesis output "cannot be spent." Remember this when Quest #9 counts the coins.' },
        { lines: 'L63', text: '`hash=000000000019d6` — the value from the Stop 3 assert, and the target of your recomputation.' },
        { lines: 'L65', text: 'The raw coinbase. Its last 69 bytes are ASCII — the headline, hiding in plain hex.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 58, endLine: 68 },
        language: 'cpp',
        lines: [
          { n: 58, text: '/**' },
          { n: 59, text: ' * Build the genesis block. Note that the output of its generation', highlight: true },
          { n: 60, text: ' * transaction cannot be spent since it did not originally exist in the', highlight: true },
          { n: 61, text: ' * database.', highlight: true },
          { n: 62, text: ' *' },
          {
            n: 63,
            text: ' * CBlock(hash=000000000019d6, ver=1, hashPrevBlock=00000000000000, hashMerkleRoot=4a5e1e, nTime=1231006505, nBits=1d00ffff, nNonce=2083236893, vtx=1)',
          },
          { n: 64, text: ' *   CTransaction(hash=4a5e1e, ver=1, vin.size=1, vout.size=1, nLockTime=0)' },
          {
            n: 65,
            text: ' *     CTxIn(COutPoint(000000, -1), coinbase 04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73)',
            highlight: true,
          },
          { n: 66, text: ' *     CTxOut(nValue=50.00000000, scriptPubKey=0x5F1DF16B2B704C8A578D0B)' },
          { n: 67, text: ' *   vMerkleTree: 4a5e1e' },
          { n: 68, text: ' */' },
        ],
      },
    },
  ],
  finale: {
    title: 'Recompute the most famous hash on Earth',
    takeaway:
      'Your browser will now assemble the 80-byte header from the four numbers you just read — flipping each one to **little-endian**, the byte order Bitcoin actually serializes — hash it twice with SHA-256, and compare the result against the assert on line 160. Then it decodes the headline straight out of the coinbase bytes.',
    runnerId: 'genesis-hash',
    translation: {
      ref: { file: 'this page · faithful JavaScript translation', startLine: 1, endLine: 10 },
      language: 'ts',
      lines: [
        { n: 1, text: 'function buildGenesisHeader() {' },
        { n: 2, text: '  return leHex(1, 4)                 // nVersion' },
        { n: 3, text: "    + '00'.repeat(32)                // hashPrevBlock — SetNull()" },
        { n: 4, text: '    + reverseBytes(MERKLE_ROOT)      // hashMerkleRoot' },
        { n: 5, text: '    + leHex(1231006505, 4)           // nTime' },
        { n: 6, text: '    + leHex(0x1d00ffff, 4)           // nBits' },
        { n: 7, text: '    + leHex(2083236893, 4);          // nNonce' },
        { n: 8, text: '}' },
        { n: 9, text: 'const hash = reverseBytes(sha256(sha256(header)));' },
        { n: 10, text: "// must equal '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'" },
      ],
    },
    note: "Runs entirely in your browser with WebCrypto's SHA-256 — the same function every mining rig runs. If this page had altered even one byte of the four numbers, the hash would shatter into something unrecognizable. That's the point.",
  },
  recap: {
    items: [
      {
        text: '**Block zero carries that day\'s newspaper headline** — proof the chain wasn\'t pre-mined, preserved by every node forever.',
        cite: 'chainparams.cpp:71',
      },
      {
        text: '**The genesis block is built from the same parts as every block** — its only privilege is a parent pointer of all zeros.',
        cite: 'chainparams.cpp:53',
      },
      {
        text: '**Every node re-checks the genesis hash at every startup** — an assert, not a comment.',
        cite: 'chainparams.cpp:160',
      },
      {
        text: '**The first 50 BTC are unspendable forever** — which is why the measured supply runs below even the schedule you verified in Quest #1.',
        cite: 'chainparams.cpp:59',
      },
      {
        text: '**You recomputed 000000000019d668… yourself** — from four numbers, two SHA-256 passes, and one byte-order flip. No archive, no authority, just arithmetic.',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. You just did something quietly profound: reproduced a seventeen-year-old artifact from first principles and proved no one has ever altered it. One quest remains — stop reading history and start enforcing it: run your own node.",
  },
};
