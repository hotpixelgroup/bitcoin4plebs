/**
 * Resolved by a Vite alias to one site's registry, picked from VITE_SITE at
 * build time (see apps/web/vite.config.ts). Importing the combined `quests`
 * export from @bitcoin4plebs/quests instead would put the other site's
 * curriculum back into the bundle.
 */
declare module '@site-quests' {
  import type { Quest } from '@bitcoin4plebs/quests/content';
  export const quests: Quest[];
}
