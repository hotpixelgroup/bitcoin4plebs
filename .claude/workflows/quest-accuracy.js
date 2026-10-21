export const meta = {
  name: 'quest-accuracy',
  description:
    'Report-only accuracy check of bitcoin4plebs quests: one reviewer per quest, then correct / current / source-real skeptics per finding. The CI excerpt check stays the pass/fail gate.',
  whenToUse:
    'Before publishing quest copy changes, after bumping a source pin, or as a periodic content audit. First run is capped at 5 quests; pass {offset} or {quests} for the next slice.',
  phases: [
    { title: 'Discover', detail: 'quest files and pins at HEAD' },
    { title: 'Review', detail: 'one reviewer per quest (capped)' },
    {
      title: 'Verify',
      detail: 'three lenses per finding: correct, current, source real',
    },
    { title: 'Gate', detail: 'run the existing deterministic excerpt check' },
    {
      title: 'Report',
      detail: 'append a dated section to docs/learning-accuracy-review.md',
    },
  ],
};

// Saved workflow (docs/agent-standard.md, "Fan-out work"). The deterministic anchor is the existing
// test suite that diffs every excerpt letter for letter against the pinned sources (CI "verify").
// LLM verdicts here only rank findings for a human; they never pass or fail anything, and this
// workflow never edits quests, excerpts, pins or tests. The only file it writes is an APPENDED
// section of docs/learning-accuracy-review.md (set {write: false} to skip that).
// args (all optional): { cap: 5, offset: 0, quests: ['packages/quests/src/lib/quest-02-halving.ts'], maxFindingsPerQuest: 8, write: true }
// @dry-run-args {"cap": 2, "write": false}

const A = args || {};
const CAP = Math.min(Math.max(Number(A.cap) || 5, 1), 30);
const OFFSET = Math.max(Number(A.offset) || 0, 0);
const MAX_FINDINGS = Math.min(
  Math.max(Number(A.maxFindingsPerQuest) || 8, 1),
  20,
);
const READ_ONLY =
  'Read-only: do not edit, create or delete repo files; do not run git commit/push, gh, npm install, or deploy commands. You may read files, use git (log/show/ls-remote/fetch into /tmp), rg, and open public URLs.';

const FINDING = {
  type: 'object',
  required: ['claim', 'file_line', 'lens', 'problem', 'severity', 'evidence'],
  properties: {
    claim: {
      type: 'string',
      description: 'the exact sentence, annotation or quiz answer at issue',
    },
    file_line: { type: 'string' },
    excerpt: {
      type: 'string',
      description: 'excerpt constant or ref the claim explains, if any',
    },
    lens: { type: 'string', enum: ['correct', 'current', 'source-real'] },
    problem: { type: 'string' },
    severity: {
      type: 'string',
      enum: ['wrong', 'misleading', 'stale', 'minor'],
    },
    evidence: {
      type: 'string',
      description: 'source URL + date, pinned file:line, or command output',
    },
    suggested_fix: { type: 'string' },
  },
};
const REVIEW = {
  type: 'object',
  required: ['quest', 'unit_status', 'claims_checked', 'findings'],
  properties: {
    quest: { type: 'string' },
    unit_status: { type: 'string', enum: ['reviewed', 'skipped', 'blocked'] },
    status_reason: { type: 'string' },
    claims_checked: { type: 'integer' },
    findings: { type: 'array', items: FINDING },
  },
};
const VERDICT = {
  type: 'object',
  required: ['refuted', 'reason'],
  properties: {
    refuted: { type: 'boolean' },
    unable_to_check: {
      type: 'boolean',
      description: 'true if the source could not be opened',
    },
    reason: { type: 'string' },
    evidence: { type: 'string' },
  },
};
const LENSES = [
  {
    key: 'correct',
    ask: 'Is the claim wrong as a statement about Bitcoin/Lightning, or does the annotation misdescribe the excerpt it sits beside? Read the excerpt lines yourself.',
  },
  {
    key: 'current',
    ask: 'Is the claim stale? Compare the pinned file with the same path on the upstream default branch today (git fetch into /tmp, or the GitHub web view) and check dated facts (BIP status, Core defaults, release numbers).',
  },
  {
    key: 'source-real',
    ask: 'Does the cited source exist and say this? Resolve the excerpt ref (file, startLine..endLine) at the pinned commit, and open any cited URL.',
  },
];

phase('Discover');
const found = await agent(
  `In bitcoin4plebs, list every quest module (packages/quests/src/lib/quest-*.ts, sorted, excluding quest-slugs.ts) and the pins in packages/quests/src/lib/excerpts.ts (repo + commit). Record HEAD SHA. ${READ_ONLY}`,
  {
    label: 'discover',
    phase: 'Discover',
    schema: {
      type: 'object',
      required: ['sha', 'quests', 'pins'],
      properties: {
        sha: { type: 'string' },
        quests: { type: 'array', items: { type: 'string' } },
        pins: {
          type: 'array',
          items: {
            type: 'object',
            required: ['repo', 'commit'],
            properties: {
              repo: { type: 'string' },
              commit: { type: 'string' },
            },
          },
        },
      },
    },
  },
);
const all =
  Array.isArray(A.quests) && A.quests.length ? A.quests : found.quests;
const slice = all.slice(OFFSET, OFFSET + CAP);
log(
  `Reviewing ${slice.length} of ${all.length} quests (offset ${OFFSET}, cap ${CAP}); ${all.length - slice.length} not in this run. Up to ${MAX_FINDINGS} findings per quest go to verification.`,
);

const reviews = await pipeline(
  slice,
  (file) =>
    agent(
      `Review ${file} in bitcoin4plebs at ${found.sha} for accuracy. Pins: ${JSON.stringify(found.pins)}.
Check every factual sentence, stop annotation, quiz answer, recap and glossary use in this quest. Use three lenses: correct (true, and does the annotation describe the excerpt beside it), current (still true today upstream; dated facts are dated), source-real (the excerpt ref and any URL resolve and say it). Report only substantiated problems, each with evidence; don't report style. Excerpt text itself is already diffed letter for letter in CI, so don't re-diff bytes. Return at most ${MAX_FINDINGS} findings, most serious first, and the number of claims you checked. ${READ_ONLY}`,
      {
        label: `review:${file.split('/').pop()}`,
        phase: 'Review',
        schema: REVIEW,
      },
    ),
  (review, file) =>
    parallel(
      (review.findings || [])
        .slice(0, MAX_FINDINGS)
        .map(
          (f) => () =>
            parallel(
              LENSES.map(
                (l) => () =>
                  agent(
                    `You are a fresh skeptic with no access to the reviewer's reasoning. Try to REFUTE this finding about ${file} (bitcoin4plebs, pins ${JSON.stringify(found.pins)}). Lens: ${l.ask}\nIf you cannot open a needed source, set unable_to_check=true rather than guessing.\n\nFinding: ${JSON.stringify(f)}\n\n${READ_ONLY}`,
                    {
                      label: `${l.key}:${f.file_line}`.slice(0, 60),
                      phase: 'Verify',
                      schema: VERDICT,
                    },
                  ),
              ),
            ).then((votes) => ({ ...f, quest: file, votes })),
        ),
    ).then((checked) => ({ ...review, quest: file, checked })),
);

// Reduce in code: count guard + majority rule. A finding survives if at least 2 of the 3 lenses
// that could check it did not refute it; if fewer than 2 lenses could check it, it is "unverified".
const missing = slice.filter((_, i) => !reviews[i]);
const returned = reviews.filter(Boolean);
const units = { reviewed: 0, skipped: 0, blocked: 0 };
returned.forEach((r) => {
  units[r.unit_status] = (units[r.unit_status] || 0) + 1;
});
const confirmed = [];
const unverified = [];
let refuted = 0;
for (const r of returned) {
  for (const f of r.checked || []) {
    if (!f) continue;
    const able = (f.votes || []).filter((v) => v && !v.unable_to_check);
    const standing = able.filter((v) => !v.refuted).length;
    if (able.length < 2)
      unverified.push({ ...f, note: `${able.length}/3 lenses could check it` });
    else if (standing >= 2) confirmed.push(f);
    else refuted++;
  }
}
const rank = { wrong: 0, misleading: 1, stale: 2, minor: 3 };
confirmed.sort((x, y) => rank[x.severity] - rank[y.severity]);
log(
  `Quests returned ${returned.length}/${slice.length}; findings confirmed ${confirmed.length}, unverified ${unverified.length}, refuted ${refuted}.`,
);

phase('Gate');
const gate = await agent(
  `Run the existing deterministic gate in bitcoin4plebs and report it verbatim: fetch the four pinned sources into /tmp exactly as .github/workflows/ci.yml does (same commits from packages/quests/src/lib/excerpts.ts), then run "npx nx run-many -t test" with BITCOIN_SRC, BIPS_SRC, BOLTS_SRC and LND_SRC set. Report pass/fail with counts. If the sources can't be fetched, say the gate was NOT run; do not report it as passing. Do not edit files.`,
  {
    label: 'gate',
    phase: 'Gate',
    schema: {
      type: 'object',
      required: ['ran', 'passed', 'summary'],
      properties: {
        ran: { type: 'boolean' },
        passed: { type: 'boolean' },
        summary: { type: 'string' },
      },
    },
  },
);

phase('Report');
const coverage = {
  expected: slice.length,
  returned: returned.length,
  missing,
  units,
  notInRun: all.length - slice.length,
  total: all.length,
};
const report = await agent(
  `Write a concise Markdown section titled "Quest accuracy check (workflow run, <today's date from the date command>, ${found.sha.slice(0, 7)})" from this data only. Order: coverage (returned/expected, quests not in this run, missing quests by name), the deterministic gate result (it is the pass/fail; LLM verdicts are advisory), confirmed findings ranked by severity as a table (quest, file:line, claim, problem, evidence, suggested fix), unverified findings (could not be checked, not refuted), and the refuted count. Never call a partial run complete.
${A.write === false ? 'Return the Markdown only; do not write any file.' : 'APPEND it to docs/learning-accuracy-review.md (append only; never rewrite or delete existing content; touch no other file), then return the same Markdown.'}

Coverage: ${JSON.stringify(coverage)}
Gate: ${JSON.stringify(gate)}
Confirmed: ${JSON.stringify(confirmed)}
Unverified: ${JSON.stringify(unverified)}
Refuted: ${refuted}`,
  { label: 'report', phase: 'Report' },
);

return {
  sha: found.sha,
  coverage,
  gate,
  confirmed,
  unverified,
  refuted,
  report,
};
