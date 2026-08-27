import type { Quest } from './types.js';
import type { SiteId } from './sites.js';
import { quests as bitcoinQuests } from './registry-bitcoin.js';
import { quests as lightningQuests } from './registry-lightning.js';

/**
 * Every quest across both front doors.
 *
 * The integrity tests need the whole set, so this file composes it. The
 * APP does not import from here: it imports one of the two per-site
 * registries directly, so a build of either site carries only its own
 * curriculum. Adding an import of `quests` to app code would silently
 * pull the other site's prose back into the bundle.
 */
export const quests: Quest[] = [...bitcoinQuests, ...lightningQuests];

export function getQuestBySlug(slug: string): Quest | undefined {
  return quests.find((q) => q.slug === slug);
}

/** Which site a quest belongs to; quests written before the split are Bitcoin's. */
export function siteOf(quest: Quest): SiteId {
  return quest.site ?? 'bitcoin';
}

/**
 * The curriculum for one front door, in order. Slugs stay globally unique
 * so the router never has to care which site it is serving.
 */
export function questsForSite(site: SiteId): Quest[] {
  return quests.filter((quest) => siteOf(quest) === site);
}
