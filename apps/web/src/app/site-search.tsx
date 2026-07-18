import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { glossary, quests } from '@bitcoin4plebs/quests';

/**
 * Site-wide search: one client-side index over quest titles, stops, and
 * the whole glossary, opened with the header button, "/" or Cmd/Ctrl-K.
 * A newbie who only knows the words "private key" gets a way in without
 * reading everything.
 */

interface Hit {
  kind: 'quest' | 'stop' | 'term';
  title: string;
  detail: string;
  to: string;
  haystack: string;
}

const INDEX: Hit[] = [
  ...quests.map((quest): Hit => ({
    kind: 'quest',
    title: `Quest #${quest.number}: ${quest.title}`,
    detail: quest.summary,
    to: `/quests/${quest.slug}`,
    haystack: `${quest.title} ${quest.summary}`.toLowerCase(),
  })),
  ...quests.flatMap((quest) =>
    quest.stops.map((stop): Hit => ({
      kind: 'stop',
      title: stop.title,
      detail: `Quest #${quest.number} · ${quest.title}`,
      to: `/quests/${quest.slug}#${stop.id}`,
      haystack: `${stop.title} ${stop.takeaway}`.toLowerCase(),
    }))
  ),
  ...glossary.map((entry): Hit => ({
    kind: 'term',
    title: entry.term,
    detail: entry.definition.replace(/\*\*|\*|`/g, '').slice(0, 110),
    to: '/glossary',
    haystack: `${entry.term} ${entry.definition}`.toLowerCase(),
  })),
];

function search(query: string): Hit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const scored = INDEX.map((hit) => {
    const inTitle = hit.title.toLowerCase().indexOf(q);
    const inBody = hit.haystack.indexOf(q);
    if (inTitle === -1 && inBody === -1) return null;
    const score = (inTitle === -1 ? 100 : inTitle) + (hit.kind === 'term' ? 0 : 5);
    return { hit, score };
  }).filter((s): s is { hit: Hit; score: number } => s !== null);
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, 12).map((s) => s.hit);
}

const KIND_LABEL = { quest: 'quest', stop: 'stop', term: 'glossary' } as const;

export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const hits = useMemo(() => search(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      // Focus after the dialog paints.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && hits.length > 0) {
        navigate(hits[0].to);
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hits, navigate, onClose]);

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" role="dialog" aria-label="Search the site" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          placeholder="Search quests, stops, and the glossary…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.trim().length >= 2 && (
          <div className="search-results">
            {hits.length === 0 && <p className="search-empty">Nothing matches “{query}”.</p>}
            {hits.map((hit, i) => (
              <button
                key={`${hit.to}-${i}`}
                className="search-hit"
                onClick={() => {
                  navigate(hit.to);
                  onClose();
                }}
              >
                <span className={`search-kind search-kind-${hit.kind}`}>{KIND_LABEL[hit.kind]}</span>
                <span className="search-hit-main">
                  <span className="search-hit-title">{hit.title}</span>
                  <span className="search-hit-detail">{hit.detail}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="search-foot">
          <span>↵ opens the first result</span>
          <span>esc closes</span>
        </div>
      </div>
    </div>
  );
}
