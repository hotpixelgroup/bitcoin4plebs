/**
 * Everything the app needs EXCEPT the quest registries.
 *
 * The registries import every quest file, so any module that reaches them
 * pulls both curricula into the bundle. The app deliberately imports its
 * own curriculum through the '@site-quests' alias instead, and takes the
 * rest of the content model from here.
 *
 * If you find yourself adding an export from './lib/registry.js' to this
 * file, you are about to double the size of both sites.
 */
export * from './lib/types.js';
export * from './lib/sites.js';
export * from './lib/excerpts.js';
export * from './lib/glossary.js';
export * from './lib/questions.js';
export * from './lib/paths.js';
export * from './lib/quest-slugs.js';
