import type { CodeExcerpt, SourcePin } from '@bitcoin4plebs/quests';
import { verifyUrl } from '@bitcoin4plebs/quests';
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
 * The heart of the product: verbatim source, always visible, with
 * real line numbers and a link to verify every line independently.
 */
export function CodeCard({ excerpt, pin }: CodeCardProps) {
  const { ref, language, lines } = excerpt;
  const showRange = ref.startLine !== 1 || pin !== undefined;
  return (
    <div className="codecard">
      <div className="codecard-bar">
        <span className="codecard-path">
          {ref.file}
          {showRange ? ` · lines ${ref.startLine}–${ref.endLine}` : ''}
        </span>
        {pin && <span className="codecard-real">real source</span>}
      </div>
      <pre>
        {lines.map((line) => (
          <span key={line.n} className={line.highlight ? 'cl cl-hl' : 'cl'}>
            <span className="cl-n">{line.n}</span>
            <span className="cl-c">{highlightLine(line.text, language)}</span>
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
