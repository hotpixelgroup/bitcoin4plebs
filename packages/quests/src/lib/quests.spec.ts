import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLOSSARY_CATEGORIES, glossary } from './glossary.js';
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
    quests.forEach((q, i) => expect(q.number).toBe(i + 1));
  });

  it('every excerpt’s lines match its declared line range, in order', () => {
    for (const quest of quests) {
      const excerpts = [
        ...quest.stops.map((s) => s.excerpt),
        ...(quest.finale?.translation ? [quest.finale.translation] : []),
      ];
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

const BITCOIN_SRC = process.env['BITCOIN_SRC'];
const srcAvailable = !!BITCOIN_SRC && existsSync(BITCOIN_SRC);

describe('the verbatim check itself', () => {
  it('cannot be silently skipped in CI', () => {
    // Locally the check is optional (point BITCOIN_SRC at a checkout to run
    // it); in CI the workflow fetches the pinned source, so absence there
    // means the site's core integrity claim is no longer being tested.
    if (process.env['CI']) {
      expect(srcAvailable, 'CI must set BITCOIN_SRC to a pinned Bitcoin Core checkout').toBe(true);
    }
  });
});

describe.skipIf(!srcAvailable)('excerpts are VERBATIM from Bitcoin Core (BITCOIN_SRC)', () => {
  it('every quoted line matches the source file exactly', () => {
    for (const quest of quests) {
      for (const stop of quest.stops) {
        const { ref, lines } = stop.excerpt;
        const filePath = join(BITCOIN_SRC as string, ref.file);
        const source = readFileSync(filePath, 'utf8').split('\n');
        for (const line of lines) {
          const actual = source[line.n - 1];
          expect(actual, `${quest.id}/${stop.id} ${ref.file}:${line.n}`).toBe(line.text);
        }
      }
    }
  });
});
