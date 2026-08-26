import type { Quest } from './types.js';
import { BOLTS_PIN } from './excerpts.js';

/**
 * Lightning Quest #5: sphinx. The closing move of the spine — a packet
 * that never changes size, so no hop can tell how far along it is. The
 * finale reproduces the specification's own onion test vector byte for
 * byte, in the reader's browser.
 */
export const questLn05: Quest = {
  id: 'quest-ln-05',
  site: 'lightning',
  slug: 'who-paid-whom',
  number: 5,
  kicker: "Don't trust. Verify.",
  track: 'Routing',
  title: "Why can't anyone see who paid whom?",
  summary:
    'Every hop must learn where to send the payment next — and nothing else. The onion that makes that possible, why it is always exactly 1,366 bytes, and an honest account of what it does not protect.',
  duration: '13 min',
  pin: BOLTS_PIN,
  story: {
    stage: 'the envelope',
    text: "The hub forwarded Mira's 180,000 sats to Ines and kept a few sats for the trouble. What the hub does not know is that Mira sent it, or that Ines received it, or that the payment was for coffee beans. It knows it took money from one neighbour and gave it to another. Everything else it handled was sealed, and stayed sealed, and was exactly the same size going out as coming in.",
  },
  intro: [
    "Quest #4 left the hub holding a 1,366-byte packet it could not read. That packet is the reason routing does not destroy your privacy, and it deserves a quest of its own — not least because it is the one piece of Lightning where you can check the cryptography yourself, exactly, against numbers the specification publishes.",
    "Start with what the hub *must* learn, because privacy designs live or die on this question. To forward a payment, the hub has to know which channel to send it out of and how much. That is unavoidable. The design question is whether it learns anything *beyond* that — and the answer, with real caveats this quest will not skip, is remarkably close to no.",
  ],
  promise:
    "Every snippet below is copied verbatim from the Lightning specifications at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8). The finale builds BOLT #4's own published test onion in your browser and requires a byte-for-byte match before it will claim anything.",
  stops: [
    {
      id: 'what-a-hop-must-know',
      title: 'What a hop must know, and what it must not',
      takeaway:
        "A forwarding node needs exactly two things: which neighbour to pass this to, and how much. Anything more — who started the payment, who ends it, how long the route is, where in it you are — is information the design deliberately withholds.",
      myth: {
        belief: 'Lightning is private because there is no public blockchain recording the payments.',
        reality:
          "Absence of a public record is necessary but nowhere near sufficient. If every routing node could see the full route, Lightning would simply have replaced one public ledger with a few dozen private ones held by whoever runs the biggest nodes — arguably worse, because you would not know who was watching. The privacy comes from a specific construction that makes each hop's knowledge deliberately, verifiably local. That construction is what this quest reads.",
      },
      prose: [
        "Think about what a naive design would leak. Put the route in a list, hand it to each hop, let each cross off its own entry: now every hop sees the sender, the recipient, and its own position. One well-placed node learns everything.",
        "Pad the list, then, and encrypt each entry to its own hop. Better — but the packet gets *shorter* as it travels, because each hop removes its layer. Measure the packet and you know how far along you are. A hop receiving a very short packet knows it is near the end; near the end means close to the recipient.",
        "So the requirement is sharper than 'encrypt it'. The packet must be **the same size at every hop**, and must look like uniform noise to anyone but the hop it is addressed to. That is what the next stop specifies.",
      ],
    },
    {
      id: 'always-1366',
      title: 'A packet that never changes size',
      viz: 'onion-peel',
      takeaway:
        "Four sections, and the middle one is the point: `hop_payloads` is **always 1,300 bytes**, whether the route is two hops or twenty. Each hop peels its own layer and re-pads what it forwards, so the size carries no information at all.",
      quiz: [
        {
          question: 'Why is the routing information always exactly 1,300 bytes, even for a two-hop route?',
          options: [
            'Because that is the largest a route can be',
            'Because a shrinking packet would tell each hop how far along the route it is',
            'To leave room for the payment description',
          ],
          answer: 1,
          explain:
            "Size is metadata. If the packet got smaller at each hop, a node could measure it and infer its position — and a node that knows it is the last hop knows it is talking to the recipient. Fixed size removes that channel entirely, at the cost of every payment carrying 1,300 bytes regardless of how short the route is. The privacy is worth more than the bandwidth.",
        },
      ],
      prose: [
        "A version byte, a 33-byte ephemeral public key, 1,300 bytes of routing information, and a 32-byte HMAC. 1,366 bytes total — the exact number you saw in `update_add_htlc` last quest.",
        "The ephemeral public key is what lets each hop derive a shared secret with the sender without any prior arrangement, using the same Diffie-Hellman idea Bitcoin's key math already gives you. Crucially, it is *blinded* at each hop: the key the hub sees is different from the key Ines sees, so two nodes comparing notes cannot tell they handled the same payment.",
        "The HMAC is what stops the packet being tampered with. A hop that alters so much as one byte of what it forwards will be caught by the next hop, because the HMAC covers the whole payload and only the sender could have computed it.",
        "And the 1,300 bytes: fixed, forever, deliberately wasteful. A two-hop payment carries the same 1,300 bytes as a twenty-hop one. That waste **is** the privacy.",
      ],
      annotations: [
        { lines: 'L142–43', text: 'The ephemeral key, blinded at every hop so two nodes cannot correlate the same payment.' },
        { lines: 'L144–45', text: 'Always 1,300 bytes. Each hop peels its layer and re-pads, so the size never changes.' },
        { lines: 'L146', text: 'The integrity check: alter one byte in transit and the next hop rejects the packet.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '04-onion-routing.md', startLine: 139, endLine: 146 },
        language: 'text',
        lines: [
          { n: 139, text: 'The packet consists of four sections:' },
          { n: 140, text: '' },
          { n: 141, text: ' - a `version` byte' },
          { n: 142, text: ' - a 33-byte compressed `secp256k1` `public_key`, used during the shared secret' },
          { n: 143, text: '   generation' },
          { n: 144, text: ' - a 1300-byte `hop_payloads` consisting of multiple, variable length,', highlight: true },
          { n: 145, text: '   `hop_payload` payloads' },
          { n: 146, text: ' - a 32-byte `hmac`, used to verify the packet\'s integrity', highlight: true },
        ],
      },
    },
    {
      id: 'the-claim',
      title: 'The claim, and the caveat the spec makes itself',
      takeaway:
        "The specification states the guarantee precisely: a hop cannot learn any node other than its immediate neighbours, nor the route's length, nor its own position. And then, in the same paragraph, it states the limit: none of this stops **traffic analysis**.",
      annotationsOpen: true,
      quiz: [
        {
          question: 'What does the hub learn about its own position in the route?',
          options: [
            'That it is the second of three hops',
            'Nothing — it cannot tell whether it is first, last, or somewhere in a much longer route',
            'Only whether it is the final hop',
          ],
          answer: 1,
          explain:
            "This is stronger than it first sounds. The hub cannot even tell whether Mira is the original sender or just another hop passing it along — so it cannot conclude that its own neighbour is the payer. The exception is genuine and worth knowing: the *final* hop does learn it is final, because the HMAC it would forward is all zeros. Everyone else is in the dark.",
        },
      ],
      prose: [
        "Read lines 14–16 slowly, because this is the actual guarantee rather than a marketing summary of it. A hop cannot learn *which other nodes are part of the route*. It cannot learn *the length of the route*. It cannot learn *its position within it*. Those three together are what make a routing node genuinely uninteresting to compromise.",
        "Then read lines 19–21, which the specification's authors wrote themselves and which most explanations of Lightning quietly omit: **this does not preclude the possibility of packet association by an attacker via traffic analysis.** Someone watching the network's timing and amounts — rather than its contents — can still make inferences. A payment of an unusual amount, arriving at one node and leaving another a moment later, correlates.",
        "That honesty is the right way round. The construction gives a strong, specific, checkable property, and the specification names the class of attack it does not address instead of pretending the property is total. A design that claimed to defeat traffic analysis with an onion would be lying to you.",
      ],
      annotations: [
        { lines: 'L14–16', text: "The guarantee, in the spec's own words: no other nodes, no route length, no position." },
        { lines: 'L17–19', text: 'And why: the packet is obfuscated at every hop, so packets from the same route share nothing correlatable.' },
        { lines: 'L20–21', text: "The limit, stated by the authors themselves. Timing and amounts are outside what an onion can hide." },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '04-onion-routing.md', startLine: 12, endLine: 21 },
        language: 'text',
        lines: [
          { n: 12, text: 'Intermediate nodes forwarding the message can verify the integrity of' },
          { n: 13, text: 'the packet and can learn which node they should forward the' },
          { n: 14, text: 'packet to. They cannot learn which other nodes, besides their', highlight: true },
          { n: 15, text: 'predecessor or successor, are part of the packet\'s route; nor can they learn', highlight: true },
          { n: 16, text: 'the length of the route or their position within it. The packet is', highlight: true },
          { n: 17, text: 'obfuscated at each hop, to ensure that a network-level attacker cannot' },
          { n: 18, text: 'associate packets belonging to the same route (i.e. packets belonging' },
          { n: 19, text: 'to the same route do not share any correlating information). Notice that this' },
          { n: 20, text: 'does not preclude the possibility of packet association by an attacker', highlight: true },
          { n: 21, text: 'via traffic analysis.', highlight: true },
        ],
      },
    },
    {
      id: 'honest-limits',
      title: 'What this does not protect',
      takeaway:
        "The onion protects the route. It does not hide you from your own first hop, it does not hide the recipient from their last, it does not stop a custodial wallet from seeing everything, and it does not defeat someone watching timing and amounts across many payments.",
      prose: [
        "**Your first hop knows you.** The node you have a channel with sees the payment leave you. It cannot tell whether you originated it or forwarded it — but if you are a phone wallet with one channel to one provider, that ambiguity is thin. Symmetrically, the recipient's last hop knows it is delivering to them.",
        "**A custodial wallet sees everything.** If a company holds your channels, no amount of onion routing helps: they are not a hop on your route, they *are* you, and they can see every payment you make and receive. This is the single largest privacy loss in practice, and it is a choice about which app you install rather than a property of the protocol.",
        "**The payment hash correlates hops.** The same hash appears at every hop along a route (Quest #4). Two nodes that both handled the payment and later compare notes can tell they were on the same route. This is a known weakness, and the fix — giving each hop a different hash — exists as *payment point* / PTLC work built on Schnorr signatures, not yet in wide deployment.",
        "**Amounts and timing leak.** A distinctive amount moving through the network at a distinctive moment is traceable by an observer with enough vantage points, exactly as the specification warns.",
        "None of this makes the onion pointless — quite the opposite. It means the onion does one job extremely well and the remaining exposure is elsewhere, mostly in choices you control: which wallet, how many channels, whether you run your own node. Knowing precisely where the protection ends is what lets you decide whether it is enough for you.",
      ],
    },
  ],
  finale: {
    title: "Build the specification's own onion, then peel it",
    takeaway:
      "Construct the exact 1,366-byte packet BOLT #4 publishes as its test vector — from this site's own dependency-free cryptography — and require a byte-for-byte match. Then walk it hop by hop and watch each node recover its own payload and nothing else.",
    runnerId: 'onion-lab',
    note: "The elliptic-curve math and the ChaCha20 stream cipher below are written from scratch in this site's own TypeScript, with no cryptography library. That is what makes the vector check meaningful: the specification's packet only comes out byte-identical if the curve arithmetic, the cipher, the four key derivations, the blinding chain and the filler accumulation are every one of them correct. There is no partial credit. The same check runs in CI on every change to this site.",
  },
  recap: {
    tryIt:
      "Look up how many channels your wallet actually has. If the answer is one, your privacy against your own provider is close to zero no matter how good the onion is — every payment you make leaves through that single door. If you care about this, more channels to more peers is the lever you personally control, and it costs nothing but on-chain fees to open them.",
    items: [
      {
        text: '**A hop must learn its next neighbour and the amount** — and the design withholds everything else by construction, not by policy.',
      },
      {
        text: '**The packet is always 1,366 bytes**, of which 1,300 are routing information, so its size reveals nothing about route length or position.',
        cite: '04-onion-routing.md:144',
      },
      {
        text: "**The guarantee is stated precisely**: no other nodes, no route length, no position — and the specification names traffic analysis as the limit in the same paragraph.",
        cite: '04-onion-routing.md:14',
      },
      {
        text: '**The remaining exposure is mostly yours to choose**: your first hop, a custodial wallet, and the shared payment hash that PTLCs are designed to fix.',
      },
    ],
    closing:
      "**Keep verifying.** You have now read a channel into existence, made cheating cost more than it pays, decoded the request that starts a payment, sent one across a stranger who could not steal it, and sealed it so that stranger learned almost nothing. Five quests, four specification documents, one node implementation, and — in the finale above — the specification's own test vectors reproduced by code you can read. There is nobody left in this story you have to take on faith.",
  },
  feynman: {
    prompt:
      'Explain to a friend how a Lightning payment can pass through several strangers without any of them learning who sent it or who received it.',
    model:
      "The sender wraps the instructions in layers, one per hop, each locked with a key only that hop can derive — so a hop opens exactly one layer, finds out who to pass the packet to, and sees nothing but noise beyond that. Crucially the packet is always the same size, because each hop re-pads what it forwards, so nobody can measure it and work out how far along the route they are or how long the route is. The honest limit is that your own first hop obviously knows you sent something, and anyone watching the timing and amounts across the whole network can still make guesses — the onion hides the contents and the structure, not the fact that traffic exists.",
  },
};
