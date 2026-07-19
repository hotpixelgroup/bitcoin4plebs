# bitcoin4plebs

[![CI](https://github.com/hotpixelgroup/bitcoin4plebs/actions/workflows/ci.yml/badge.svg)](https://github.com/hotpixelgroup/bitcoin4plebs/actions/workflows/ci.yml)

**Understand Bitcoin's code. No engineering degree required.**

**Live site: https://hotpixelgroup.github.io/bitcoin4plebs/**

Millions of people hold bitcoin on the word of engineers they've never met. This site exists so they don't have to. Each **verification quest** walks a non-technical reader through the *real* Bitcoin Core source code: verbatim excerpts pinned to a specific commit, annotated in plain English, with a "run it yourself" finale that proves the claim on the reader's own machine. One running story (Ana buys Bo's bike for 0.6 BTC) threads through all fourteen quests, and the home page opens with a live panel that takes exactly one number on trust and computes the rest in your browser.

The curriculum is fourteen quests in four tracks:

**Start here** · 0: What even is a ledger?

**Foundations** · 1: Verify the 21 Million Cap with your own eyes · 2: What exactly happens at a halving? · 3: What stops someone from spending your coins? · 4: Who can change Bitcoin's rules? · 5: What did the 2018 inflation bug actually do? · 6: How does mining actually work? · 7: What happens when you press send?

**Advanced** · 8: Hash the genesis block with your own machine (rebuild the 80-byte header from `chainparams.cpp`'s four numbers and reproduce `000000000019d668…` in-browser) · 9: Run your own node and audit the money supply yourself (initial sync, the `assumevalid` fine print, and `gettxoutsetinfo` vs. the Quest #1 schedule) · 10: What is an address, actually? (a faithful bech32 decoder you can break on purpose) · 11: Send your first bitcoin, with play money (signet, with a live tracker watching your transaction confirm)

**Zoom out** · 12: Who keeps Bitcoin usable when no one is in charge? (the fee-floor thermostat from `txmempool.cpp`, blind best-bid block assembly, the economic-node veto, and a stress-the-network simulator) · 13: The data wars: what is the ledger for? (OP_RETURN's history, the inscription flood, Core v30 vs. Knots, and BIP-110 quoted verbatim from a second pinned repo, both camps steelmanned)

There is also a reference page comparing [Bitcoin Core and Bitcoin Knots](https://hotpixelgroup.github.io/bitcoin4plebs/core-vs-knots) as software choices.

## Principles

1. **The real code is always on screen.** Every excerpt is copied verbatim from `bitcoin/bitcoin` (and, for BIP documents, `bitcoin/bips`) at pinned commits and links to the same lines on GitHub. Don't trust this site either: verify it.
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

## Develop

```sh
npm install
npx nx dev web        # dev server on http://localhost:4200
npx nx run-many -t lint test build typecheck
```

To also run the verbatim-excerpt check locally, point `BITCOIN_SRC` and
`BIPS_SRC` at checkouts of Bitcoin Core and the BIPs repo at the pinned
commits (both pins live in `packages/quests/src/lib/excerpts.ts`):

```sh
BITCOIN_SRC=~/bitcoin BIPS_SRC=~/bips npx nx test @bitcoin4plebs/quests
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds `apps/web` with `VITE_BASE=/<repo-name>/` and publishes to GitHub Pages (enable **Settings → Pages → Source: GitHub Actions** once). Deep links work via the `public/404.html` SPA fallback.

## Contributing

Contributions are welcome: fact fixes, clearer explanations, accessibility, bugs, and (after an issue first) new quests. Read [CONTRIBUTING.md](CONTRIBUTING.md). The one iron rule: excerpts stay letter for letter identical to the pinned source, and CI enforces that on every pull request.

## License

[MIT](LICENSE) for this site's code. Quoted source excerpts © Bitcoin Core developers, MIT License.
