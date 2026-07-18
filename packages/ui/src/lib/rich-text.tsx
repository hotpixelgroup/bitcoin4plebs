import { Fragment, type ReactNode } from 'react';

/**
 * Renders the tiny inline markup quest content is written in:
 * **bold**, *emphasis*, `code`, and [label](https://url).
 *
 * Deliberately NOT a markdown engine — quest content is data, and a
 * constrained grammar keeps it predictable and safe (no raw HTML ever).
 */
const TOKEN =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function renderToken(token: string, key: number): ReactNode {
  if (token.startsWith('**') && token.endsWith('**')) {
    return <strong key={key}>{token.slice(2, -2)}</strong>;
  }
  if (token.startsWith('*') && token.endsWith('*')) {
    return <em key={key}>{token.slice(1, -1)}</em>;
  }
  if (token.startsWith('`') && token.endsWith('`')) {
    return <code key={key}>{token.slice(1, -1)}</code>;
  }
  const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
  if (link) {
    return (
      <a key={key} href={link[2]} target="_blank" rel="noopener noreferrer">
        {link[1]}
      </a>
    );
  }
  return <Fragment key={key}>{token}</Fragment>;
}

export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN);
  return <>{parts.map((part, i) => (i % 2 === 1 ? renderToken(part, i) : <Fragment key={i}>{part}</Fragment>))}</>;
}
