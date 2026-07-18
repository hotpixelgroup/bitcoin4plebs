import { useState } from 'react';
import type { QuizItem } from '@bitcoin4plebs/quests';
import { RichText } from './rich-text.js';

/**
 * Self-check questions: multiple choice, graded instantly in the browser,
 * nothing recorded anywhere. Wrong answers get the explanation too,
 * because the explanation is the point.
 */
const MISS_KEY = 'b4p.quiz-misses.v1';

/** Remember a missed question so the review deck can resurface it. */
function recordMiss(item: QuizItem): void {
  try {
    const raw = localStorage.getItem(MISS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, QuizItem & { cleared: number }>) : {};
    all[item.question] = { ...item, cleared: 0 };
    localStorage.setItem(MISS_KEY, JSON.stringify(all));
  } catch {
    // Private browsing: review just won't remember.
  }
}

function Question({ item, index }: { item: QuizItem; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="quiz-q">
      <p className="quiz-question">
        {index + 1}. {item.question}
      </p>
      <div className="quiz-options">
        {item.options.map((option, i) => {
          const state =
            picked === null ? '' : i === item.answer ? 'quiz-right' : i === picked ? 'quiz-wrong' : 'quiz-dim';
          return (
            <button
              key={i}
              className={`quiz-option ${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                if (i !== item.answer) recordMiss(item);
              }}
            >
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              <span>{option}</span>
              {picked !== null && i === item.answer && <span className="quiz-mark">✓</span>}
              {picked === i && i !== item.answer && <span className="quiz-mark quiz-mark-wrong">✗</span>}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className={`quiz-explain ${picked === item.answer ? 'quiz-explain-right' : ''}`}>
          {picked === item.answer ? 'Right. ' : 'Not quite. '}
          <RichText text={item.explain} />
        </p>
      )}
    </div>
  );
}

export function SelfCheck({ items }: { items: QuizItem[] }) {
  return (
    <details className="depth quiz">
      <summary>Check yourself ({items.length} question{items.length > 1 ? 's' : ''})</summary>
      <div className="depth-body">
        {items.map((item, i) => (
          <Question key={i} item={item} index={i} />
        ))}
        <p className="quiz-footnote">Nobody grades you here. That's the point.</p>
      </div>
    </details>
  );
}
