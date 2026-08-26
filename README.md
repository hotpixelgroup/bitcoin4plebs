# bitcoin4plebs

[![CI](https://github.com/hotpixelgroup/bitcoin4plebs/actions/workflows/ci.yml/badge.svg)](https://github.com/hotpixelgroup/bitcoin4plebs/actions/workflows/ci.yml)
[![19 quests](https://img.shields.io/badge/quests-19-f7931a)](https://hotpixelgroup.github.io/bitcoin4plebs/)

**Understand Bitcoin's code. No engineering degree required.**

**Live site: https://hotpixelgroup.github.io/bitcoin4plebs/**

Millions of people hold bitcoin on the word of engineers they've never met. This site exists so they don't have to. Each **verification quest** walks a non-technical reader through the *real* Bitcoin Core source code: verbatim excerpts pinned to a specific commit, annotated in plain English, with a "run it yourself" finale that proves the claim on the reader's own machine. One running story (Ana buys Bo's bike for 0.6 BTC) threads through all nineteen quests, and the home page opens with a live panel that takes exactly one number on trust and computes the rest in your browser.

The curriculum is nineteen quests in seven tracks:

**Start here** · 0: What even is a ledger?

**Foundations** · 1: Verify the 21 Million Cap with your own eyes · 2: What exactly happens at a halving? · 3: What stops someone from spending your coins? · 4: Who can change Bitcoin's rules? · 5: What did the 2018 inflation bug actually do? · 6: How does mining actually work? · 7: What happens when you press send?

**Advanced** · 8: Hash the genesis block with your own machine (rebuild the 80-byte header from `chainparams.cpp`'s four numbers and reproduce `000000000019d668…` in-browser) · 9: Run your own node and audit the money supply yourself (initial sync, the `assumevalid` fine print, and `gettxoutsetinfo` vs. the Quest #1 schedule) · 10: What is an address, actually? (a faithful bech32 decoder you can break on purpose) · 11: Send your first bitcoin, with play money (signet, with a live tracker watching your transaction confirm)

**Zoom out** · 12: Who keeps Bitcoin usable when no one is in charge? (the fee-floor thermostat from `txmempool.cpp`, blind best-bid block assembly, the economic-node veto, and a stress-the-network simulator) · 13: The data wars: what is the ledger for? (OP_RETURN's history, the inscription flood, Core v30 vs. Knots, and BIP-110 quoted verbatim from a second pinned repo, both camps steelmanned)

**Take it home** · 14: Where do your coins live while you sleep? (wallets as keychains, the BIP-39 recipe quoted verbatim and run 1:1 in-browser, what actually kills wallets, and a seed studio that mints practice phrases and breaks their checksums on purpose) · 15: Who can see your money? (the glass ledger, Core's avoid-reuse and fresh-change code, clustering heuristics, and a cluster-detective finale where you run the analyst's playbook and then starve it)

**Beyond the chain** · 16: Where do a thousand coffees fit? (payment channels from the BOLT specifications, a third pinned repository: the 2-of-2 funding script and the OP_IF revocation penalty verbatim, plus a channel simulator with a cheat button)

**The big questions** · 17: Why is this money at all? (the "backed by nothing" category error, the properties-of-money scorecard scoring gold/cash/Bitcoin honestly, the double-spend problem Bitcoin actually solved, and a double-spend duel you can try to break) · 18: Does Bitcoin waste energy? (the objection taken seriously, why the energy cost *is* the security rather than a side effect, an honest accounting of the sources, and a "price a rewrite" calculator)

There are also reference pages, all brandless: a [security playbook](https://hotpixelgroup.github.io/bitcoin4plebs/security) for generating keys with real entropy, backing them up so they survive fire and forgetting, and running multisig; a map of [wallet types](https://hotpixelgroup.github.io/bitcoin4plebs/wallets); a comparison of [Bitcoin Core and Bitcoin Knots](https://hotpixelgroup.github.io/bitcoin4plebs/core-vs-knots) as software choices; and [the map](https://hotpixelgroup.github.io/bitcoin4plebs/map) of what builds on what.

## Principles

1. **The real code is always on screen.** Every excerpt is copied verbatim from `bitcoin/bitcoin` (and, for specification documents, `bitcoin/bips` and `lightning/bolts`) at pinned commits and links to the same lines on GitHub. Don't trust this site either: verify it.
2. **The AI/author is a tour guide, never an oracle.** Explanations sit *next to* the source, not in place of it.
3. **Quests are data, not pages.** One generic engine renders every quest, so new quests are content files, and could even come from an API later without touching the app.
4. **Verification runs in CI.** The unit tests assert the famous numbers (33 eras, block 6,929,999, 2,099,999,997,690,000 satoshis, the genesis hash) against the same logic the site runs, and CI fetches Bitcoin Core at the pinned commit and diffs **every excerpt on the site against the real source, letter for letter**, on every push and every pull request.

## Workspace layout (Nx)

| Project | What it is |
| --- | --- |
| `apps/web` | React + Vite app: routing, quest engine page, runner registry |
| `packages/quests` | Quest content model (types) + quest data, pure and serializable |
| `packages/ui` | Presentational components: CodeCard, StopSection, RichText |
| `packages/bitcoin-logic` | Faithful TS translations of consensus math + the verification tests |
| `packages/lightning-logic` | Dependency-free secp256k1, ChaCha20 and the BOLT #4 sphinx onion, checked against the Lightning spec's own test vectors |

## Two front doors, one codebase

This repository publishes **two** sites from the same source. `VITE_SITE` picks
the curriculum, the brand and the home page; the quest engine, the search, the
glossary and the design system are shared by being literally the same build, so
they cannot drift apart.

| | `bitcoin4plebs` | `lightning4plebs` |
| --- | --- | --- |
| Build | `npx nx build web` | `VITE_SITE=lightning npx nx build web` |
| Dev | `npx nx dev web` (:4200) | `VITE_SITE=lightning npx vite -c apps/web/vite.config.ts` (:4201) |
| Output | `apps/web/dist` | `apps/web/dist-lightning` |
| Primary source | `bitcoin/bitcoin` | `lightning/bolts` + `lightningnetwork/lnd` |

Quests declare which front door they belong to (`site`), and numbering runs
sequentially *within* a site. Slugs stay globally unique, and glossary terms are
shared by default — a definition proven on the other site links across to it.
Everything site-specific that isn't a quest lives in one place,
[`packages/quests/src/lib/sites.ts`](packages/quests/src/lib/sites.ts), and the
integrity tests fail if a track loses its blurb or a site stops pointing at its
sibling.

## Develop

```sh
npm install
npx nx dev web        # dev server on http://localhost:4200
npx nx run-many -t lint test build typecheck
```

To also run the verbatim-excerpt check locally, point `BITCOIN_SRC`, `BIPS_SRC`,
`BOLTS_SRC`, and `LND_SRC` at checkouts of Bitcoin Core, the BIPs, the Lightning
BOLTs, and LND at the pinned commits (all four pins live in
`packages/quests/src/lib/excerpts.ts`):

```sh
BITCOIN_SRC=~/bitcoin BIPS_SRC=~/bips BOLTS_SRC=~/bolts LND_SRC=~/lnd npx nx run-many -t test
```

The BOLTs checkout does double duty. Beyond the letter-for-letter excerpt diff,
`packages/lightning-logic` runs **the specification's own machine-readable test
vectors** against our TypeScript: `BOLTS_SRC=~/bolts npx nx test
@bitcoin4plebs/lightning-logic` rebuilds `bolt04/onion-test.json`'s 1,366-byte
onion and requires a byte-for-byte match. That packet only comes out right if
the hand-rolled secp256k1, the hand-rolled ChaCha20, the key derivation, the
blinding chain and the filler accumulation are *all* exactly correct. There is
no partial credit, which is rather the point.

Both checks are mandatory in CI: if a pinned checkout is missing there, the
suite fails rather than quietly skipping.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds `apps/web` with `VITE_BASE=/<repo-name>/` and publishes to GitHub Pages (enable **Settings → Pages → Source: GitHub Actions** once). The Lightning front door is published from its own repository, [hotpixelgroup/lightning4plebs](https://github.com/hotpixelgroup/lightning4plebs), which holds no source: its workflow checks *this* repository out and builds it with `VITE_SITE=lightning`. GitHub Pages serves one site per repository, which is the only reason that repo exists — and because it pulls a public repo, that deploy needs no tokens or deploy keys of any kind. It rebuilds on a schedule and on manual dispatch; this repository's own workflows build the Lightning site on every push as a check, so breakage is caught here first. Deep links work via an SPA fallback generated per site from `apps/web/404.template.html` (it carries each site's own og: tags, because that page is exactly what a crawler gets when someone shares a quest link). The site is an installable PWA: after one visit, the entire curriculum works offline (live-data panels degrade gracefully).

## Don't trust our server either

The site is a static build, so you can reproduce it and compare it against what we actually serve:

```sh
git clone https://github.com/hotpixelgroup/bitcoin4plebs.git
cd bitcoin4plebs && npm ci
VITE_BASE=/bitcoin4plebs/ npx nx build web
```

Then compare `apps/web/dist/` with the live site. Asset filenames are content-hashed, so verifying `index.html` transitively pins the bundles it references:

```sh
curl -s https://hotpixelgroup.github.io/bitcoin4plebs/index.html | shasum -a 256
shasum -a 256 apps/web/dist/index.html
```

In our testing, two clean builds are byte-for-byte identical on the same Node major (24). A different toolchain version may legitimately differ; anything else is a bug, and we'd like an [issue](https://github.com/hotpixelgroup/bitcoin4plebs/issues/new/choose) about it, loudly.

## Contributing

Contributions are welcome: fact fixes, clearer explanations, accessibility, bugs, and (after an issue first) new quests. Read [CONTRIBUTING.md](CONTRIBUTING.md). The one iron rule: excerpts stay letter for letter identical to the pinned source, and CI enforces that on every pull request.

## License

[MIT](LICENSE) for this site's code. Quoted source excerpts © Bitcoin Core developers, MIT License.
