import type { ReactNode } from 'react';

/**
 * Minimal, deterministic syntax highlighting for the two languages quests
 * quote. Works line-by-line on VERBATIM source text — the content model
 * stores plain text, and color is applied only at render time, so what the
 * reader verifies against GitHub is exactly what we store.
 */

const CPP_KEYWORDS =
  /\b(typedef|static|constexpr|inline|bool|int|int64_t|const|return|if|else|while|for|struct|class|void|auto|false|true)\b/g;
const TS_KEYWORDS =
  /\b(function|const|let|var|return|if|else|while|for|class|export|import|type|interface|true|false)\b/g;

const NUMBER = /\b(0x[0-9a-fA-F]+|\d[\d_]*n?)\b/g;
const STRING = /("(?:[^"\\]|\\.)*")/g;

interface Token {
  start: number;
  end: number;
  cls: string;
}

function collect(regex: RegExp, cls: string, line: string, out: Token[]) {
  regex.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(line)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, cls });
  }
}

/** True if the whole line is (part of) a comment. */
function isCommentLine(line: string): boolean {
  const t = line.trimStart();
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*');
}

export function highlightLine(line: string, language: 'cpp' | 'ts' | 'text'): ReactNode {
  // Non-code sources (BIP documents) render verbatim with no token colors.
  if (language === 'text') {
    // eslint-disable-next-line react/jsx-no-useless-fragment -- normalizes string to ReactNode
    return <>{line}</>;
  }
  if (isCommentLine(line)) {
    return <span className="tok-comment">{line}</span>;
  }

  const tokens: Token[] = [];
  collect(STRING, 'tok-string', line, tokens);
  const inlineComment = line.indexOf('//');
  const commentStart =
    inlineComment >= 0 && !tokens.some((t) => inlineComment > t.start && inlineComment < t.end)
      ? inlineComment
      : -1;
  if (commentStart >= 0) {
    tokens.push({ start: commentStart, end: line.length, cls: 'tok-comment' });
  }
  collect(language === 'cpp' ? CPP_KEYWORDS : TS_KEYWORDS, 'tok-keyword', line, tokens);
  collect(NUMBER, 'tok-number', line, tokens);

  // Keep earliest non-overlapping tokens (strings/comments win over keywords by insertion order).
  tokens.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: Token[] = [];
  let cursor = 0;
  for (const t of tokens) {
    if (t.start >= cursor) {
      kept.push(t);
      cursor = t.end;
    }
  }

  const nodes: ReactNode[] = [];
  let pos = 0;
  kept.forEach((t, i) => {
    if (t.start > pos) nodes.push(line.slice(pos, t.start));
    nodes.push(
      <span key={i} className={t.cls}>
        {line.slice(t.start, t.end)}
      </span>
    );
    pos = t.end;
  });
  if (pos < line.length) nodes.push(line.slice(pos));
  // eslint-disable-next-line react/jsx-no-useless-fragment -- normalizes ReactNode[] to a single node
  return <>{nodes}</>;
}
