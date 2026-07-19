import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OVERRIDE_PINS } from './excerpts.js';
import { GLOSSARY_CATEGORIES, glossary } from './glossary.js';
import { entryPaths, prerequisites } from './paths.js';
import { quests } from './registry.js';

/**
 * Integrity tests for quest content. The second block is the important
 * one: point BITCOIN_SRC at any Bitcoin Core checkout at the pinned
 * commit, and every excerpt on the site is diffed VERBATIM against the
 * real source — "don't trust, verify" applied to ourselves.
 *
 *   BITCOIN_SRC=~/bitcoin npx nx test @bitcoin4plebs/quests
 */

describe('quest content integrity', () => {
  it('has unique ids, slugs, and sequential numbers', () => {
    expect(new Set(quests.map((q) => q.id)).size).toBe(quests.length);
    expect(new Set(quests.map((q) => q.slug)).size).toBe(quests.length);
    quests.forEach((q, i) => expect(q.number).toBe(quests[0].number + i));
  });

  it('every excerpt’s lines match its declared line range, in order', () => {
    for (const quest of quests) {
      const excerpts = [
        ...quest.stops.map((s) => s.excerpt),
        ...(quest.finale?.translation ? [quest.finale.translation] : []),
      ].filter((e): e is NonNullable<typeof e> => e !== undefined);
      for (const excerpt of excerpts) {
        expect(excerpt.lines.length).toBe(excerpt.ref.endLine - excerpt.ref.startLine + 1);
        excerpt.lines.forEach((line, i) => {
          expect(line.n).toBe(excerpt.ref.startLine + i);
        });
      }
    }
  });

  it('every quest shares the same pinned commit', () => {
    for (const quest of quests) {
      expect(quest.pin.commit).toMatch(/^[0-9a-f]{40}$/);
      expect(quest.pin.commit).toBe(quests[0].pin.commit);
    }
  });

  it('excerpt pin overrides all match a declared pin exactly', () => {
    for (const pin of OVERRIDE_PINS) {
      expect(pin.commit, pin.repo).toMatch(/^[0-9a-f]{40}$/);
    }
    for (const quest of quests) {
      for (const stop of quest.stops) {
        if (stop.excerpt?.pin) {
          const declared = OVERRIDE_PINS.find((p) => p.repo === stop.excerpt?.pin?.repo);
          expect(declared, `${quest.id}/${stop.id}: unknown repo ${stop.excerpt.pin.repo}`).toBeTruthy();
          expect(stop.excerpt.pin.commit, `${quest.id}/${stop.id}`).toBe(declared?.commit);
        }
      }
    }
  });
});

describe('quiz and myth integrity', () => {
  it('every quiz answer is a valid option index with an explanation', () => {
    for (const quest of quests) {
      for (const stop of quest.stops) {
        for (const item of stop.quiz ?? []) {
          expect(item.options.length, `${quest.id}/${stop.id}`).toBeGreaterThanOrEqual(2);
          expect(item.answer, `${quest.id}/${stop.id}`).toBeGreaterThanOrEqual(0);
          expect(item.answer, `${quest.id}/${stop.id}`).toBeLessThan(item.options.length);
          expect(item.explain.length, `${quest.id}/${stop.id}`).toBeGreaterThan(20);
        }
        if (stop.myth) {
          expect(stop.myth.belief.length, `${quest.id}/${stop.id}`).toBeGreaterThan(10);
          expect(stop.myth.reality.length, `${quest.id}/${stop.id}`).toBeGreaterThan(20);
        }
      }
    }
  });
});

describe('story thread integrity', () => {
  it('every quest carries a chapter with a unique stage label', () => {
    const stages = quests.map((q) => q.story?.stage);
    for (const [i, stage] of stages.entries()) {
      expect(stage, quests[i].id).toBeTruthy();
      expect((stage as string).length, quests[i].id).toBeLessThanOrEqual(20);
    }
    expect(new Set(stages).size).toBe(quests.length);
    for (const quest of quests) {
      expect(quest.story?.text.length, quest.id).toBeGreaterThan(80);
    }
  });
});

describe('try-it-in-the-wild integrity', () => {
  it('every quest sends the reader into the world with one concrete action', () => {
    for (const quest of quests) {
      expect(quest.recap.tryIt, quest.id).toBeTruthy();
      expect((quest.recap.tryIt as string).length, quest.id).toBeGreaterThan(40);
    }
  });
});

describe('entry paths and prerequisites integrity', () => {
  const numbers = new Set(quests.map((q) => q.number));

  it('every entry path names three real quests and a unique id', () => {
    expect(new Set(entryPaths.map((p) => p.id)).size).toBe(entryPaths.length);
    for (const path of entryPaths) {
      expect(path.questNumbers.length, path.id).toBe(3);
      for (const n of path.questNumbers) {
        expect(numbers.has(n), `${path.id} → Quest #${n}`).toBe(true);
      }
      expect(path.blurb.length, path.id).toBeGreaterThan(40);
    }
  });

  it('prerequisites reference only real quests, never themselves', () => {
    for (const [quest, deps] of Object.entries(prerequisites)) {
      const n = Number(quest);
      expect(numbers.has(n), `Quest #${quest}`).toBe(true);
      for (const dep of deps) {
        expect(numbers.has(dep), `Quest #${quest} → #${dep}`).toBe(true);
        expect(dep, `Quest #${quest} depends on itself`).not.toBe(n);
      }
    }
  });
});

describe('glossary integrity', () => {
  it('has unique terms with non-empty definitions', () => {
    expect(new Set(glossary.map((e) => e.term)).size).toBe(glossary.length);
    for (const entry of glossary) {
      expect(entry.definition.length, entry.term).toBeGreaterThan(40);
    }
  });

  it('uses only declared categories, and every category has entries', () => {
    const declared = new Set<string>(GLOSSARY_CATEGORIES);
    for (const entry of glossary) {
      expect(declared.has(entry.category), `${entry.term}: ${entry.category}`).toBe(true);
    }
    for (const category of GLOSSARY_CATEGORIES) {
      expect(
        glossary.some((e) => e.category === category),
        category
      ).toBe(true);
    }
  });

  it('cross-links only to quests that exist', () => {
    const numbers = new Set(quests.map((q) => q.number));
    for (const entry of glossary) {
      if (entry.quest !== undefined) {
        expect(numbers.has(entry.quest), `${entry.term} → Quest #${entry.quest}`).toBe(true);
      }
    }
  });
});

/** Repo name → local checkout env var, one entry per pinned source. */
const SRC_ENV: Record<string, string | undefined> = {
  'bitcoin/bitcoin': process.env['BITCOIN_SRC'],
  'bitcoin/bips': process.env['BIPS_SRC'],
  'lightning/bolts': process.env['BOLTS_SRC'],
};
const available = (repo: string) => {
  const dir = SRC_ENV[repo];
  return !!dir && existsSync(dir);
};
const srcAvailable = available('bitcoin/bitcoin');

describe('the verbatim check itself', () => {
  it('cannot be silently skipped in CI', () => {
    // Locally the checks are optional (point BITCOIN_SRC / BIPS_SRC /
    // BOLTS_SRC at pinned checkouts to run them); in CI the workflow
    // fetches every pinned source, so absence there means the site's core
    // integrity claim is no longer being tested.
    if (process.env['CI']) {
      for (const repo of Object.keys(SRC_ENV)) {
        expect(available(repo), `CI must set the checkout env var for ${repo}`).toBe(true);
      }
    }
  });
});

describe.skipIf(!srcAvailable)('excerpts are VERBATIM from their pinned sources', () => {
  it('every quoted line matches the source file exactly', () => {
    for (const quest of quests) {
      for (const stop of quest.stops) {
        if (!stop.excerpt) continue;
        const { ref, lines, pin } = stop.excerpt;
        const repo = pin?.repo ?? 'bitcoin/bitcoin';
        // Locally the non-Core checkouts are optional; the CI guard above
        // makes them mandatory where it matters.
        if (repo !== 'bitcoin/bitcoin' && !available(repo)) continue;
        const filePath = join(SRC_ENV[repo] as string, ref.file);
        const source = readFileSync(filePath, 'utf8').split('\n');
        for (const line of lines) {
          const actual = source[line.n - 1];
          expect(actual, `${quest.id}/${stop.id} ${ref.file}:${line.n}`).toBe(line.text);
        }
      }
    }
  });
});
