import { useState } from 'react';

/**
 * Quest progress, kept only in the reader's browser (localStorage) —
 * fitting, for a site whose whole point is that verification is personal.
 * Maps quest slug → ISO date the reader marked it verified.
 */
const STORAGE_KEY = 'b4p.verified.v1';

function read(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function write(next: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing or a full quota — progress just won't persist.
  }
}

/** Per-quest reading position: the furthest stop the reader has seen. */
const READ_KEY = 'b4p.read.v1';

export interface ReadPosition {
  stop: number;
  total: number;
  at: string;
}

function readPositions(): Record<string, ReadPosition> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, ReadPosition>)
      : {};
  } catch {
    return {};
  }
}

/** Record the furthest stop reached on a quest (monotonic per quest). */
export function recordReadPosition(slug: string, stop: number, total: number): void {
  try {
    const all = readPositions();
    const prev = all[slug];
    if (prev && prev.stop >= stop) return;
    all[slug] = { stop, total, at: new Date().toISOString() };
    localStorage.setItem(READ_KEY, JSON.stringify(all));
  } catch {
    // Private browsing: resume just won't persist.
  }
}

/** The most recently touched, unfinished quest to offer as "Continue…". */
export function latestReadPosition(
  verified: Record<string, string>
): { slug: string; pos: ReadPosition } | null {
  const all = readPositions();
  let best: { slug: string; pos: ReadPosition } | null = null;
  for (const [slug, pos] of Object.entries(all)) {
    if (verified[slug]) continue;
    if (!best || pos.at > best.pos.at) best = { slug, pos };
  }
  return best;
}

/** True when this browser has never read or verified anything here. */
export function isFreshVisitor(verified: Record<string, string>): boolean {
  return Object.keys(verified).length === 0 && Object.keys(readPositions()).length === 0;
}

/** Read + toggle the reader's "I verified this myself" marks. */
export function useVerifiedQuests() {
  const [verified, setVerified] = useState<Record<string, string>>(read);

  const toggle = (slug: string) => {
    setVerified((prev) => {
      const next = { ...prev };
      if (next[slug]) {
        delete next[slug];
      } else {
        next[slug] = new Date().toISOString();
      }
      write(next);
      return next;
    });
  };

  return { verified, toggle };
}
