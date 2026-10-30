import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  QUEST_SLUGS,
  glossaryForSite,
  sites,
  type GlossaryEntry,
  type SiteId,
} from '@bitcoin4plebs/quests/content';
import { RichText } from './rich-text.js';

/**
 * Tap-to-define glossary terms, woven into prose and code excerpts.
 * Matching is driven entirely by the glossary data's `match` patterns:
 * lowercase patterns link case-insensitively in prose; identifier-style
 * patterns (capitals or underscores) link case-sensitively, including
 * inside code excerpts. First occurrence per text segment only, so pages
 * stay readable rather than becoming a sea of underlines.
 */

/**
 * Which front door this build is, read from the attribute the entry point
 * stamps on <html>. The ui package has no other way to know, and it needs
 * to: quest numbers restart per site, so "Quest #3" means two different
 * pages depending on where you are standing.
 */
function currentSite(): SiteId {
  const stamped = typeof document === 'undefined' ? undefined : document.documentElement.dataset['site'];
  return stamped === 'lightning' ? 'lightning' : 'bitcoin';
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isIdentifier = (p: string) => /[A-Z_]/.test(p);

interface Matcher {
  prose: Array<{ pattern: string; entry: GlossaryEntry }>;
  ident: Array<{ pattern: string; entry: GlossaryEntry }>;
  proseRe: RegExp | null;
  identRe: RegExp | null;
}

/**
 * How strongly an entry belongs to this site, used only to break ties when
 * two visible entries share a pattern ("gossip" is both Bitcoin relay and
 * Lightning's network map): an entry restricted to this site beats one that
 * merely cites a quest here, which beats one that points elsewhere.
 */
function affinity(entry: GlossaryEntry, site: SiteId): number {
  if (entry.site === site) return 2;
  if (entry.quest !== undefined && (entry.questSite ?? 'bitcoin') === site) return 1;
  return 0;
}

/**
 * Patterns are indexed per front door: only entries visible on this site
 * (glossaryForSite) can be linked, so a Lightning reader never gets a
 * Bitcoin-only definition and vice versa.
 */
function buildMatcher(site: SiteId): Matcher {
  const prose: Matcher['prose'] = [];
  const ident: Matcher['ident'] = [];
  for (const entry of glossaryForSite(site)) {
    for (const pattern of entry.match ?? []) {
      (isIdentifier(pattern) ? ident : prose).push({ pattern, entry });
    }
  }
  // Longest pattern first so "difficulty adjustment" beats "difficulty";
  // equal patterns resolve to the entry that belongs to this site.
  const order = (a: Matcher['prose'][number], b: Matcher['prose'][number]) =>
    b.pattern.length - a.pattern.length || affinity(b.entry, site) - affinity(a.entry, site);
  prose.sort(order);
  ident.sort(order);
  return {
    prose,
    ident,
    proseRe: prose.length ? new RegExp(`\\b(${prose.map((p) => escapeRe(p.pattern)).join('|')})\\b`, 'i') : null,
    identRe: ident.length ? new RegExp(`\\b(${ident.map((p) => escapeRe(p.pattern)).join('|')})\\b`) : null,
  };
}

const matchers = new Map<SiteId, Matcher>();
function matcher(): Matcher {
  const site = currentSite();
  let m = matchers.get(site);
  if (!m) {
    m = buildMatcher(site);
    matchers.set(site, m);
  }
  return m;
}

function entryForProse(m: Matcher, matched: string): GlossaryEntry | undefined {
  const lower = matched.toLowerCase();
  return (
    m.prose.find((p) => p.pattern.toLowerCase() === lower)?.entry ??
    m.ident.find((p) => p.pattern === matched)?.entry
  );
}

function entryForIdent(m: Matcher, matched: string): GlossaryEntry | undefined {
  return m.ident.find((p) => p.pattern === matched)?.entry;
}

/** Exact-token lookup for `code` spans in prose markup. */
export function entryForCodeToken(token: string): GlossaryEntry | undefined {
  const m = matcher();
  return (
    m.ident.find((p) => p.pattern === token)?.entry ??
    m.prose.find((p) => p.pattern === token.toLowerCase())?.entry
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

  // Quest numbers restart per site, so a citation is only meaningful with
  // the site it belongs to. Same site: an internal route. Other site: a
  // link across, rather than a dead internal one.
  const questLink = (() => {
    if (entry.quest === undefined) return undefined;
    const target: SiteId = entry.questSite ?? 'bitcoin';
    const slug = QUEST_SLUGS[target][entry.quest];
    if (!slug) return undefined;
    const here = currentSite();
    return target === here
      ? { internal: true as const, href: `/quests/${slug}`, siteName: sites[target].name }
      : { internal: false as const, href: `${sites[target].url}quests/${slug}`, siteName: sites[target].name };
  })();

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
            {questLink?.internal && (
              <Link to={questLink.href} onClick={() => setOpen(false)}>
                Verify it in Quest #{entry.quest} →
              </Link>
            )}
            {questLink && !questLink.internal && (
              <a href={questLink.href}>
                Verify it in {questLink.siteName} Quest #{entry.quest} ↗
              </a>
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
  const site = matcher();
  const candidates: Array<{ index: number; text: string; entry: GlossaryEntry }> = [];
  if (site.proseRe) {
    const m = site.proseRe.exec(segment);
    if (m) {
      const entry = entryForProse(site, m[1]);
      if (entry) candidates.push({ index: m.index, text: m[1], entry });
    }
  }
  if (site.identRe) {
    const m = site.identRe.exec(segment);
    if (m) {
      const entry = entryForIdent(site, m[1]);
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
  const site = matcher();
  if (!site.identRe) return [];
  const re = new RegExp(site.identRe.source, 'g');
  const out: Array<{ start: number; end: number; entry: GlossaryEntry }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const entry = entryForIdent(site, m[1]);
    if (entry) out.push({ start: m.index, end: m.index + m[1].length, entry });
  }
  return out;
}
