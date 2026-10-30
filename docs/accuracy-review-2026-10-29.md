# bitcoin4plebs — Accuracy review, 29 Oct 2026

**Code reviewed:** `hotpixelgroup/bitcoin4plebs` @ `6706a85` (GitHub main, pushed 27 Oct). Unpushed local changes were not reviewed.
**Pins:** Core `18c05d9`, bips `8c369ac`, bolts `94eb038`, LND `29257ec` (v0.21.2-beta).
**Method:** 11 parallel read-only reviewers, plus the deterministic excerpt gate. Nothing was edited.

## The gate (deterministic)
- **Excerpts:** every quoted line matches the pinned source verbatim across all 4 pins; none skipped. BOLT 3/4/7/11 vectors and the BIP39 wordlist pass.
- **Tests:** bitcoin-logic 73/73, lightning-logic 41/41, quests 25/25.
- **Builds:** Bitcoin and Lightning build assertions and cache isolation pass.
- **Flaky web tests:**
  - `extended-labs.spec.tsx:143`: `toHaveTextContent('')` races the status box. Failed 2 of 3 runs on Lightning. Needs a real fix.
  - `app.spec.tsx`, "renders EVERY quest": times out at 5 s under full-suite load. Raise the timeout.

## Tier 1: Wrong (fix first)
| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | halving.ts:22 / halving-clock.tsx:93 | Past dates run backwards from 840k at a flat 10 min. Genesis shows **2008-04-30**; first halving shows Apr 2012 instead of Nov 2012. | Anchor on real timestamps for heights ≤ 840k; extrapolate only forward. |
| 2 | quest-02:138 | "Claiming 6.25 BTC at 840,000 → bad-cb-amount." The block had about 37.6 BTC of fees, so 6.25 was legal. | "Claiming the old 6.25 subsidy *on top of fees* overshoots by 3.125 → bad-cb-amount." |
| 3 | quest-02:123 | "Block 840,000 paid 3.125." It paid about 40.75 BTC in total. | Say "subsidy", and note the fees. |
| 4 | quest-08:129 quiz | A corrupted genesis block on disk "refuses to start". The asserts rebuild genesis from compiled constants and never read the disk. | Change the question to "alters the compiled genesis numbers". |
| 5 | quest-08:254 | "Checked in builds where assertions are enabled." util/check.h makes Core fail to compile without asserts. | "Core can't be built without assertions." |
| 6 | quest-13:113 | "Knots began enforcing BIP110 in Aug 2026." It was opt-in; the split was at block 961,632 on 8 Aug, among opted-in nodes. | Reword (see the reviewer's text). |
| 7 | quest-13:60 | Bare multisig is "off by default". `DEFAULT_PERMIT_BAREMULTISIG{true}`. | "…has its own gate, which Core leaves open by default." |
| 8 | quest-12:81 | The fee-floor decay condition is described backwards. | "No block since the floor was raised → return it undecayed." |
| 9 | quest-15:135 | The address is "consumed only once used". `KeepDestination()` runs on reserve. | "Marked used as soon as it's handed out." |
| 10 | quest-ln-03:117 | "A hop could pay a guessed hash." The hop already knows the hash; it guesses the *recipient*. | Use BOLT 4 probing wording. |
| 11 | quest-ln-04:163 | Fees are "the next quest". They are in Quest #6. | "…is Quest #6." |
| 12 | quest-ln-06:126–132 | The annotations cite BOLT 7 lines 1114–1120, which are outside the excerpt (979–981). | Add a second excerpt or drop the annotations. |
| 13 | quest-ln-07:139–140 | The reserve and HTLC-minimum rationales are attributed to lines that don't say them. | Reword (see the reviewer's text). |
| 14 | onion-peel.tsx:4 | Mira, the sender, "peels" the first layer, and there are 5 layers for 4 hops. | Mira builds it; 4 layers; start at the hub. |
| 15 | channel-footprint.tsx:73 | At 2 payments it shows "−40 vB saved". | Use `saved <= 0` as the condition. |
| 16 | glossary-term.tsx:37 | The auto-linker ignores the site, so Lightning pages show the **Bitcoin** definitions of gossip, payment channel and revocation key. | Filter by `currentSite()`. |
| 17 | questions.ts:252 | "Can't afford a whole bitcoin" points to the wrong stop. | `stop: 'divisible'`. |
| 18 | quest-17:184 | The double-spend recap cites `amount.h:26` (MAX_MONEY). | Remove it, or cite an input-spent check. |

## Tier 2: Misleading
- **Scale of work:** quest-06:95 says "quintillions" and energy-to-security.tsx:24 says "trillions". The real figure is about 6×10²³ hashes per block (difficulty ~1.4×10¹⁴ × 2³²). Say "hundreds of sextillions".
- **quest-04:35/46/117:** this overstates the MAX_MONEY comment. The comment says a change "could lead to a fork" in bug scenarios.
- **quest-07:53/50:** "dies silently / no error letter", and line 1795 is outside the excerpt. The node does tell your wallet why; only peers get no reply.
- **quest-05:112:** "removed the check". It was skipped during block validation (PR #9049), not removed.
- **quest-10:78 and quest-11:108:** testnet addresses don't fail on mainnet because of the checksum. Core compares the prefix (key_io.cpp:140). This contradicts quest-11:106.
- **quest-09:31 and glossary:915:** "~10 GB pruned" is out of date. The pin assumes a 14 GB chainstate, so say about 15–20 GB.
- **quest-09:213:** "assumevalid skips ancient checks only". The default assumevalid block is 938,343, so it covers nearly the whole chain.
- **quest-01:84:** "zero after 64 halvings". The reward hits zero at halving 33 (~2140); 64 is only a guard against undefined shifts.
- **quest-03:23:** "mint a fresh box". This clashes with "only the coinbase creates coins" and leaves out change.
- **quest-ln-03:46:** "expires in one hour by default". That's only BOLT 11's fallback; LND defaults to 24 h.
- **quest-ln-02:203:** only the side that force-closes waits out `to_self_delay`.
- **quest-ln-04:132–153 and :23:** the HTLC script shown is the non-anchor version, so "immediately" isn't accurate; with anchors it's "as soon as it confirms". "The hub holds the whole amount" contradicts the quest's own myth box.
- **quest-ln-06:195:** "wallets take the four-hop zero-fee path". LND's hop penalty picks the 2-hop path, and line 248 says so.
- **quest-ln-05:75 and :106 quiz:** the blinded key doesn't prevent correlation (the payment hash still links hops), and the hop does know it's not the final one.
- **quest-12:151:** line 305 loops while the mempool still has chunks; the weight limit is checked inside the loop.
- **Data-wars tone, quest-13:38/54/117:** contested views are stated in the narrator's own voice. Attribute them to the camps that hold them.
- **Energy and money tone:** quest-18:42, 129 and 139; questions.ts:244 and 256; quest-17:62 and 156. These include "country's worth", "tamper-proof", "energy nobody wants", "backed by nothing is true of the dollar" and "gold minus its weaknesses". They contradict the quests' own hedges. Latest dated figure: Cambridge, Apr 2025, ~138 TWh/yr, about 0.5% of world electricity.
- **questions.ts:313:** "a hop learns nothing else". The amount, timing and payment hash can still leak.
- **Glossary soft fork (:959):** "near-unanimous" contradicts the UASF and BIP110 entries.
- **Glossary OP_RETURN (:1024):** "added 2014". The opcode is from 2009; 2014 was the relay-policy change.
- **Runners:**
  - emission-runner.tsx:93, "different network": this message shows even with the defaults, and underclaiming miners would still be accepted by other nodes.
  - stress-network.tsx:190: `-datacarriersize` doesn't filter witness inscriptions.
  - supply-check.tsx:88: the placeholder value is above the schedule, so pasting it gives an "impossible" error.
  - invoice-anatomy.tsx: it omits the required `s` field.

## Tier 3: Minor (batch these)
- **Bitcoin quests:**
  - quest-00:148: "next ten quests".
  - quest-02:124: "2130s"; should be ~2140.
  - quest-03:40/126: most addresses lock to a key *hash*.
  - quest-03:124: taproot uses Schnorr, not the same check.
  - quest-04:70: light wallets would follow a rule-breaking chain.
  - quest-06:56/95: 2,015 intervals; "most work", not "longest".
  - quest-07:56: packages enter via AcceptPackage.
  - quest-08:141/250: wording; cite L59–61.
  - quest-09:50: genesis is skipped.
  - quest-10:109/138: 5-bit chunks; substitutions only.
  - quest-12:75: floor = evicted feerate + incremental fee.
  - quest-13:54: the setting covers relay *and mine*.
  - quest-14:57/153: "losing or leaking"; 24 words = 256 bits.
  - quest-15:158/162: soften for CoinJoin/PayJoin.
  - quest-15:134: master key, not seed.
  - quest-16:70: ~12 tx/s; "a few" understates it.
  - quest-16:192: bc1/1/3.
  - quests 16 and 18: "three sentences" vs four-sentence model answers.
- **Lightning quests:**
  - quest-ln-02:37/64: "only one can confirm"; 144–2016 blocks.
  - quest-ln-05:165: channels also lock up capital.
  - quest-ln-05:24 vs quest-ln-06:26/161: fee numbers in the story don't match.
  - quest-ln-06:172: the 20-hop limit can be lower.
- **questions.ts:**
  - :138: "4 substitutions".
  - :150: point to the privacy quest.
- **Glossary:** dust (ephemeral exception), BIP (wallet standards), feerate (chunks), fee floor (6 h/3 h half-lives).
- **Visualizers:**
  - activation-timeline: it's the assumevalid block, not a checkpoint; MAX_HEIGHT 960k is getting stale.
  - difficulty-thermostat: updater runs twice under StrictMode.
  - liquidity-seesaw: labels at the edges.
  - merkle-lightning: "flip one byte" adds 16 chars.
  - fee-calculator: preset exceeds the slider max.
  - route-race: comment says ">2×".
  - money-scorecard and incentive-machine: label ratings as opinion.
  - utxo-flow: story; points to Quest #2 by mistake.
- **Runners and libs:**
  - bolt11.ts: accepts the missing-`s` vector and doesn't enforce d/h.
  - invoice-decoder: callout always blames the checksum; "520-bit".
  - halving-clock vs supply-check: different supply definitions.
  - fee-auction: ignores `finale.note`.
  - "≈ today" drifts about 4 days.
  - policy-picker: "bytes", not "vbytes".
- **A11y (viz-figure):**
  - No `aria-labelledby`.
  - "Touch it" badge appears on static figures.
  - Most readouts lack `role="status"`.
  - Invalid `role="row"` on buttons (money-scorecard).
  - Reduced motion is only honored in 2 of 22.

## Checked and clean (highlights)
- **Supply and schedule:** 20,999,999.9769 total; 33 eras ending at block 6,929,999.
- **Soft forks:** all activation heights; six since 2013.
- **Inflation bugs:** CVE-2010 and CVE-2018 timelines.
- **Genesis:** header fields and hashes.
- **Addresses:** bech32/bech32m constants and vectors.
- **Seeds:** BIP39 parameters.
- **Lightning:** BOLT 2/3/4/7/11 field sizes, formulas and vectors; LND funding-script refs.
- **Sites and paths:** sites.ts and paths.ts are clean.
- **Glossary:** all 155 entries' code citations.
