import type { Quest } from './types.js';
import { BITCOIN_PIN } from './excerpts.js';

/**
 * Quest #10: What is an address, actually?
 *
 * The everyday-object quest: the bc1 string every pleb has copy-pasted a
 * hundred times, revealed as a re-spelling of Quest #3's lock: network
 * tag, 32-letter alphabet, and a checksum with a mathematically proven
 * typo guarantee. Finale: x-ray any address, then break it on purpose.
 *
 * Every excerpt is VERBATIM from Bitcoin Core at the pinned commit; the
 * BITCOIN_SRC test diffs every line against the real source.
 */
export const quest10: Quest = {
  id: 'quest-10',
  slug: 'what-is-an-address',
  number: 10,
  kicker: "Don't trust. Verify.",
  track: 'Advanced',
  title: 'What is an address, actually?',
  summary:
    'You\'ve copy-pasted bc1q… strings a hundred times. They\'re not accounts, and coins never "sit" at them. X-ray the spelling: the network tag, the 32-letter alphabet, and checksum math that catches every typo. Then break one on purpose.',
  duration: '10 min',
  pin: BITCOIN_PIN,
  story: {
    stage: "spelled for humans",
    text: "One rewound detail: how did Ana know where to send? Bo texted her an address, which you now know is his lock spelled in 42 letters with a checksum. Had she mistyped even one, nothing would have moved. That's why.",
  },
  intro: [
    'Quest #3 showed you that your coins are **locked boxes**, and Quest #9\'s node counted every box in existence. So what\'s an *address*? When someone "sends you bitcoin," their wallet builds a new box locked to you, and the address is simply **the recipe for your lock, spelled so a human can carry it**: over a phone call, in a QR code, on a napkin.',
    'That spelling problem is harsher than it looks. One wrong character in a plain bank account number can wire money to a stranger. Bitcoin has no fraud department to call afterward, so the address format itself has to make a typo *arithmetically impossible to miss*. This quest reads that machinery: the encoder, the network tag, the alphabet, and a checksum the developers back with a mathematical guarantee.',
  ],
  promise:
    "Every snippet below is copied verbatim from the Bitcoin Core source, pinned to commit [18c05d9](https://github.com/bitcoin/bitcoin/commit/18c05d93016b28a9afd4c716dfe00b6e0accb30b). Don't trust this page either: every stop links to the same lines on GitHub so you can check we didn't edit a word.",
  stops: [
    {
      id: 'respelled-lock',
      viz: 'address-pipeline',
      title: 'An address is a spelling of a lock, not a place',
      takeaway:
        'Here is the whole recipe for a modern address: take the 20-byte hash of your public key (Quest #3), put a version number in front, regroup the bits, spell it in bech32 with the network\'s prefix. **The address IS the lock, re-spelled for humans.**',
      prose: [
        'Notice what this function does *not* do: contact the network, register anything, check availability. Generating an address is pure local arithmetic, which is why your wallet can mint unlimited fresh ones, offline, forever, and none of them "exist" anywhere until someone pays them.',
        'When a sender types your address, their wallet runs this recipe **backwards**: unspell the letters, recover the 20 bytes, and build the exact `scriptPubKey` lock from Quest #3 into a new box. The address was never money, never an account: just instructions for building your lock, with spell-checking built in.',
      ],
      annotationsOpen: true,
      annotations: [
        { lines: 'L47', text: 'The witness version, `0`. After `bc1`, this becomes the letter `q`, which is why most addresses you meet start `bc1q`.' },
        { lines: 'L49', text: 'Regroup the hash\'s 8-bit bytes into 5-bit pieces, because the alphabet at Stop 3 has exactly 32 letters, and 2⁵ = 32.' },
        { lines: 'L50', text: 'Spell it: network prefix + data + BECH32 checksum. All three parts are on screen in the finale.' },
      ],
      excerpt: {
        ref: { file: 'src/key_io.cpp', startLine: 45, endLine: 51 },
        language: 'cpp',
        lines: [
          { n: 45, text: '    std::string operator()(const WitnessV0KeyHash& id) const', highlight: true },
          { n: 46, text: '    {' },
          { n: 47, text: '        std::vector<unsigned char> data = {0};', highlight: true },
          { n: 48, text: '        data.reserve(33);' },
          { n: 49, text: '        ConvertBits<8, 5, true>([&](unsigned char c) { data.push_back(c); }, id.begin(), id.end());' },
          { n: 50, text: '        return bech32::Encode(bech32::Encoding::BECH32, m_params.Bech32HRP(), data);', highlight: true },
          { n: 51, text: '    }' },
        ],
      },
    },
    {
      id: 'network-tag',
      myth: {
        belief: "An address is like an account number that the network registers to me.",
        reality: "Nothing is registered anywhere, ever. An address is a spelling of a lock that your wallet invents offline; the network first learns it exists when someone pays it. That is why wallets can mint unlimited fresh addresses without asking anyone.",
      },
      title: 'Why bc1, and where the old 1… and 3… addresses come from',
      takeaway:
        'Same file as the halving interval from Quest #1: the mainnet identity card. The legacy prefixes that make old addresses start with **1** or **3** are set here, and line 182 is the two letters in front of **every modern address on Earth**.',
      prose: [
        'Three generations of spelling, one paragraph of code. Addresses starting with `1` are the oldest style (a version byte of 0 in an alphabet called base58); `3` marks script-hash addresses (version byte 5); and `bc` is the *human-readable part* of the modern bech32 style: `bc1` + data. Your wallet still understands all three; they\'re different spellings of the same idea: a lock, encoded.',
        'The prefix is not decoration; it\'s **inside the checksum**. Testnet (Bitcoin\'s play-money network) uses `tb` instead, and because the prefix participates in the Stop 4 math, a testnet address fails validation on mainnet instantly. The error text in `key_io.cpp` spells it out: *"expected bc, got tb."* There is no registry of addresses anywhere on the planet: only prefixes, arithmetic, and Quest #4\'s rule that every node checks everything.',
      ],
      annotations: [
        { lines: 'L176', text: 'Version byte 0 → the base58 spelling starts with `1`. Satoshi-era addresses live here.' },
        { lines: 'L177', text: 'Version byte 5 → addresses starting with `3` (pay-to-script-hash, 2012).' },
        { lines: 'L182', text: 'The modern prefix. Two bytes of code, in front of every bc1 address in existence.' },
      ],
      excerpt: {
        ref: { file: 'src/kernel/chainparams.cpp', startLine: 176, endLine: 182 },
        language: 'cpp',
        lines: [
          { n: 176, text: '        base58Prefixes[PUBKEY_ADDRESS] = std::vector<unsigned char>(1,0);', highlight: true },
          { n: 177, text: '        base58Prefixes[SCRIPT_ADDRESS] = std::vector<unsigned char>(1,5);', highlight: true },
          { n: 178, text: '        base58Prefixes[SECRET_KEY] =     std::vector<unsigned char>(1,128);' },
          { n: 179, text: '        base58Prefixes[EXT_PUBLIC_KEY] = {0x04, 0x88, 0xB2, 0x1E};' },
          { n: 180, text: '        base58Prefixes[EXT_SECRET_KEY] = {0x04, 0x88, 0xAD, 0xE4};' },
          { n: 181, text: '' },
          { n: 182, text: '        bech32_hrp = "bc";', highlight: true },
        ],
      },
    },
    {
      id: 'alphabet',
      title: 'A 32-letter alphabet with no 1, b, i, or o',
      takeaway:
        'Count the letters: exactly 32, so each carries exactly 5 bits. Four characters are banished on purpose: **1, b, i, o**, the ones humans mistake for l, 6, l and 0. The alphabet itself is typo defense, before any mathematics runs.',
      prose: [
        'This single line is why you\'ll never agonize over `0` versus `O` in a bitcoin address again: the confusable characters simply aren\'t in the language. (The `1` right after `bc` isn\'t data; it\'s the separator between prefix and data, and it can\'t be confused with anything *because* the alphabet contains no other `1`.)',
        'Two more rules complete the spelling. An address is valid in all-lowercase or all-UPPERCASE but **never mixed**, which eliminates one more class of transcription error. And the first data letter you\'ll usually see, `q`, is this alphabet\'s spelling of the number 0: the witness version from Stop 1, hiding in plain sight.',
      ],
      annotations: [
        { lines: 'L23', text: '32 characters, 5 bits each. Your entire address is one large number, written in base 32.' },
      ],
      excerpt: {
        ref: { file: 'src/bech32.cpp', startLine: 22, endLine: 23 },
        language: 'cpp',
        lines: [
          { n: 22, text: '/** The Bech32 and Bech32m character set for encoding. */' },
          { n: 23, text: 'const char* CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";', highlight: true },
        ],
      },
    },
    {
      id: 'checksum',
      quiz: [
        {
          question: "What does the bech32 checksum mathematically guarantee?",
          options: [
          "Nobody can steal from the address",
          "Up to 4 typos in an address are always detected",
          "The address can only be used once",
          ],
          answer: 1,
          explain: "The BCH code behind PolyMod guarantees detection of up to 4 character errors within 89 characters, and no address is longer than 62. Security of the coins is a separate machine entirely: the lock and signature from Quest #3.",
        },
      ],
      title: 'The checksum: a mathematical promise that typos get caught',
      takeaway:
        'The last six letters of every address are a checksum, and this comment states its power **like a law**. The code is guaranteed to detect up to 3 errors in any 1,023 characters. It was hand-picked to guarantee **4 errors caught within 89 characters**. A bc1q address is 42 characters, and even the longest taproot addresses, at 62, sit well inside the window.',
      prose: [
        'You don\'t need the Galois-field algebra (nobody\'s quizzing you); you need the *contract* in the last three highlighted lines. This isn\'t "we probably notice typos." It\'s a proven property of a BCH code, chosen from many candidates specifically to over-deliver on short strings like addresses. Mistype one, two, three, even four characters of a bc1 address, and validation **cannot** come out clean.',
        'Every wallet on Earth runs this polynomial before letting you send: the six-letter checksum must come out exact, and the network prefix and every data letter feed into it. And in this site\'s honesty tradition: with *five or more* simultaneous errors the guarantee lapses, and a corrupted address slips through with odds of about one in a billion (2³⁰). Even the fine print here comes quantified. In the finale, you\'ll try to sneak a typo past it yourself.',
      ],
      annotations: [
        { lines: 'L127–29', text: 'The contract: compute what to fold into the final 6 letters so the address\'s polynomial lands exactly on its target constant.' },
        { lines: 'L138–39', text: 'The actual polynomial: six magic coefficients, chosen with a purpose.' },
        { lines: 'L140–42', text: 'The guarantee, in the developers\' own words: a BCH code, hand-selected so 4 errors within 89 characters can never hide.' },
      ],
      excerpt: {
        ref: { file: 'src/bech32.cpp', startLine: 127, endLine: 142 },
        language: 'cpp',
        lines: [
          { n: 127, text: '/** This function will compute what 6 5-bit values to XOR into the last 6 input values, in order to', highlight: true },
          { n: 128, text: ' *  make the checksum 0. These 6 values are packed together in a single 30-bit integer. The higher' },
          { n: 129, text: ' *  bits correspond to earlier values. */' },
          { n: 130, text: 'uint32_t PolyMod(const data& v)' },
          { n: 131, text: '{' },
          { n: 132, text: '    // The input is interpreted as a list of coefficients of a polynomial over F = GF(32), with an' },
          { n: 133, text: '    // implicit 1 in front. If the input is [v0,v1,v2,v3,v4], that polynomial is v(x) =' },
          { n: 134, text: '    // 1*x^5 + v0*x^4 + v1*x^3 + v2*x^2 + v3*x + v4. The implicit 1 guarantees that' },
          { n: 135, text: '    // [v0,v1,v2,...] has a distinct checksum from [0,v0,v1,v2,...].' },
          { n: 136, text: '' },
          { n: 137, text: '    // The output is a 30-bit integer whose 5-bit groups are the coefficients of the remainder of' },
          { n: 138, text: '    // v(x) mod g(x), where g(x) is the Bech32 generator,' },
          { n: 139, text: '    // x^6 + {29}x^5 + {22}x^4 + {20}x^3 + {21}x^2 + {29}x + {18}. g(x) is chosen in such a way' },
          { n: 140, text: '    // that the resulting code is a BCH code, guaranteeing detection of up to 3 errors within a', highlight: true },
          { n: 141, text: '    // window of 1023 characters. Among the various possible BCH codes, one was selected to in', highlight: true },
          { n: 142, text: '    // fact guarantee detection of up to 4 errors within a window of 89 characters.', highlight: true },
        ],
      },
    },
  ],
  finale: {
    title: 'X-ray an address, then break it on purpose',
    takeaway:
      'Paste any bc1 address (or keep the textbook one). Your browser splits it into **prefix · version · program · checksum**, rebuilds Quest #3\'s lock from the letters, then, on your command, plants a typo and lets the checksum slam the door.',
    runnerId: 'address-xray',
    translation: {
      ref: { file: 'this page · faithful JavaScript translation', startLine: 1, endLine: 13 },
      language: 'ts',
      lines: [
        { n: 1, text: 'function polyMod(values) {          // bech32.cpp:130' },
        { n: 2, text: '  let c = 1;' },
        { n: 3, text: '  for (const v of values) {' },
        { n: 4, text: '    const c0 = c >>> 25;' },
        { n: 5, text: '    c = ((c & 0x1ffffff) << 5) ^ v;' },
        { n: 6, text: '    if (c0 & 1)  c ^= 0x3b6a57b2;' },
        { n: 7, text: '    if (c0 & 2)  c ^= 0x26508e6d;' },
        { n: 8, text: '    if (c0 & 4)  c ^= 0x1ea119fa;' },
        { n: 9, text: '    if (c0 & 8)  c ^= 0x3d4233dd;' },
        { n: 10, text: '    if (c0 & 16) c ^= 0x2a1462b3;' },
        { n: 11, text: '  }' },
        { n: 12, text: '  return c;                        // must land exactly on 1' },
        { n: 13, text: '}' },
      ],
    },
    note: 'The default is the textbook address from BIP-173, the segwit address-format spec (no real person\'s wallet). This page\'s decoder is tested against the official BIP-173/350 vectors, including a sweep proving all ~1,300 possible single-character typos of that address get caught.',
  },
  recap: {
    tryIt:
      "Next time you're about to paste an address, change one character on purpose and watch the wallet refuse it. Undo, paste clean, send. Ten seconds, and you've watched the checksum guard your money.",
    items: [
      {
        text: '**An address is a re-spelling of a lock**: version + key-hash + checksum. Nothing is registered anywhere; senders rebuild the lock from the letters.',
        cite: 'key_io.cpp:45',
      },
      {
        text: '**The prefixes are network identity**: legacy 1… and 3… bytes, and the bc that starts every modern address, all set beside Quest #1\'s halving interval.',
        cite: 'chainparams.cpp:182',
      },
      {
        text: '**The 32-letter alphabet bans the confusable characters**: no 1, b, i, or o, and never mixed case.',
        cite: 'bech32.cpp:23',
      },
      {
        text: '**The checksum\'s guarantee is proven, not hoped**: up to 4 errors in 89 characters cannot escape detection, and no address is longer than 62.',
        cite: 'bech32.cpp:140',
      },
      {
        text: '**You sabotaged an address and the math caught it instantly**: the same check every wallet runs before it lets anyone press send.',
      },
    ],
    closing:
      "**Keep verifying:** every excerpt links to the identical lines on GitHub at the pinned commit. And carry this one home: coins never \"go to\" an address; they sit in boxes on every node's disk, and the address was only ever the spelling of the lock. Reuse tells the whole world those boxes belong together, so let your wallet hand out a fresh one each time. It can mint them forever, and now you know why.",
  },
  feynman: {
    prompt: "Explain what an address is, in two sentences.",
    model:
      "An address is not an account: it is the recipe for a lock, spelled in a 32-letter alphabet with a checksum that mathematically catches up to four typos. Your wallet invents them offline for free, and the network first hears of one when somebody pays it.",
  },
};
