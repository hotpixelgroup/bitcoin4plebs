# Contributing to bitcoin4plebs

Thanks for wanting to help. This site makes one promise to its readers: **every code excerpt is copied letter for letter from the real Bitcoin Core source at a pinned commit, and every claim can be checked.** Everything in this guide exists to protect that promise.

## Ways to help

- **Fix a factual error.** The most valuable contribution. Open a [content error issue](https://github.com/hotpixelgroup/bitcoin4plebs/issues/new/choose) or a PR, and cite the pinned source (file and line) so we can verify.
- **Make an explanation clearer.** The audience is a smart reader who has never coded. If a sentence made you stop and reread, it can probably be better.
- **Improve accessibility.** Keyboard navigation, screen reader labels, reduced motion, contrast. The site should work for everyone.
- **Fix a bug** in a figure, runner, or page.
- **Propose a new quest or figure.** Open an issue first so we can agree on scope before you build. Quests are a lot of work to do well.
- **Translations** are planned (Spanish and Portuguese first). Open an issue before starting one; the i18n structure needs to land first so your work is not thrown away.

Price talk, shilling, and financial advice are off topic everywhere in this project. The site explains how Bitcoin works, never whether to buy it.

## Getting set up

You need Node 24+.

```sh
git clone https://github.com/YOUR-USERNAME/bitcoin4plebs.git
cd bitcoin4plebs
npm install
npx nx dev web        # dev server on http://localhost:4200
```

Before opening a PR, this must be green:

```sh
npx nx run-many -t lint test typecheck build
```

## The iron rule: excerpts are verbatim

Every `CodeExcerpt` in `packages/quests` is diffed letter for letter against Bitcoin Core at the pinned commit. The pin lives in exactly one place: `packages/bitcoin-logic/src/lib/constants.ts`. CI fetches the real source and runs the diff on every push and every PR, so this rule enforces itself. But you will want to run it locally:

```sh
# One-time: fetch Bitcoin Core's src/ tree at the pinned commit (shallow, ~sparse)
PIN=$(grep -oE "[0-9a-f]{40}" packages/bitcoin-logic/src/lib/constants.ts | head -1)
git init ~/bitcoin-pinned && cd ~/bitcoin-pinned
git remote add origin https://github.com/bitcoin/bitcoin.git
git sparse-checkout set src
git fetch --depth=1 --filter=blob:none origin "$PIN"
git checkout FETCH_HEAD

# Then, from the bitcoin4plebs repo:
BITCOIN_SRC=~/bitcoin-pinned npx nx test @bitcoin4plebs/quests
```

Never "clean up" an excerpt: not whitespace, not a typo in a comment, nothing. If Core's code is ugly, the site shows it ugly. That is the point of the site.

## House style

- **Plain language.** Write for a curious adult who has never seen code. Prefer short sentences. Define a term the first time it appears, or add it to the glossary in `packages/quests/src/lib/glossary.ts`.
- **No em dashes** in prose, anywhere. Use commas, periods, or the "·" separator. (Excerpts are exempt: they are verbatim.)
- **Every claim is checkable.** A number or statement about Bitcoin either points at the pinned source, is computed live by `packages/bitcoin-logic`, or does not go in.
- **Be honest about trust.** Live data is labeled with where it comes from: "their node's word", "computed here", "their estimate". Never present someone else's API as ground truth.
- **Real algorithms only.** Figures and runners execute the actual math (BigInt subsidy schedule, real double SHA-256, faithful bech32), never a canned animation that fakes it.
- **Respect `prefers-reduced-motion`** in anything that moves, and keep everything usable by keyboard and screen reader.

## How the code is organized

| Where | What |
| --- | --- |
| `packages/quests` | All content, as pure serializable data: quest files, glossary, questions. No React. |
| `packages/bitcoin-logic` | Exact TypeScript translations of consensus math, BigInt only, heavily tested. |
| `packages/ui` | Presentational components (CodeCard, StopSection, RichText, quizzes). |
| `apps/web` | The site: routing, quest engine, and the registries that map quest data to interactive figures and finale runners. |

Content never imports React; the app looks up interactive pieces by id (`Stop.viz`, `finale.runnerId`) in registries under `apps/web/src`. If you add a figure or runner, register it there.

The test suite is the contract. Among other things it enforces: sequential quest numbers, excerpt line ranges that match their declared refs, one shared pin across all quests, valid quiz answers with explanations, story-thread integrity, glossary integrity, and the verbatim diff itself. If the suite is green, you have not broken the site's promise.

## Pull requests

1. Fork, branch from `main`, keep the PR focused on one thing.
2. Make sure `npx nx run-many -t lint test typecheck build` passes.
3. Open the PR. CI will run the full suite including the verbatim check; it must be green.
4. A maintainer reviews and squash-merges. Small PRs get reviewed fast, huge ones slowly.

By contributing you agree your contributions are licensed under the MIT License, the same as the project.
