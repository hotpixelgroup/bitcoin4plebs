import type { ReactNode } from 'react';

export interface VizFigureProps {
  /** Short figure name, e.g. "The avalanche". */
  title: string;
  /** One sentence: what to do and what it shows. */
  caption: string;
  children: ReactNode;
}

/**
 * Shared chrome for every inline interactive figure: a consistent header
 * so readers instantly recognize "this one is for touching," and a body
 * card that matches the site's surfaces.
 */
export function VizFigure({ title, caption, children }: VizFigureProps) {
  return (
    <figure className="viz-figure">
      <figcaption className="viz-figure-head">
        <span className="viz-figure-badge">touch it</span>
        <span className="viz-figure-title">{title}</span>
        <span className="viz-figure-caption">{caption}</span>
      </figcaption>
      <div className="viz-figure-body">{children}</div>
    </figure>
  );
}
