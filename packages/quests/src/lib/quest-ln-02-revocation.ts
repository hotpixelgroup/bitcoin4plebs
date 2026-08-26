import type { Quest } from './types.js';
import { BOLTS_PIN, LND_PIN } from './excerpts.js';

/**
 * Lightning Quest #2. The best cryptography on this site: a key that two
 * people build together and neither can use alone, until one of them
 * hands over their half — which is exactly what accepting a payment costs.
 */
export const questLn02: Quest = {
  id: 'quest-ln-02',
  site: 'lightning',
  slug: 'why-cheating-fails',
  number: 2,
  kicker: "Don't trust. Verify.",
  track: 'The channel',
  title: "Why can't your counterparty cheat?",
  summary:
    'Everyone holds every old balance, and the older ones are better for somebody. The delay-or-punish script that makes publishing one financial suicide, and the two-part key that neither party can build alone.',
  duration: '12 min',
  pin: BOLTS_PIN,
  story: {
    stage: 'the promise',
    text: "Fifty coffees in, Tomas's side of the tab has drained from 200,000 sats to nothing much, and Mira's has filled up. Tomas still holds a perfectly valid, perfectly signed transaction from the morning they opened it — the one where all the money was his. He could broadcast it tonight. The chain would accept it: the signatures are real. Nothing about Lightning works unless something makes that a catastrophically bad idea.",
  },
  intro: [
    "Quest #1 left a hole big enough to drive a truck through. Every payment produces a new signed split, and nobody destroys the old ones — you *can't* destroy them, because your counterparty holds their own copy. So both people are permanently walking around with a stack of valid transactions, and for at least one of them, an old one is worth more than the current one.",
    "The blockchain cannot help here. It has no idea which commitment is the newest; they are all just valid transactions spending a 2-of-2 output. There is no timestamp to check, no sequence number the chain understands as 'later'. **The fix cannot be to stop cheating from being possible. It has to be to make cheating lose you everything.**",
  ],
  promise:
    "Every snippet below is copied verbatim from the pinned sources: the Lightning specifications at commit [94eb038](https://github.com/lightning/bolts/commit/94eb038c42e664dd7862faeec6508ccd25f63ff8) and LND v0.21.2-beta at commit [29257ec](https://github.com/lightningnetwork/lnd/commit/29257ecc8892af0c882fa627b66a556190c84fd9). The finale then runs the specification's own published test vectors against this site's own code, in your browser.",
  stops: [
    {
      id: 'the-attack',
      title: 'The attack that has to fail',
      viz: 'revocation-ladder',
      takeaway:
        "Tomas holds fifty valid transactions. The chain will accept any of them. Nothing in Bitcoin's rules prefers the newest one — as far as consensus is concerned, they are fifty equally legitimate ways to spend the same output, and only the first one broadcast will confirm.",
      myth: {
        belief: "Lightning must rely on trusting your channel partner not to cheat.",
        reality:
          "It relies on the opposite: on assuming they *will* cheat the moment it pays. The design's job is to make sure it never pays. What you are about to read doesn't make cheating hard — it makes a successful cheat cost the cheater their entire channel balance, so that a rational counterparty never attempts it and an irrational one funds your evening. No trust required, which is the only kind of guarantee worth having.",
      },
      prose: [
        "Be precise about the threat. This is not someone forging a signature or breaking a hash. Tomas's old commitment transaction is *genuinely his*, genuinely signed by both of them, on a night when that split was the honest truth. Broadcasting it is not forgery. It's repudiation.",
        "And notice the asymmetry: whoever is currently *behind* on the balance is the one with a motive. Every payment Tomas makes creates one more state that Mira would be robbed by, and every payment Mira makes does the reverse. In a busy channel, both sides are carrying a loaded weapon at all times.",
        "So what property do we need? Something that turns each state, at the moment it stops being current, from an asset into a liability. Not deleted — *poisoned*.",
      ],
    },
    {
      id: 'delay-or-punish',
      title: 'Delay or punish',
      takeaway:
        "Every commitment pays its own broadcaster through a script with two branches. The honest branch makes you **wait** `to_self_delay` blocks before you can take your share. The other branch lets your counterparty take **everything, immediately** — if they hold a certain key. The spec labels it, in its own words, `# Penalty transaction`.",
      quiz: [
        {
          question: "Tomas broadcasts the old commitment where he had 200,000 sats. What does the to_local script let Mira do?",
          options: [
            'Broadcast a competing transaction and hope hers confirms first',
            'Nothing — first broadcast wins, so Tomas gets the money',
            "Take his entire balance immediately, using the revocation key, while his own payout sits stuck behind the delay",
          ],
          answer: 2,
          explain:
            "The two branches are not symmetric, and that is the whole design. Tomas's own payout is behind `OP_CHECKSEQUENCEVERIFY` — a real Bitcoin consensus timelock, hundreds of blocks of enforced waiting. Mira's penalty path has no delay at all. She doesn't need to race him; she gets a window measured in hours or days while his money sits visibly stranded in public.",
        },
      ],
      prose: [
        "Read the two branches like a Bitcoin script, because that is exactly what they are. **The `OP_ELSE` branch** is the honest exit: push `to_self_delay`, run `OP_CHECKSEQUENCEVERIFY` — a genuine consensus-enforced relative timelock — and only then may `local_delayedpubkey` sign for the money. Broadcast your latest state honestly and you still wait.",
        "**The `OP_IF` branch** carries the spec's own comment, `# Penalty transaction`. Whoever holds the private key for `<revocationpubkey>` can spend this output the instant it appears on-chain. No delay, no conditions.",
        "Put those together and the incentive is complete. Publishing the *latest* commitment is safe, because nobody holds the revocation key for it yet. Publishing *any older* one parks your entire balance in public, behind a timelock, guarded by a key you have already handed to the person you are trying to rob. The delay isn't there to inconvenience you. It's there to give your victim time to notice.",
        "Which raises the only question that matters: who holds that revocation key, and how did they get it?",
      ],
      annotations: [
        { lines: 'L115', text: "The spec's own plain-English summary: timelocked for the owner, instantly claimable by the other side with the revocation key." },
        { lines: 'L117–19', text: 'Branch one, labelled "Penalty transaction" in the specification itself. No delay. Takes everything.' },
        { lines: 'L120–24', text: 'Branch two, the honest path: wait to_self_delay blocks, then your own delayed key signs.' },
        { lines: 'L126', text: 'Either way, a signature is still required. The branches decide whose, and when.' },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '03-transactions.md', startLine: 113, endLine: 126 },
        language: 'text',
        lines: [
          { n: 113, text: '#### `to_local` Output' },
          { n: 114, text: '' },
          { n: 115, text: 'This output sends funds back to the owner of this commitment transaction and thus must be timelocked using `OP_CHECKSEQUENCEVERIFY`. It can be claimed, without delay, by the other party if they know the revocation private key. The output is a version-0 P2WSH, with a witness script:' },
          { n: 116, text: '' },
          { n: 117, text: '    OP_IF', highlight: true },
          { n: 118, text: '        # Penalty transaction', highlight: true },
          { n: 119, text: '        <revocationpubkey>' },
          { n: 120, text: '    OP_ELSE' },
          { n: 121, text: '        `to_self_delay`' },
          { n: 122, text: '        OP_CHECKSEQUENCEVERIFY', highlight: true },
          { n: 123, text: '        OP_DROP' },
          { n: 124, text: '        <local_delayedpubkey>' },
          { n: 125, text: '    OP_ENDIF' },
          { n: 126, text: '    OP_CHECKSIG', highlight: true },
        ],
      },
    },
    {
      id: 'the-two-halves',
      title: 'A key neither of you can build alone',
      takeaway:
        "The revocation key is built from two halves: one derived from Mira's basepoint, one from Tomas's per-commitment point. Either of them can compute the **public** key at any time. Neither can compute the **private** key — until one hands over their secret, which is precisely what accepting a new balance costs.",
      annotationsOpen: true,
      quiz: [
        {
          question: 'When does Mira become able to compute the revocation private key for a given state?',
          options: [
            'When she opens the channel — she generates it herself',
            'The moment Tomas reveals that state\'s per-commitment secret, which he must do to move to a new balance',
            'Only after Tomas has actually broadcast the old state',
          ],
          answer: 1,
          explain:
            "This is the mechanism in one sentence: revoking a state *is* handing over the secret that makes its penalty key computable. Tomas cannot get a new balance without paying that price, and he cannot take it back afterwards. So the poisoning of old states is not an extra step somebody has to remember — it is a side effect of ordinary use.",
        },
      ],
      prose: [
        "Look at line 817. Two terms, added together. The first scales Mira's `revocation_basepoint` by the hash of (basepoint ‖ point). The second scales Tomas's `per_commitment_point` by the hash of the same two values in the *opposite order*. Both terms are public-key arithmetic, so anyone holding both public values can compute the sum. The revocation *public* key is not a secret at all — it goes in the script, in public, where everyone can see it.",
        "Now lines 819–821, which are the sentence this entire protocol rests on: *neither the node providing the basepoint nor the node providing the per-commitment point can know the private key without the other node's secret.* Mira knows her basepoint secret. Tomas knows his per-commitment secret. The private key is a combination of both, and neither has both.",
        "So when the channel updates, Tomas gives Mira the per-commitment secret for the state he is leaving behind. He is not sending her money and he is not signing anything away. He is completing her half of a key — and the lock that key opens is the penalty branch on every copy of that old state he still holds. He has just handed her a loaded weapon pointed at his own past.",
        "You do not have to take any of this on faith. The finale below runs the specification's own published test vectors through this site's implementation, in your browser, and shows you every intermediate value the spec prints.",
      ],
      annotations: [
        { lines: 'L812', text: 'The per-commitment point is just a public key: secret × G. Its secret is the thing that gets handed over later.' },
        { lines: 'L817', text: 'Two terms, added. The left half is Mira\'s to contribute; the right half is Tomas\'s. Public arithmetic — anyone can compute this.' },
        { lines: 'L819–21', text: "The security claim, in the specification's own words. Read it twice — everything else is a consequence of this sentence." },
      ],
      excerpt: {
        pin: BOLTS_PIN,
        ref: { file: '03-transactions.md', startLine: 810, endLine: 821 },
        language: 'text',
        lines: [
          { n: 810, text: 'The `per_commitment_point` is generated using elliptic-curve multiplication:' },
          { n: 811, text: '' },
          { n: 812, text: '	per_commitment_point = per_commitment_secret * G' },
          { n: 813, text: '' },
          { n: 814, text: 'And this is used to derive the revocation pubkey from the remote node\'s' },
          { n: 815, text: '`revocation_basepoint`:' },
          { n: 816, text: '' },
          { n: 817, text: '	revocationpubkey = revocation_basepoint * SHA256(revocation_basepoint || per_commitment_point) + per_commitment_point * SHA256(per_commitment_point || revocation_basepoint)', highlight: true },
          { n: 818, text: '' },
          { n: 819, text: 'This construction ensures that neither the node providing the', highlight: true },
          { n: 820, text: 'basepoint nor the node providing the `per_commitment_point` can know the', highlight: true },
          { n: 821, text: 'private key without the other node\'s secret.', highlight: true },
        ],
      },
    },
    {
      id: 'in-a-running-node',
      title: 'The same algebra, in a node that runs it',
      takeaway:
        "LND's own documentation writes the derivation out three ways, and then states the consequence in a single line: *once we divulge the revocation secret, the remote peer is able to compute the proper private key.* Spec and implementation, saying the same thing.",
      prose: [
        "Lines 3062–3063 are BOLT #3 line 817, transcribed. Lines 3065–3069 then do something the spec doesn't bother to: they factor it. Both terms are a scalar times `G`, so the sum of two points is `G` times the sum of two scalars — which is exactly what it means to say the result *has* a private key, and that the private key is the sum of the two halves.",
        "Then line 3071, which is the whole quest in one sentence of a code comment: **once we divulge the revocation secret, the remote peer is able to compute the proper private key.** Not 'may be able to'. Not 'in some implementations'. This is the deliberate, documented behaviour of the software running on the network right now.",
        "Two independent sources — a specification written by committee and a node implementation written in Go — describing the same construction in the same terms. That agreement *is* the security property. A protocol where they disagreed would be a protocol where your penalty transaction might not work.",
      ],
      annotations: [
        { lines: 'L3062–63', text: "The derivation, matching BOLT #3 line 817 term for term." },
        { lines: 'L3065–69', text: 'Factored out: both terms are G times a scalar, so the whole thing is G times the sum. That sum is the private key.' },
        { lines: 'L3071', text: 'The consequence, stated plainly by the implementers. Revealing the secret hands over the key.' },
        { lines: 'L3074–75', text: 'And the private key itself: the two halves added, modulo the group order.' },
      ],
      excerpt: {
        pin: LND_PIN,
        ref: { file: 'input/script_utils.go', startLine: 3060, endLine: 3077 },
        language: 'go',
        lines: [
          { n: 3060, text: '// The derivation is performed as follows:' },
          { n: 3061, text: '//' },
          { n: 3062, text: '//	revokeKey := revokeBase * sha256(revocationBase || commitPoint) +', highlight: true },
          { n: 3063, text: '//	             commitPoint * sha256(commitPoint || revocationBase)', highlight: true },
          { n: 3064, text: '//' },
          { n: 3065, text: '//	          := G*(revokeBasePriv * sha256(revocationBase || commitPoint)) +' },
          { n: 3066, text: '//	             G*(commitSecret * sha256(commitPoint || revocationBase))' },
          { n: 3067, text: '//' },
          { n: 3068, text: '//	          := G*(revokeBasePriv * sha256(revocationBase || commitPoint) +' },
          { n: 3069, text: '//	                commitSecret * sha256(commitPoint || revocationBase))' },
          { n: 3070, text: '//' },
          { n: 3071, text: '// Therefore, once we divulge the revocation secret, the remote peer is able to', highlight: true },
          { n: 3072, text: '// compute the proper private key for the revokeKey by computing:' },
          { n: 3073, text: '//' },
          { n: 3074, text: '//	revokePriv := (revokeBasePriv * sha256(revocationBase || commitPoint)) +', highlight: true },
          { n: 3075, text: '//	              (commitSecret * sha256(commitPoint || revocationBase)) mod N', highlight: true },
          { n: 3076, text: '//' },
          { n: 3077, text: '// Where N is the order of the sub-group.' },
        ],
      },
    },
  ],
  finale: {
    title: "Forge the revocation key, and check our work against the spec's",
    takeaway:
      "Build both halves of a revocation key from two independent secrets, watch them meet, then reveal the per-commitment secret and see the private key appear. Then load BOLT #3's own published test vectors and confirm this page reproduces every intermediate value the specification prints.",
    runnerId: 'revocation-forge',
    note: "The elliptic-curve arithmetic and SHA-256 run in your browser, in this site's own dependency-free TypeScript — no cryptography library. That is why the vector check matters and why it is worth pressing: the spec's numbers only come out if every line of it is correct. The same check runs in CI on every change to this site.",
  },
  recap: {
    tryIt:
      "Next time you close a Lightning channel, watch the closing transaction on a block explorer and note how long your funds take to become spendable. A cooperative close pays out immediately, because both sides signed and there is nothing to punish. A force close makes you wait out `to_self_delay` — hundreds of blocks of watching your own money sit there. That wait is not your wallet being slow. It is the window in which your counterparty could have proven you were cheating, and the reason they never bother trying.",
    items: [
      {
        text: '**Old states are never destroyed** — both parties keep every signed split, and the chain has no notion of which is newest.',
      },
      {
        text: '**Every commitment pays its broadcaster through a delay-or-punish script**: `OP_CHECKSEQUENCEVERIFY` on the honest branch, an immediate penalty on the other.',
        cite: '03-transactions.md:117',
      },
      {
        text: "**The revocation key is built from two halves**, and the specification states plainly that neither party can know the private key without the other's secret.",
        cite: '03-transactions.md:819',
      },
      {
        text: '**Revoking a state means handing over that secret**, so moving to a new balance is what poisons the old one. A running node documents exactly this.',
        cite: 'script_utils.go:3071',
      },
    ],
    closing:
      "**Keep verifying.** This is the quest where Lightning stops being a promise and becomes arithmetic: nobody is trusted, nobody is monitored, and cheating simply costs more than it pays. You checked it against the specification, against a node that implements it, and against the specification's own test vectors running in your own browser. Next: how Mira pays someone she has no channel with at all.",
  },
  feynman: {
    prompt:
      "Explain to a friend, in three sentences, why someone in a Lightning channel can't just publish an old balance where they had more money.",
    model:
      "They can publish it — nothing stops them, and the chain will accept it, because it is a genuinely valid signed transaction. But every balance is paid out through a script with two doors: the publisher's own money is locked behind a long delay, while the other person can take the entire amount instantly if they hold that state's revocation key. And the catch is that handing over that key is exactly what agreeing to a new balance requires, so by the time an old state is old, the person you'd be robbing already has everything they need to take the lot.",
  },
};
