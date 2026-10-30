import { useId, type ReactNode } from 'react';

export interface VizFigureProps {
  /** Short figure name, e.g. "The avalanche". */
  title: string;
  /** One sentence: what to do and what it shows. */
  caption: string;
  /**
   * Show the "touch it" badge. Defaults to true; mostly-static figures
   * (pick-a-row tables, timelines) opt out so the badge stays meaningful.
   */
  interactive?: boolean;
  children: ReactNode;
}

/**
 * Shared chrome for every inline interactive figure: a consistent header
 * so readers instantly recognize "this one is for touching," and a body
 * card that matches the site's surfaces. The figure is labelled by its
 * title and described by its caption; the badge is visual only.
 */
export function VizFigure({ title, caption, interactive = true, children }: VizFigureProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const captionId = `${id}-caption`;
  return (
    <figure className="viz-figure" aria-labelledby={titleId} aria-describedby={captionId}>
      <figcaption className="viz-figure-head">
        {interactive && (
          <span className="viz-figure-badge" aria-hidden="true">
            touch it
          </span>
        )}
        <span className="viz-figure-title" id={titleId}>
          {title}
        </span>
        <span className="viz-figure-caption" id={captionId}>
          {caption}
        </span>
      </figcaption>
      <div className="viz-figure-body">{children}</div>
    </figure>
  );
}
