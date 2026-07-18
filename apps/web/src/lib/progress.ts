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
