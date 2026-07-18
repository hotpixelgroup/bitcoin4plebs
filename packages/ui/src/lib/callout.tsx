import type { ReactNode } from 'react';

/** Bordered aside box for verdicts, honesty notes, and closing thoughts. */
export function Callout({ children }: { children: ReactNode }) {
  return <div className="callout">{children}</div>;
}
