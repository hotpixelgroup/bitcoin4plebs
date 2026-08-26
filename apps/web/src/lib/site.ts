import {
  BITCOIN_PIN,
  OVERRIDE_PINS,
  entryPathsForSite,
  glossaryForSite,
  prerequisitesForSite,
  questionsForSite,
  questsForSite,
  resolveSite,
  sites,
  type Quest,
  type SourcePin,
} from '@bitcoin4plebs/quests';

/**
 * Which front door this build is.
 *
 * bitcoin4plebs and lightning4plebs are the same source, built twice.
 * VITE_SITE picks the curriculum, the brand and the home page; everything
 * else — the quest engine, the search, the design system — is shared by
 * being literally the same code, so it cannot drift between them.
 *
 * Absent or unrecognised means Bitcoin, so a plain `nx dev web` and every
 * existing build keep behaving exactly as they did.
 */
export const SITE = sites[resolveSite(import.meta.env.VITE_SITE as string | undefined)];

/** This site's curriculum, in order. */
export const siteQuests: Quest[] = questsForSite(SITE.id);

/** This site's glossary (terms shared by both sites appear in each). */
export const siteGlossary = glossaryForSite(SITE.id);

/** This site's question-first index. */
export const siteQuestions = questionsForSite(SITE.id);

/** This site's "why are you here?" on-ramps. */
export const siteEntryPaths = entryPathsForSite(SITE.id);

/** This site's advisory curriculum dependencies. */
export const sitePrerequisites = prerequisitesForSite(SITE.id);

/**
 * Look up a quest by slug WITHIN this site. Slugs are globally unique, so
 * this deliberately returns nothing for the sibling site's quests rather
 * than rendering them inside the wrong brand.
 */
export function getSiteQuest(slug: string): Quest | undefined {
  return siteQuests.find((quest) => quest.slug === slug);
}

/** Storage keys are namespaced per site: both share one origin on GitHub Pages. */
export const STORAGE_PREFIX = SITE.id === 'lightning' ? 'l4p' : 'b4p';

/**
 * The pin this site speaks with: the repo named in its header. Other repos
 * still appear as per-excerpt overrides, checked in CI just as strictly.
 */
export const SITE_PIN: SourcePin =
  [BITCOIN_PIN, ...OVERRIDE_PINS].find((pin) => pin.repo === SITE.pinLabel) ?? BITCOIN_PIN;

/** The pinned commit, abbreviated the way GitHub does it. */
export const SITE_PIN_SHORT = SITE_PIN.commit.slice(0, 7);

/** This site's own repository on GitHub. */
export const SITE_REPO_URL = `https://github.com/hotpixelgroup/${SITE.repo}`;

/**
 * An absolute URL to a quest on the OTHER front door. Glossary terms are
 * shared between the sites, so a definition proven on the sibling should
 * still send the reader to the proof rather than to a dead end.
 */
export function siblingQuestUrl(number: number): string | undefined {
  const quest = questsForSite(SITE.sibling.id).find((q) => q.number === number);
  return quest ? `${SITE.sibling.url}quests/${quest.slug}` : undefined;
}

/**
 * Stamp which front door this build is onto the root element. The
 * stylesheet keys its accent tokens off this attribute, so the two sites
 * share every rule and differ only in the handful of brand colours.
 *
 * Called from the entry point rather than from a component effect, so the
 * first paint is already themed.
 */
export function applySiteTheme(root: HTMLElement = document.documentElement): void {
  root.dataset['site'] = SITE.id;
}
