import { Fragment, useState, type ReactNode } from 'react';
import type { CodeExcerpt, SourcePin } from '@bitcoin4plebs/quests';
import { verifyUrl } from '@bitcoin4plebs/quests';
import { GlossaryTerm, findCodeTerms } from './glossary-term.js';
import { highlightLine } from './highlight.js';

export interface CodeCardProps {
  excerpt: CodeExcerpt;
  /**
   * When set, the card shows the "real source" badge and a
   * "verify on GitHub" footer link pinned to this commit.
   */
  pin?: SourcePin;
}

/**
 * One verbatim source line, with known identifiers (CAmount, COIN,
 * scriptPubKey…) wrapped in tap-to-define glossary popovers. The stored
 * text is untouched; definitions are applied only at render time.
 */
function CodeLineContent({ text, language }: { text: string; language: 'cpp' | 'ts' | 'text' }) {
  const terms = findCodeTerms(text);
  if (!terms.length) return <>{highlightLine(text, language)}</>;
  const nodes: ReactNode[] = [];
  let pos = 0;
  terms.forEach((t, i) => {
    if (t.start > pos) {
      nodes.push(<Fragment key={`s${i}`}>{highlightLine(text.slice(pos, t.start), language)}</Fragment>);
    }
    nodes.push(
      <GlossaryTerm key={`t${i}`} entry={t.entry} codeStyle>
        {text.slice(t.start, t.end)}
      </GlossaryTerm>
    );
    pos = t.end;
  });
  if (pos < text.length) {
    nodes.push(<Fragment key="tail">{highlightLine(text.slice(pos), language)}</Fragment>);
  }
  // eslint-disable-next-line react/jsx-no-useless-fragment -- normalizes ReactNode[] to a single node
  return <>{nodes}</>;
}

/**
 * The heart of the product: verbatim source, always visible, with
 * real line numbers, tap-to-define identifiers, a wrap toggle for
 * phones, and a link to verify every line independently.
 */
export function CodeCard({ excerpt, pin }: CodeCardProps) {
  const { ref, language, lines } = excerpt;
  const [wrap, setWrap] = useState(false);
  const showRange = ref.startLine !== 1 || pin !== undefined;
  return (
    <div className="codecard">
      <div className="codecard-bar">
        <span className="codecard-path">
          {ref.file}
          {showRange ? ` · lines ${ref.startLine}–${ref.endLine}` : ''}
        </span>
        <button
          className="codecard-wrap-btn"
          onClick={() => setWrap((w) => !w)}
          aria-pressed={wrap}
          title={wrap ? 'Preserve indentation (scroll long lines)' : 'Wrap long lines'}
        >
          {wrap ? '⟷ scroll' : '↩ wrap'}
        </button>
        {pin && <span className="codecard-real">real source</span>}
      </div>
      <pre className={wrap ? 'codecard-wrapped' : ''}>
        {lines.map((line) => (
          <span key={line.n} className={line.highlight ? 'cl cl-hl' : 'cl'}>
            <span className="cl-n">{line.n}</span>
            <span className="cl-c">
              <CodeLineContent text={line.text} language={language} />
            </span>
          </span>
        ))}
      </pre>
      {pin && (
        <div className="codecard-foot">
          <a href={verifyUrl(pin, ref)} target="_blank" rel="noopener noreferrer">
            Verify these lines on GitHub ↗
          </a>
        </div>
      )}
    </div>
  );
}
