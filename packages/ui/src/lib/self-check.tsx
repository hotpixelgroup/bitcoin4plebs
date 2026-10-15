import { useState } from 'react';
import type { QuizItem } from '@bitcoin4plebs/quests/content';
import { RichText } from './rich-text.js';

function Question({
  item,
  index,
  onMiss,
}: {
  item: QuizItem;
  index: number;
  onMiss?: (item: QuizItem) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <div className="quiz-q">
      <p className="quiz-question">
        {index + 1}. {item.question}
      </p>
      <div className="quiz-options">
        {item.options.map((option, i) => {
          const state =
            picked === null
              ? ''
              : i === item.answer
                ? 'quiz-right'
                : i === picked
                  ? 'quiz-wrong'
                  : 'quiz-dim';
          return (
            <button
              key={i}
              className={`quiz-option ${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                if (i !== item.answer) onMiss?.(item);
              }}
            >
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              <span>{option}</span>
              {picked !== null && i === item.answer && (
                <span className="quiz-mark">✓</span>
              )}
              {picked === i && i !== item.answer && (
                <span className="quiz-mark quiz-mark-wrong">✗</span>
              )}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p
          className={`quiz-explain ${picked === item.answer ? 'quiz-explain-right' : ''}`}
        >
          {picked === item.answer ? 'Right. ' : 'Not quite. '}
          <RichText text={item.explain} />
        </p>
      )}
    </div>
  );
}

export function SelfCheck({
  items,
  onMiss,
}: {
  items: QuizItem[];
  onMiss?: (item: QuizItem) => void;
}) {
  return (
    <details className="depth quiz">
      <summary>
        Check yourself ({items.length} question{items.length > 1 ? 's' : ''})
      </summary>
      <div className="depth-body">
        {items.map((item, i) => (
          <Question key={i} item={item} index={i} onMiss={onMiss} />
        ))}
        <p className="quiz-footnote">
          Nobody grades you here. That's the point.
        </p>
      </div>
    </details>
  );
}
