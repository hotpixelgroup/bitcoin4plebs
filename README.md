# bitcoin4plebs

**Understand Bitcoin's code. No engineering degree required.**

Millions of people hold bitcoin on the word of engineers they've never met. This site exists so they don't have to. Each **verification quest** walks a non-technical reader through the *real* Bitcoin Core source code — verbatim excerpts pinned to a specific commit, annotated in plain English, with a "run it yourself" finale that proves the claim on the reader's own machine.

The curriculum is nine quests in two tracks:

**Foundations** — 1: Verify the 21 Million Cap · 2: What happens at a halving · 3: What stops someone spending your coins · 4: Who can change Bitcoin's rules · 5: The 2018 inflation bug · 6: How mining works · 7: What happens when you press send

**Advanced** — 8: Hash the genesis block yourself (rebuild the 80-byte header from `chainparams.cpp`'s four numbers and reproduce `000000000019d668…` in-browser) · 9: Run your own node (what initial sync verifies, the `assumevalid` fine print, and a supply audit that checks your node's `gettxoutsetinfo` against the Quest #1 schedule)

## Principles

1. **The real code is always on screen.** Every excerpt is copied verbatim from `bitcoin/bitcoin` at a pinned commit and links to the same lines on GitHub. Don't trust this site either — verify it.
2. **The AI/author is a tour guide, never an oracle.** Explanations sit *next to* the source, not in place of it.
3. **Quests are data, not pages.** One generic engine renders every quest, so new quests are content files — and can come from an API later without touching the app.
4. **Verification runs in CI.** The unit tests assert the famous numbers (33 eras, block 6,929,999, 2,099,999,997,690,000 satoshis, the genesis hash) against the same logic the site runs — and CI fetches Bitcoin Core at the pinned commit and diffs **every excerpt on the site against the real source, letter for letter**, on every push.

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

To also run the verbatim-excerpt check locally, point `BITCOIN_SRC` at any
Bitcoin Core checkout at the pinned commit:

```sh
BITCOIN_SRC=~/bitcoin npx nx test @bitcoin4plebs/quests
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds `apps/web` with `VITE_BASE=/<repo-name>/` and publishes to GitHub Pages (enable **Settings → Pages → Source: GitHub Actions** once). Deep links work via the `public/404.html` SPA fallback.

## License

MIT for this site's code. Quoted source excerpts © Bitcoin Core developers, MIT License.
