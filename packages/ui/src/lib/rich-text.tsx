import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GlossaryTerm, entryForCodeToken, linkFirstTerm } from './glossary-term.js';

/**
 * Renders the tiny inline markup quest content is written in:
 * **bold**, *emphasis*, `code`, and [label](https://url).
 *
 * Deliberately NOT a markdown engine — quest content is data, and a
 * constrained grammar keeps it predictable and safe (no raw HTML ever).
 *
 * With `link` on (the default), glossary terms get tap-to-define
 * popovers: the first prose match per text segment, plus any `code` span
 * whose token is a known identifier.
 */
const TOKEN =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function renderToken(token: string, key: number, link: boolean): ReactNode {
  if (token.startsWith('**') && token.endsWith('**')) {
    return <strong key={key}>{token.slice(2, -2)}</strong>;
  }
  if (token.startsWith('*') && token.endsWith('*')) {
    return <em key={key}>{token.slice(1, -1)}</em>;
  }
  if (token.startsWith('`') && token.endsWith('`')) {
    const inner = token.slice(1, -1);
    if (link) {
      const entry = entryForCodeToken(inner);
      if (entry) {
        return (
          <GlossaryTerm key={key} entry={entry} codeStyle>
            <code>{inner}</code>
          </GlossaryTerm>
        );
      }
    }
    return <code key={key}>{inner}</code>;
  }
  const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
  if (linkMatch) {
    // Site-internal paths route through the SPA router; external URLs open
    // in a new tab.
    if (linkMatch[2].startsWith('/')) {
      return (
        <Link key={key} to={linkMatch[2]}>
          {linkMatch[1]}
        </Link>
      );
    }
    return (
      <a key={key} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
        {linkMatch[1]}
      </a>
    );
  }
  return <Fragment key={key}>{token}</Fragment>;
}

export function RichText({ text, link = true }: { text: string; link?: boolean }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          renderToken(part, i, link)
        ) : link ? (
          <Fragment key={i}>{linkFirstTerm(part, i)}</Fragment>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
