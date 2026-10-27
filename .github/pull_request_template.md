## What does this change?

<!-- One or two sentences. Link the issue if there is one. -->

## Risk: low / medium / high

<!-- Pick one and say why in one line. High: .github/workflows/**, deploy or Pages config, the pinned source commits, packages/bitcoin-logic maths, anything that handles keys, seeds or addresses. Medium: quest text with Bitcoin claims, interactive tools. Low: copy, docs, styling. -->

- Tier:
- Why:

## Testing

<!-- The commands you ran on this exact head and their result lines. "Tests pass" is not evidence. -->

```text
$ npx nx run-many -t lint test typecheck build
<result>
```

<!-- Name anything you could not verify (for example the verbatim check without BITCOIN_SRC). -->

## Evidence

<!-- Screenshot of the changed page (desktop and phone if layout changed), the source link for any new Bitcoin claim, or a CI run link. -->

## How to revert

<!-- For example: "Revert the squash commit; the next deploy republishes the old pages." Say if anything else must be undone. -->

## Checklist

- [ ] `npx nx run-many -t lint test typecheck build` passes locally.
- [ ] Prose is plain language a non-coder can follow, with no em dashes (house style: commas, periods, or "·").
- [ ] Any claim about Bitcoin cites the pinned source or is computed by `packages/bitcoin-logic`.
- [ ] If I touched a code excerpt: it is letter for letter identical to Bitcoin Core at the pinned commit, and I ran the verbatim check (`BITCOIN_SRC=... npx nx test @bitcoin4plebs/quests`, see CONTRIBUTING.md).
- [ ] If I added anything that moves: it respects `prefers-reduced-motion` and works by keyboard.
- [ ] Review findings are fixed or resolved with a reason, within 3 review/fix rounds.
- [ ] Harry merges. Agents never merge.
