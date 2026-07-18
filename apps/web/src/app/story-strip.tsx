import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Quest } from '@bitcoin4plebs/quests';
import { quests } from '@bitcoin4plebs/quests';
import { RichText } from '@bitcoin4plebs/ui';

/** All quests carrying a story chapter, in curriculum order. */
const CHAPTERS = quests.filter(
  (quest): quest is Quest & { story: NonNullable<Quest['story']> } => quest.story !== undefined
);

/**
 * The running story: one payment (Ana buys Bo's bike for 0.6 BTC)
 * followed through the entire curriculum. Each quest page shows where
 * the payment is now, on a journey rail whose stages double as
 * navigation. Twelve lessons, one continuous story.
 */
export function StoryStrip({ quest }: { quest: Quest }) {
  const railRef = useRef<HTMLDivElement>(null);
  const index = CHAPTERS.findIndex((chapter) => chapter.id === quest.id);

  // Keep the current stage in view when the rail overflows on narrow screens.
  useEffect(() => {
    const rail = railRef.current;
    const now = rail?.querySelector<HTMLElement>('.story-now');
    if (rail && now && rail.scrollWidth > rail.clientWidth) {
      rail.scrollLeft = now.offsetLeft - rail.clientWidth / 2 + now.offsetWidth / 2;
    }
  }, [index]);

  if (!quest.story || index === -1) return null;

  return (
    <aside className="story" aria-label="Ana pays Bo: the running story">
      <div className="story-head">
        <span className="story-badge">
          <span aria-hidden="true">🚲</span> ana pays bo
        </span>
        <span className="story-chapter">
          chapter {index + 1} of {CHAPTERS.length}
        </span>
      </div>
      <div className="story-rail" role="list" ref={railRef}>
        {CHAPTERS.map((chapter, i) => (
          <Link
            key={chapter.id}
            role="listitem"
            to={`/quests/${chapter.slug}`}
            className={`story-stage ${i === index ? 'story-now' : i < index ? 'story-past' : ''}`}
            aria-current={i === index ? 'step' : undefined}
            title={`Quest #${chapter.number}: ${chapter.title}`}
          >
            <span className="story-dot" aria-hidden="true" />
            <span className="story-label">{chapter.story.stage}</span>
          </Link>
        ))}
      </div>
      <p className="story-text">
        <RichText text={quest.story.text} />
      </p>
    </aside>
  );
}
