import type { ReactNode } from 'react';

/**
 * Minimal, deterministic syntax highlighting for the languages quests
 * quote. Works line-by-line on VERBATIM source text, the content model
 * stores plain text, and color is applied only at render time, so what the
 * reader verifies against GitHub is exactly what we store.
 */

/** Languages a quest excerpt can declare. 'text' is specification prose. */
export type ExcerptLanguage = 'cpp' | 'ts' | 'go' | 'text';

const CPP_KEYWORDS =
  /\b(typedef|static|constexpr|inline|bool|int|int64_t|const|return|if|else|while|for|struct|class|void|auto|false|true)\b/g;
const TS_KEYWORDS =
  /\b(function|const|let|var|return|if|else|while|for|class|export|import|type|interface|true|false)\b/g;
/**
 * Go, for the Lightning node source. Deliberately the same small, boring
 * list as the others: enough colour to find your place, never enough to
 * make the reader wonder whether we changed the text.
 */
const GO_KEYWORDS =
  /\b(func|package|import|var|const|type|struct|interface|return|if|else|for|range|switch|case|default|defer|go|chan|map|nil|true|false|error|byte|string|bool|int|int32|int64|uint32|uint64|make|len|append|copy)\b/g;

const KEYWORDS: Record<'cpp' | 'ts' | 'go', RegExp> = {
  cpp: CPP_KEYWORDS,
  ts: TS_KEYWORDS,
  go: GO_KEYWORDS,
};

const NUMBER = /\b(0x[0-9a-fA-F]+|\d[\d_]*n?)\b/g;
const STRING = /("(?:[^"\\]|\\.)*"|`[^`]*`)/g;

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

export function highlightLine(line: string, language: ExcerptLanguage): ReactNode {
  // Non-code sources (BIP and BOLT documents) render verbatim, no colours.
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
  collect(KEYWORDS[language], 'tok-keyword', line, tokens);
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
