import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { glossary, quests, type GlossaryEntry } from '@bitcoin4plebs/quests';
import { RichText } from './rich-text.js';

/**
 * Tap-to-define glossary terms, woven into prose and code excerpts.
 * Matching is driven entirely by the glossary data's `match` patterns:
 * lowercase patterns link case-insensitively in prose; identifier-style
 * patterns (capitals or underscores) link case-sensitively, including
 * inside code excerpts. First occurrence per text segment only, so pages
 * stay readable rather than becoming a sea of underlines.
 */

const slugByNumber = new Map(quests.map((quest) => [quest.number, quest.slug]));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isIdentifier = (p: string) => /[A-Z_]/.test(p);

const proseEntries: Array<{ pattern: string; entry: GlossaryEntry }> = [];
const identEntries: Array<{ pattern: string; entry: GlossaryEntry }> = [];
for (const entry of glossary) {
  for (const pattern of entry.match ?? []) {
    (isIdentifier(pattern) ? identEntries : proseEntries).push({ pattern, entry });
  }
}
// Longest pattern first so "difficulty adjustment" beats "difficulty".
proseEntries.sort((a, b) => b.pattern.length - a.pattern.length);
identEntries.sort((a, b) => b.pattern.length - a.pattern.length);

const PROSE_RE = proseEntries.length
  ? new RegExp(`\\b(${proseEntries.map((p) => escapeRe(p.pattern)).join('|')})\\b`, 'i')
  : null;
const IDENT_RE = identEntries.length
  ? new RegExp(`\\b(${identEntries.map((p) => escapeRe(p.pattern)).join('|')})\\b`)
  : null;

function entryForProse(matched: string): GlossaryEntry | undefined {
  const lower = matched.toLowerCase();
  return (
    proseEntries.find((p) => p.pattern.toLowerCase() === lower)?.entry ??
    identEntries.find((p) => p.pattern === matched)?.entry
  );
}

function entryForIdent(matched: string): GlossaryEntry | undefined {
  return identEntries.find((p) => p.pattern === matched)?.entry;
}

/** Exact-token lookup for `code` spans in prose markup. */
export function entryForCodeToken(token: string): GlossaryEntry | undefined {
  return (
    identEntries.find((p) => p.pattern === token)?.entry ??
    proseEntries.find((p) => p.pattern === token.toLowerCase())?.entry
  );
}

export interface GlossaryTermProps {
  entry: GlossaryEntry;
  children: ReactNode;
  /** Style the trigger as code (used inside code cards and `code` spans). */
  codeStyle?: boolean;
}

/** The dotted-underline trigger + fixed-position definition popover. */
export function GlossaryTerm({ entry, children, codeStyle }: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(340, window.innerWidth - 24);
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    if (rect.bottom > window.innerHeight - 240) {
      setPos({ left, bottom: window.innerHeight - rect.top + 8 });
    } else {
      setPos({ left, top: rect.bottom + 8 });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (popRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, { capture: true, passive: true });
    window.addEventListener('resize', close);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('resize', close);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const slug = entry.quest !== undefined ? slugByNumber.get(entry.quest) : undefined;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`term ${codeStyle ? 'term-code' : ''}`}
        aria-expanded={open}
        onClick={toggle}
      >
        {children}
      </button>
      {open && (
        <div
          ref={popRef}
          className="term-pop"
          role="dialog"
          aria-label={`Definition of ${entry.term}`}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom }}
        >
          <div className="term-pop-head">
            {entry.code ? <code>{entry.term}</code> : <strong>{entry.term}</strong>}
            {entry.cite && <span className="glossary-cite">{entry.cite}</span>}
          </div>
          <div className="term-pop-body">
            <RichText text={entry.definition} link={false} />
          </div>
          <div className="term-pop-foot">
            {slug && (
              <Link to={`/quests/${slug}`} onClick={() => setOpen(false)}>
                Verify it in Quest #{entry.quest} →
              </Link>
            )}
            <Link to="/glossary" onClick={() => setOpen(false)}>
              Glossary
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Wrap the first glossary match in a plain-text segment. Everything after
 * the match is left untouched (one underline per segment keeps prose calm).
 */
export function linkFirstTerm(segment: string, keyBase: number): ReactNode {
  const candidates: Array<{ index: number; text: string; entry: GlossaryEntry }> = [];
  if (PROSE_RE) {
    const m = PROSE_RE.exec(segment);
    if (m) {
      const entry = entryForProse(m[1]);
      if (entry) candidates.push({ index: m.index, text: m[1], entry });
    }
  }
  if (IDENT_RE) {
    const m = IDENT_RE.exec(segment);
    if (m) {
      const entry = entryForIdent(m[1]);
      if (entry) candidates.push({ index: m.index, text: m[1], entry });
    }
  }
  if (!candidates.length) return segment;
  candidates.sort((a, b) => a.index - b.index);
  const hit = candidates[0];
  return (
    <span key={keyBase}>
      {segment.slice(0, hit.index)}
      <GlossaryTerm entry={hit.entry}>{hit.text}</GlossaryTerm>
      {segment.slice(hit.index + hit.text.length)}
    </span>
  );
}

/** All identifier matches in one code line, for CodeCard. */
export function findCodeTerms(line: string): Array<{ start: number; end: number; entry: GlossaryEntry }> {
  if (!IDENT_RE) return [];
  const re = new RegExp(IDENT_RE.source, 'g');
  const out: Array<{ start: number; end: number; entry: GlossaryEntry }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const entry = entryForIdent(m[1]);
    if (entry) out.push({ start: m.index, end: m.index + m[1].length, entry });
  }
  return out;
}
