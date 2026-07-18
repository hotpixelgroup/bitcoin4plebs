import type { SourcePin, Stop } from '@bitcoin4plebs/quests';
import { CodeCard } from './code-card.js';
import { RichText } from './rich-text.js';

export interface StopSectionProps {
  stop: Stop;
  /** 1-based position of this stop. */
  index: number;
  /** Total number of stops in the quest. */
  total: number;
  pin: SourcePin;
}

/**
 * One quest stop: split-screen with three depths of explanation on the
 * left (takeaway → prose → line-by-line) and the real code on the right.
 */
export function StopSection({ stop, index, total, pin }: StopSectionProps) {
  return (
    <section className="stop" id={stop.id}>
      <div className="stop-head">
        <span className="stop-num">
          Stop {index} / {total}
        </span>
        <h2>{stop.title}</h2>
      </div>
      <p className="takeaway">
        <RichText text={stop.takeaway} />
      </p>
      <div className="cols">
        <div className="prose">
          {stop.prose.map((paragraph, i) => (
            <p key={i}>
              <RichText text={paragraph} />
            </p>
          ))}
          {stop.annotations && stop.annotations.length > 0 && (
            <details className="depth" open={stop.annotationsOpen}>
              <summary>Line by line</summary>
              <div className="depth-body">
                <ul className="lbl">
                  {stop.annotations.map((a) => (
                    <li key={a.lines}>
                      <span className="lbl-ln">{a.lines}</span>
                      <span>
                        <RichText text={a.text} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          )}
        </div>
        <CodeCard excerpt={stop.excerpt} pin={pin} />
      </div>
    </section>
  );
}
