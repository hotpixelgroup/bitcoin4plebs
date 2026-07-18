import type { ReactNode } from 'react';
import type { SourcePin, Stop } from '@bitcoin4plebs/quests';
import { CodeCard } from './code-card.js';
import { RichText } from './rich-text.js';
import { SelfCheck } from './self-check.js';

export interface StopSectionProps {
  stop: Stop;
  /** 1-based position of this stop. */
  index: number;
  /** Total number of stops in the quest. */
  total: number;
  pin: SourcePin;
  /** Resolved inline interactive figure for this stop (from stop.viz). */
  viz?: ReactNode;
}

/**
 * One quest stop: split-screen with three depths of explanation on the
 * left (takeaway → prose → line-by-line) and the real code on the right.
 */
export function StopSection({ stop, index, total, pin, viz }: StopSectionProps) {
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
      {stop.myth && (
        <div className="myth">
          <span className="myth-badge">myth</span>
          <div>
            <p className="myth-belief">“{stop.myth.belief}”</p>
            <p className="myth-reality">
              <RichText text={stop.myth.reality} />
            </p>
          </div>
        </div>
      )}
      <div className={stop.excerpt ? 'cols' : 'stop-single'}>
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
        {stop.excerpt && <CodeCard excerpt={stop.excerpt} pin={pin} />}
      </div>
      {stop.contrast && stop.contrast.length > 0 && (
        <div className="contrast-wrap">
          <table className="contrast" aria-label="Bank versus Bitcoin comparison">
            <thead>
              <tr>
                <th></th>
                <th>Your bank</th>
                <th>Bitcoin</th>
              </tr>
            </thead>
            <tbody>
              {stop.contrast.map((row) => (
                <tr key={row.aspect}>
                  <td>{row.aspect}</td>
                  <td>{row.bank}</td>
                  <td>{row.bitcoin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {viz && <div className="stop-viz">{viz}</div>}
      {stop.quiz && stop.quiz.length > 0 && (
        <div className="stop-quiz">
          <SelfCheck items={stop.quiz} />
        </div>
      )}
    </section>
  );
}
