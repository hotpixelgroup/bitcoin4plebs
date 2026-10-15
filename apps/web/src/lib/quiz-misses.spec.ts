import { beforeEach, describe, expect, it, vi } from 'vitest';
import { questsForSite } from '@bitcoin4plebs/quests';
import { SITE, siteQuests } from './site';
import { MISS_KEY, readMisses, recordMiss, writeMisses } from './quiz-misses';
const own = siteQuests.flatMap((q) => q.stops.flatMap((s) => s.quiz ?? []))[0];
const sibling = questsForSite(SITE.id === 'bitcoin' ? 'lightning' : 'bitcoin')
  .flatMap((q) => q.stops.flatMap((s) => s.quiz ?? []))
  .find((q) => q.question !== own.question)!;
beforeEach(() => localStorage.clear());
describe('site quiz storage', () => {
  it('imports only this curriculum, preserves legacy and imports once', () => {
    const legacy = JSON.stringify({
      [own.question]: { ...own, cleared: 1 },
      [sibling.question]: { ...sibling, cleared: 0 },
    });
    localStorage.setItem('b4p.quiz-misses.v1', legacy);
    expect(readMisses()).toEqual({ [own.question]: { ...own, cleared: 1 } });
    expect(localStorage.getItem('b4p.quiz-misses.v1')).toBe(legacy);
    writeMisses({});
    expect(readMisses()).toEqual({});
  });
  it('records misses using the site namespace and current answer', () => {
    recordMiss(own);
    expect(MISS_KEY).toBe(
      `${SITE.id === 'bitcoin' ? 'b4p' : 'l4p'}.quiz-misses.v2`,
    );
    expect(readMisses()[own.question]).toEqual({ ...own, cleared: 0 });
    expect(localStorage.getItem('b4p.quiz-misses.v1')).toBeNull();
  });
  it('tolerates malformed or unavailable storage without deleting it', () => {
    localStorage.setItem('b4p.quiz-misses.v1', '{broken');
    expect(readMisses()).toEqual({});
    expect(localStorage.getItem('b4p.quiz-misses.v1')).toBe('{broken');
  });
  it('keeps an existing current-site record when legacy data is malformed', () => {
    writeMisses({ [own.question]: { ...own, cleared: 1 } });
    localStorage.setItem('b4p.quiz-misses.v1', '{broken');
    expect(readMisses()[own.question].cleared).toBe(1);
    expect(localStorage.getItem('b4p.quiz-misses.v1')).toBe('{broken');
  });
  it('degrades safely when browser storage is denied', () => {
    const get = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    const set = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('denied');
      });
    try {
      expect(readMisses()).toEqual({});
      expect(() => recordMiss(own)).not.toThrow();
    } finally {
      get.mockRestore();
      set.mockRestore();
    }
  });
  it('does not reset progress on repeated imports', () => {
    localStorage.setItem(
      'b4p.quiz-misses.v1',
      JSON.stringify({ [own.question]: { ...own, cleared: 0 } }),
    );
    readMisses();
    writeMisses({ [own.question]: { ...own, cleared: 1 } });
    expect(readMisses()[own.question].cleared).toBe(1);
  });
});
