import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GlossaryEntry, QuizItem } from '@bitcoin4plebs/quests';
import { glossary } from '@bitcoin4plebs/quests';
import { Callout, RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";
const MISS_KEY = 'b4p.quiz-misses.v1';

type MissRecord = QuizItem & { cleared: number };

function readMisses(): Record<string, MissRecord> {
  try {
    const raw = localStorage.getItem(MISS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MissRecord>) : {};
  } catch {
    return {};
  }
}

function writeMisses(all: Record<string, MissRecord>): void {
  try {
    localStorage.setItem(MISS_KEY, JSON.stringify(all));
  } catch {
    // Private browsing.
  }
}

/** Deterministic "today's five" glossary terms, same set all day. */
function dailyTerms(): GlossaryEntry[] {
  const day = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (const ch of day) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const picked: GlossaryEntry[] = [];
  const pool = [...glossary];
  for (let i = 0; i < 5 && pool.length; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    picked.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return picked;
}

function Flashcard({ entry }: { entry: GlossaryEntry }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flashcard">
      <div className="flashcard-term">
        {entry.code ? <code>{entry.term}</code> : entry.term}
        {entry.cite && <span className="glossary-cite">{entry.cite}</span>}
      </div>
      {revealed ? (
        <p className="flashcard-def">
          <RichText text={entry.definition} link={false} />
        </p>
      ) : (
        <button className="preset" onClick={() => setRevealed(true)}>
          reveal the definition
        </button>
      )}
    </div>
  );
}

function ReviewQuestion({
  record,
  onResult,
}: {
  record: MissRecord;
  onResult: (question: string, correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="quiz-q">
      <p className="quiz-question">{record.question}</p>
      <div className="quiz-options">
        {record.options.map((option, i) => {
          const state =
            picked === null ? '' : i === record.answer ? 'quiz-right' : i === picked ? 'quiz-wrong' : 'quiz-dim';
          return (
            <button
              key={i}
              className={`quiz-option ${state}`}
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                onResult(record.question, i === record.answer);
              }}
            >
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className={`quiz-explain ${picked === record.answer ? 'quiz-explain-right' : ''}`}>
          {picked === record.answer
            ? record.cleared + 1 >= 2
              ? 'Right again. This one retires from your deck. '
              : 'Right. Once more on a later visit and it retires. '
            : 'Not quite. It stays in the deck. '}
          <RichText text={record.explain} />
        </p>
      )}
    </div>
  );
}

/**
 * The daily five: five glossary flashcards chosen fresh each day, plus
 * any quiz questions you have missed, which retire after two correct
 * answers. All of it lives only in your browser.
 */
export function ReviewPage() {
  const [misses, setMisses] = useState<Record<string, MissRecord>>(readMisses);
  const terms = useMemo(dailyTerms, []);

  useEffect(() => {
    document.title = 'Daily review · bitcoin4plebs';
    window.scrollTo(0, 0);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  const onResult = (question: string, correct: boolean) => {
    setMisses((prev) => {
      const next = { ...prev };
      const record = next[question];
      if (!record) return prev;
      if (correct) {
        const cleared = record.cleared + 1;
        if (cleared >= 2) delete next[question];
        else next[question] = { ...record, cleared };
      } else {
        next[question] = { ...record, cleared: 0 };
      }
      writeMisses(next);
      return next;
    });
  };

  const missList = Object.values(misses);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Five minutes. Most days.</div>
        <h1>Daily review</h1>
        <p>
          Understanding fades without resurfacing, so here is a tiny daily deck: five glossary
          terms chosen fresh each day, plus any self-check questions you've missed. Answer a
          missed question correctly twice and it retires. Everything stays in your browser.
        </p>
      </section>

      <section className="review-section">
        <h2>Today's five terms</h2>
        <div className="flashcard-row">
          {terms.map((entry) => (
            <Flashcard key={entry.term} entry={entry} />
          ))}
        </div>
      </section>

      <section className="review-section">
        <h2>Questions you've missed</h2>
        {missList.length === 0 ? (
          <Callout>
            Nothing here, either because you haven't missed any self-checks yet or because
            you've cleared them all. The quizzes live inside the{' '}
            <Link to="/">quests</Link>; miss one and it shows up here until you beat it twice.
          </Callout>
        ) : (
          missList.map((record) => (
            <ReviewQuestion key={record.question} record={record} onResult={onResult} />
          ))
        )}
      </section>
    </main>
  );
}
