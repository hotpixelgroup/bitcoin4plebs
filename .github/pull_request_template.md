## What does this change?

<!-- One or two sentences. Link the issue if there is one. -->

## Checklist

- [ ] `npx nx run-many -t lint test typecheck build` passes locally.
- [ ] Prose is plain language a non-coder can follow, with no em dashes (house style: commas, periods, or "·").
- [ ] Any claim about Bitcoin cites the pinned source or is computed by `packages/bitcoin-logic`.
- [ ] If I touched a code excerpt: it is letter for letter identical to Bitcoin Core at the pinned commit, and I ran the verbatim check (`BITCOIN_SRC=... npx nx test @bitcoin4plebs/quests`, see CONTRIBUTING.md).
- [ ] If I added anything that moves: it respects `prefers-reduced-motion` and works by keyboard.
