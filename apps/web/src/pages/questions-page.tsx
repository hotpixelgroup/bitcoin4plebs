import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questions, quests } from '@bitcoin4plebs/quests';
import { RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

const questBySlug = new Map(quests.map((quest) => [quest.slug, quest]));

/**
 * The question-first way in: real questions newbies arrive with, each
 * answered in one line and linked to the exact stop where the code
 * proves it. Nobody has to know that their question is "about UTXOs."
 */
export function QuestionsPage() {
  useEffect(() => {
    document.title = 'Your questions · bitcoin4plebs';
    window.scrollTo(0, 0);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Ask first. Verify second.</div>
        <h1>Got a question? Start there.</h1>
        <p>
          Nobody arrives thinking "I should study the UTXO model." You arrive with a question.
          Every answer below is one line long, and every link goes to the exact place where the{' '}
          <strong>real code proves it</strong>, usually with something to press.
        </p>
      </section>
      <section className="qa-list">
        {questions.map((item) => {
          const quest = questBySlug.get(item.slug);
          const to = item.stop ? `/quests/${item.slug}#${item.stop}` : `/quests/${item.slug}`;
          return (
            <Link className="qa-card" to={to} key={item.question}>
              <h2 className="qa-q">{item.question}</h2>
              <p className="qa-a">
                <RichText text={item.short} link={false} />
              </p>
              <span className="qa-link">
                See the proof{quest ? ` · Quest #${quest.number}` : ''} →
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
