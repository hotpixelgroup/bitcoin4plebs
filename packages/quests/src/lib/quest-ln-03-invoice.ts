import type { Quest } from './types.js';
import { BOLTS_PIN } from './excerpts.js';

/**
 * Lightning Quest #3: the invoice. The first Lightning object most people
 * actually touch, and the one nobody explains — an lnbc string is a
 * *request*, signed, with a hash of a secret at the centre of it.
 */
export const questLn03: Quest = {
  id: 'quest-ln-03',
  site: 'lightning',
  slug: 'what-is-an-invoice',
  number: 3,
  kicker: "Don't trust. Verify.",
  track: 'Money in motion',
  title: 'What is an invoice, actually?',
  summary:
    'That wall of lnbc characters is the thing you actually paste, and it is readable. Decode a real one field by field — amount, expiry, and the hash of a secret that turns paying into proof.',
  duration: '10 min',
  pin: BOLTS_PIN,
  story: {
    stage: 'the request',
    text: "Mira's beans come from Ines, who roasts two towns over. The sack is 180,000 sats and Ines would rather not wait for a bank. So she sends Mira a string beginning lnbc — 400-odd characters that look like someone sat on a keyboard. It is not gibberish and it is not an address. It is an invoice: an amount, a deadline, a way to find her, and a hash whose secret only Ines knows.",
  },
  intro: [
    "Almost everything about Lightning that confuses newcomers is compressed into this one object. People call it 'a Lightning address', which it is not — an address is reusable and passive, an invoice is single-use and *asks* for something specific. People assume it is opaque, which it is not: it is a checksummed, structured, self-describing document, and you are about to read one.",
    "And at its centre sits the single most elegant idea in the protocol: a **hash**. Not a bank reference, not an order id. Ines invents a random secret, hashes it, and puts the hash in the invoice. Whoever ends up holding that secret can prove the payment happened, to anyone, forever. Quest #4 shows how that hash makes strangers safe to route through. This quest is about reading it.",
  ],
  promise:
    "Every snippet below is copied verbatim from the Lightning specifications at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8). The finale decodes the specification's own published example invoices — and any real invoice you care to paste — entirely in your browser.",
  stops: [
    {
      id: 'not-an-address',
      title: "It isn't an address, and the difference matters",
      takeaway:
        "A Bitcoin address is a standing invitation: reusable, passive, and it says nothing about how much. A Lightning invoice is a specific request: one amount, one purpose, one deadline, one secret — and paying it twice is not a thing you can do.",
      myth: {
        belief: "A Lightning invoice is just my Lightning address, like a bitcoin address.",
        reality:
          "Invoices are single-use by construction. The hash at the centre of one commits to a secret; once that secret is revealed by the first payment, a second payment against the same invoice is either rejected or, worse, given away for free — anyone who saw the first one already knows the secret. This is why wallets generate a fresh invoice every time you tap 'receive', and it is also why the reusable thing people actually want came later, as a separate object (BOLT #12 offers).",
      },
      contrastLabels: { left: 'A Bitcoin address', right: 'A Lightning invoice' },
      contrast: [
        { aspect: 'How many times', bank: 'As many as you like', bitcoin: 'Once. The secret is spent with it' },
        { aspect: 'Amount', bank: 'Not part of it', bitcoin: 'Usually fixed, and signed over' },
        { aspect: 'Lifetime', bank: 'Forever', bitcoin: 'Expires — one hour by default' },
        { aspect: 'What proves payment', bank: 'A confirmed transaction anyone can look up', bitcoin: 'A secret only the payer ends up holding' },
      ],
      prose: [
        "Read the two columns and the design falls out. An address is a place. An invoice is a *contract offer*: this much, for this, before then, and here is my signature over all of it so you know it wasn't tampered with in transit.",
        "That last part matters more than it sounds. Nothing about Lightning stops someone intercepting an invoice as it travels from Ines to Mira over email or chat. What stops them editing it is that every field is covered by a signature — and, more prosaically, that every character is covered by a checksum. Change one letter and the whole thing stops decoding, which the finale will let you prove.",
      ],
    },
    {
      id: 'the-shape',
      title: 'A tagged, self-describing document',
      takeaway:
        "The data part is a stream of **tagged fields**: a 5-bit type, a 10-bit length, then that many 5-bit groups of data. Because every field announces its own length, a decoder can skip fields it has never heard of — which is how the format grows without breaking old wallets.",
      quiz: [
        {
          question: 'Why does every tagged field carry its own length?',
          options: [
            'To make the invoice shorter',
            'So a decoder can skip fields it does not recognise and still read the rest',
            'Because bech32 requires it',
          ],
          answer: 1,
          explain:
            "This is the same trick that keeps most long-lived formats alive. A wallet written in 2018 meets an invoice using a field invented in 2024: without lengths it would be lost at the first unknown byte, but with them it steps over the field and carries on. Extensibility is a property you have to design in at the start, and BOLT #11 did.",
        },
      ],
      prose: [
        "Three numbers per field. The **type** is one bech32 character — `p` for payment hash, `d` for description, `x` for expiry — which is why the spec talks about fields by letter. The **length** is ten bits, so a field can hold at most 1023 groups of 5 bits, or 639 bytes. Then the data itself.",
        "It is worth noticing what is *not* here. There is no version number, no field ordering requirement, no fixed layout. The format is a bag of self-describing items, and a decoder is a loop. That is why the decoder this site runs is a couple of hundred lines rather than a couple of thousand.",
      ],
      annotations: [
        { lines: 'L138', text: 'Ten bits of length, big-endian — the reason unknown fields are skippable rather than fatal.' },
        { lines: 'L139', text: 'The data itself, counted in 5-bit groups because bech32 works in 5-bit groups.' },
        { lines: 'L141', text: 'The consequence: 639 bytes is the ceiling for any one field.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '11-payment-encoding.md', startLine: 137, endLine: 141 },
        language: 'text',
        lines: [
          { n: 137, text: '1. `type` (5 bits)' },
          { n: 138, text: '1. `data_length` (10 bits, big-endian)', highlight: true },
          { n: 139, text: '1. `data` (`data_length` x 5 bits)', highlight: true },
          { n: 140, text: '' },
          { n: 141, text: 'Note that the maximum length of a Tagged Field\'s `data` is constricted by the maximum value of `data_length`. This is 1023 x 5 bits, or 639 bytes.' },
        ],
      },
    },
    {
      id: 'the-hash',
      title: 'The hash at the centre',
      takeaway:
        "One line of the specification carries the whole idea: *Preimage of this provides proof of payment.* The payee invents a secret, publishes only its hash, and hands the secret over exactly when paid. Holding it afterwards is a receipt nobody can forge or revoke.",
      annotationsOpen: true,
      quiz: [
        {
          question: 'Ines invents a secret, hashes it, and puts the hash in her invoice. What does Mira end up holding after paying?',
          options: [
            'A transaction id she can look up on a block explorer',
            "The secret itself — which only Ines knew, and which hashes to the number in the invoice Ines signed",
            "A confirmation message from Ines's node",
          ],
          answer: 1,
          explain:
            "That combination is the receipt. Ines signed an invoice saying 'pay 180,000 sats for one sack of beans, hash = X'. Mira can show the secret that hashes to X. Only Ines could have produced it, and she only produces it on payment. No third party, no dispute process, no chain lookup — just arithmetic anyone can check.",
        },
      ],
      prose: [
        "`p` is the payment hash: 256 bits of SHA-256 output. The sentence after it is doing enormous work. **Preimage of this provides proof of payment** — a preimage being the input that produces a given hash.",
        "Think about what that buys. Mira pays and comes away holding a number. That number, plus the invoice Ines signed, is a proof: *the person who signed this invoice released this secret, and they only release it when paid.* It needs no block explorer, no receipt email, no trusted third party. It is the strongest payment receipt in ordinary use anywhere, and it falls out of one hash.",
        "Then look at `s`, the payment secret, whose stated purpose is to prevent *forwarding nodes from probing the payment recipient*. A hop in the middle could otherwise try paying a guessed hash to see what happens. The payment secret means a hop cannot construct a valid final payload without having seen the invoice, so probing fails. Small field, and it closes a real attack.",
        "And `d` — the description — is UTF-8 text, which is why the specification's own examples include 'ナンセンス 1杯'. The finale decodes that one, unmangled.",
      ],
      annotations: [
        { lines: 'L145', text: "The whole receipt system in one sentence: the preimage of this hash proves the payment happened." },
        { lines: 'L146', text: 'The payment secret: without it, a node on the route could probe by guessing.' },
        { lines: 'L147', text: 'Plain UTF-8 text, which is why the spec\'s own example is in Japanese.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '11-payment-encoding.md', startLine: 145, endLine: 147 },
        language: 'text',
        lines: [
          { n: 145, text: '* `p` (1): `data_length` 52. 256-bit SHA256 payment_hash. Preimage of this provides proof of payment.', highlight: true },
          { n: 146, text: '* `s` (16): `data_length` 52. This 256-bit secret prevents forwarding nodes from probing the payment recipient.' },
          { n: 147, text: '* `d` (13): `data_length` variable. Short description of purpose of payment (UTF-8), e.g. \'1 cup of coffee\' or \'ナンセンス 1杯\'' },
        ],
      },
    },
    {
      id: 'the-envelope',
      title: 'Why it is bech32, and why that was nearly free',
      takeaway:
        "The whole invoice is wrapped in **bech32** — the same checksummed alphabet Bitcoin addresses use, with the 90-character limit lifted. One mistyped character is caught by the checksum, not discovered later by a payment going somewhere strange.",
      prose: [
        "The specification is refreshingly plain about why: bech32 *can be simply reused for Lightning invoices*, and it admits the checksum is optimised for manual entry, which for a 400-character string is 'unlikely to happen often'. The honest reading is that reusing a well-analysed encoding beat inventing a new one, and the error detection came along for free.",
        "The practical payoff is the one you can test below. Bech32's checksum is designed to catch any small number of wrong characters, so a typo, a truncated copy-paste, or a character mangled by a chat client is caught *at decode time* rather than becoming a mystery. Paste a broken invoice into the finale and watch it refuse.",
        "There is a nice symmetry here for anyone who came from the Bitcoin site: the decoder running below reuses the very same bech32 implementation that site's address quest teaches you to break on purpose. One encoding, two layers, one checksum protecting both.",
      ],
      annotations: [
        { lines: 'L21–22', text: 'The same encoding as segwit addresses, reused deliberately rather than reinvented.' },
        { lines: 'L23–26', text: "A candid admission: the checksum was designed for typing by hand, which nobody does with a 400-character invoice. The error detection is useful anyway." },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '11-payment-encoding.md', startLine: 21, endLine: 26 },
        language: 'text',
        lines: [
          { n: 21, text: 'The format for a Lightning invoice uses' },
          { n: 22, text: '[bech32 encoding](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki),', highlight: true },
          { n: 23, text: 'which is already used for Bitcoin Segregated Witness. It can be' },
          { n: 24, text: 'simply reused for Lightning invoices even though its 6-character checksum is optimized', highlight: true },
          { n: 25, text: 'for manual entry, which is unlikely to happen often given the length' },
          { n: 26, text: 'of Lightning invoices.' },
        ],
      },
    },
  ],
  finale: {
    title: 'Decode an invoice, field by field',
    takeaway:
      "Take the specification's own published examples apart in your browser — amount, timestamp, expiry, payment hash, description — then break one on purpose and watch the checksum catch it. Paste a real invoice of your own if you have one; nothing leaves this page.",
    runnerId: 'invoice-decoder',
    note: "The decoder is this site's own TypeScript, reusing the bech32 implementation from the Bitcoin curriculum. Every example offered here is read from BOLT #11's own Examples section at the pinned commit, and CI decodes all of them on every change — including the Japanese description and the open-amount donation invoice.",
  },
  recap: {
    tryIt:
      "Open your own wallet, tap receive, and ask for a specific amount with a description. Then copy the invoice into the decoder above and read your own request back: the amount you typed, the description you typed, the expiry your wallet chose without asking, and a payment hash your wallet invented seconds ago. It is your invoice — you may as well be able to read it.",
    items: [
      {
        text: '**An invoice is a request, not an address**: one amount, one purpose, one deadline, and single-use by construction.',
      },
      {
        text: '**Tagged fields carry their own lengths**, so a decoder can skip what it does not recognise and the format can grow without breaking old wallets.',
        cite: '11-payment-encoding.md:138',
      },
      {
        text: "**The payment hash is the receipt system.** The specification says it outright: the preimage of that hash *provides proof of payment*.",
        cite: '11-payment-encoding.md:145',
      },
      {
        text: '**It is bech32**, the same checksummed alphabet as segwit addresses, so a mistyped character fails loudly at decode time instead of quietly later.',
        cite: '11-payment-encoding.md:22',
      },
    ],
    closing:
      "**Keep verifying.** You can now read the object every Lightning payment starts from, and you read it with a decoder whose homework the specification marks on every change. One question is still open, and it is the big one: Mira has no channel with Ines. How does a payment cross people who have never met, without any of them being able to steal it? The hash you just met is the answer.",
  },
  feynman: {
    prompt: 'Explain to a friend what the long lnbc string actually contains, and why paying it gives you a receipt nobody can forge.',
    model:
      "It is a signed request: how much, what for, when it expires, how to reach the payee, and — at the centre — the hash of a random secret the payee just invented. Because the payee signed the whole thing, nobody can alter it in transit, and because it is bech32-encoded, a single mistyped character fails the checksum instead of quietly sending money somewhere wrong. Paying it is what makes the payee release the secret, so afterwards you hold a number that hashes to the one in their signed invoice — which only they could have produced, and only in exchange for being paid.",
  },
};
