import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BITCOIN_PIN, OVERRIDE_PINS } from './excerpts.js';
import { GLOSSARY_CATEGORIES, glossary, glossaryForSite } from './glossary.js';
import { entryPaths, prerequisites } from './paths.js';
import { quests, questsForSite, siteOf } from './registry.js';
import { QUEST_SLUGS } from './quest-slugs.js';
import { SITE_IDS, sites } from './sites.js';

/**
 * Integrity tests for quest content. The second block is the important
 * one: point BITCOIN_SRC at any Bitcoin Core checkout at the pinned
 * commit, and every excerpt on the site is diffed VERBATIM against the
 * real source, "don't trust, verify" applied to ourselves.
 *
 *   BITCOIN_SRC=~/bitcoin npx nx test @bitcoin4plebs/quests
 */

describe('quest content integrity', () => {
  it('has globally unique ids and slugs', () => {
    // Slugs must be unique across BOTH front doors: one router serves both.
    expect(new Set(quests.map((q) => q.id)).size).toBe(quests.length);
    expect(new Set(quests.map((q) => q.slug)).size).toBe(quests.length);
  });

  it('numbers each site\'s curriculum sequentially, from its own start', () => {
    for (const site of SITE_IDS) {
      const curriculum = questsForSite(site);
      if (!curriculum.length) continue;
      curriculum.forEach((q, i) =>
        expect(q.number, `${site} ${q.id}`).toBe(curriculum[0].number + i)
      );
    }
  });

  it('declares every quest against a site that exists', () => {
    for (const quest of quests) {
      expect(SITE_IDS, quest.id).toContain(siteOf(quest));
    }
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

  it('pins every quest on a site to that site\'s one primary commit', () => {
    const declared = [BITCOIN_PIN, ...OVERRIDE_PINS].map((p) => p.commit);
    for (const site of SITE_IDS) {
      const curriculum = questsForSite(site);
      for (const quest of curriculum) {
        expect(quest.pin.commit, quest.id).toMatch(/^[0-9a-f]{40}$/);
        // A site speaks with one primary voice; other repos come in as
        // per-excerpt pin overrides, checked just as strictly.
        expect(quest.pin.commit, quest.id).toBe(curriculum[0].pin.commit);
        expect(declared, `${quest.id} pins an undeclared commit`).toContain(quest.pin.commit);
      }
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
  it('every quest carries a chapter with a stage label', () => {
    for (const quest of quests) {
      expect(quest.story?.stage, quest.id).toBeTruthy();
      expect((quest.story?.stage as string).length, quest.id).toBeLessThanOrEqual(20);
      expect(quest.story?.text.length, quest.id).toBeGreaterThan(80);
    }
  });

  it('runs one story per site, with no repeated stage inside it', () => {
    // Each front door follows its own running payment, so a stage label
    // only has to be unique within its own story: the journey rail is
    // built from one site's quests, never from both.
    for (const site of SITE_IDS) {
      const stages = questsForSite(site).map((q) => q.story?.stage);
      expect(new Set(stages).size, `${site} repeats a story stage`).toBe(stages.length);
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
  const numbersFor = (site: (typeof SITE_IDS)[number]) =>
    new Set(questsForSite(site).map((q) => q.number));

  it('every entry path names three real quests on its own site', () => {
    expect(new Set(entryPaths.map((p) => p.id)).size).toBe(entryPaths.length);
    for (const path of entryPaths) {
      const site = path.site ?? 'bitcoin';
      const numbers = numbersFor(site);
      expect(path.questNumbers.length, path.id).toBe(3);
      for (const n of path.questNumbers) {
        expect(numbers.has(n), `${path.id} → ${site} Quest #${n}`).toBe(true);
      }
      expect(path.blurb.length, path.id).toBeGreaterThan(40);
    }
  });

  it('prerequisites reference only real quests on the same site, never themselves', () => {
    for (const site of SITE_IDS) {
      const numbers = numbersFor(site);
      for (const [quest, deps] of Object.entries(prerequisites[site])) {
        const n = Number(quest);
        expect(numbers.has(n), `${site} Quest #${quest}`).toBe(true);
        for (const dep of deps) {
          expect(numbers.has(dep), `${site} Quest #${quest} → #${dep}`).toBe(true);
          expect(dep, `${site} Quest #${quest} depends on itself`).not.toBe(n);
        }
      }
    }
  });
});

describe('the quest slug index', () => {
  it('matches the real registries exactly, in both directions', () => {
    // It exists so a site can deep-link into its sibling without importing
    // the sibling's quest data. That only works if it stays true.
    for (const site of SITE_IDS) {
      const real = Object.fromEntries(questsForSite(site).map((q) => [q.number, q.slug]));
      expect(QUEST_SLUGS[site], `${site} slug index has drifted`).toEqual(real);
    }
  });
});

describe('cross-site signposting', () => {
  it("every site's curriculum links to the other one somewhere in its prose", () => {
    // The two sites are one project. A reader deep in either curriculum
    // should meet the other without having to go looking for it.
    for (const site of SITE_IDS) {
      const curriculum = questsForSite(site);
      if (!curriculum.length) continue;
      const siblingUrl = sites[site].sibling.url;
      const prose = JSON.stringify(curriculum);
      expect(
        prose.includes(siblingUrl),
        `no ${site} quest links to ${siblingUrl}`
      ).toBe(true);
    }
  });

  it('links to the sibling only at its real URL', () => {
    for (const site of SITE_IDS) {
      const other = sites[site].sibling;
      const prose = JSON.stringify(questsForSite(site));
      // Catch a link to the sibling's bare name or a wrong host.
      const links = prose.match(/https:\/\/[^)"\\ ]+/g) ?? [];
      for (const link of links) {
        if (link.includes(other.name)) {
          expect(link.startsWith(other.url), `${site}: bad sibling link ${link}`).toBe(true);
        }
      }
    }
  });
});

describe('site configuration integrity', () => {
  it('declares a config for every site, keyed by its own id', () => {
    for (const site of SITE_IDS) {
      expect(sites[site].id, site).toBe(site);
      expect(sites[site].repo.length, site).toBeGreaterThan(0);
      expect(sites[site].hero.blurb.length, site).toBeGreaterThan(80);
    }
  });

  it('gives every track a home-page blurb, and every blurb a track', () => {
    for (const site of SITE_IDS) {
      const used = new Set(questsForSite(site).map((q) => q.track ?? 'Foundations'));
      for (const track of used) {
        expect(sites[site].trackBlurbs[track], `${site} track "${track}" has no blurb`).toBeTruthy();
      }
      // The reverse: a blurb for a track no quest uses is dead copy.
      for (const track of Object.keys(sites[site].trackBlurbs)) {
        if (!questsForSite(site).length) continue;
        expect(used.has(track), `${site} blurb for unused track "${track}"`).toBe(true);
      }
    }
  });

  it('points each site at the other one, with something to say about it', () => {
    for (const site of SITE_IDS) {
      const sibling = sites[site].sibling;
      expect(sibling.id, site).not.toBe(site);
      expect(sites[sibling.id].name, site).toBe(sibling.name);
      expect(sibling.url, site).toBe(sites[sibling.id].url);
      expect(sibling.url, site).toMatch(/^https:\/\/.*\/$/);
      // A bare link is not a signpost: each site owes the reader a reason.
      expect(sibling.label.length, site).toBeGreaterThan(5);
      expect(sibling.blurb.length, site).toBeGreaterThan(80);
      expect(sibling.covers.length, site).toBe(3);
      for (const item of sibling.covers) expect(item.length, site).toBeGreaterThan(15);
    }
  });
});

describe('glossary integrity', () => {
  it('has non-empty definitions', () => {
    for (const entry of glossary) {
      expect(entry.definition.length, entry.term).toBeGreaterThan(40);
    }
  });

  it('defines each term exactly once on each site', () => {
    // A term may appear twice in the source, once per front door, so that
    // each reader is sent to the proof on their own site. What must never
    // happen is the same reader seeing a term defined twice.
    for (const site of SITE_IDS) {
      const terms = glossaryForSite(site).map((e) => e.term);
      const seen = new Set(terms);
      expect([...seen].length, `${site} defines a term more than once`).toBe(terms.length);
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

  it('cross-links only to quests that exist, on the site it names', () => {
    for (const entry of glossary) {
      if (entry.quest === undefined) continue;
      const site = entry.questSite ?? 'bitcoin';
      const numbers = new Set(questsForSite(site).map((q) => q.number));
      expect(numbers.has(entry.quest), `${entry.term} → ${site} Quest #${entry.quest}`).toBe(true);
    }
  });

  it('never restricts an entry to one site while citing the other', () => {
    for (const entry of glossary) {
      if (entry.site && entry.questSite && entry.site !== entry.questSite) {
        throw new Error(`${entry.term} is ${entry.site}-only but cites a ${entry.questSite} quest`);
      }
    }
  });
});

/** Repo name → local checkout env var, one entry per pinned source. */
const SRC_ENV: Record<string, string | undefined> = {
  'bitcoin/bitcoin': process.env['BITCOIN_SRC'],
  'bitcoin/bips': process.env['BIPS_SRC'],
  'lightning/bolts': process.env['BOLTS_SRC'],
  'lightningnetwork/lnd': process.env['LND_SRC'],
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
        const repo = pin?.repo ?? quest.pin.repo;
        // Locally any checkout may be absent; the CI guard above makes them
        // all mandatory where it matters.
        if (!available(repo)) continue;
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
