import type { QuizItem } from '@bitcoin4plebs/quests/content';
import { STORAGE_PREFIX, siteQuests } from './site';

export type MissRecord = QuizItem & { cleared: number };
export const MISS_KEY = `${STORAGE_PREFIX}.quiz-misses.v2`;
const LEGACY_KEY = 'b4p.quiz-misses.v1';
const MIGRATION_KEY = `${MISS_KEY}.legacy-imported`;
const questions = new Map(
  siteQuests
    .flatMap((q) => q.stops.flatMap((s) => s.quiz ?? []))
    .map((q) => [q.question, q]),
);

function parse(raw: string | null): Record<string, MissRecord> {
  let value: unknown;
  try {
    value = raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, record]) => {
      const current = questions.get(key);
      if (!current || !record || typeof record !== 'object') return [];
      const cleared = (record as MissRecord).cleared === 1 ? 1 : 0;
      // Current curriculum supplies answer keys, never stale stored content.
      return [[key, { ...current, cleared }]];
    }),
  );
}

export function readMisses(): Record<string, MissRecord> {
  try {
    const current = parse(localStorage.getItem(MISS_KEY));
    if (!localStorage.getItem(MIGRATION_KEY)) {
      const merged = { ...parse(localStorage.getItem(LEGACY_KEY)), ...current };
      try {
        localStorage.setItem(MISS_KEY, JSON.stringify(merged));
        localStorage.setItem(MIGRATION_KEY, '1');
      } catch { /* Readable but full storage: still show recovered data for this visit. */ }
      // Keep the original intact for the sibling site's independent import.
      return merged;
    }
    return current;
  } catch {
    return {};
  }
}

export function writeMisses(all: Record<string, MissRecord>): void {
  try {
    localStorage.setItem(MISS_KEY, JSON.stringify(all));
  } catch {
    /* Storage unavailable. */
  }
}

export function recordMiss(item: QuizItem): void {
  writeMisses({ ...readMisses(), [item.question]: { ...item, cleared: 0 } });
}
