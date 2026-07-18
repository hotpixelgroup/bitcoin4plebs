import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuestBySlug, quests } from '@bitcoin4plebs/quests';
import { Callout, RichText, StopSection } from '@bitcoin4plebs/ui';
import { useVerifiedQuests } from '../lib/progress';
import { getRunner } from '../runners/registry';
import { getViz } from '../vizzes/registry';

const DEFAULT_TITLE = "bitcoin4plebs — Don't trust. Verify.";

/**
 * The generic quest engine: renders ANY quest from its data alone.
 * Adding a quest to the registry is all it takes to ship it here.
 */
export function QuestPage() {
  const { slug } = useParams<{ slug: string }>();
  const quest = slug ? getQuestBySlug(slug) : undefined;
  const { verified, toggle } = useVerifiedQuests();

  useEffect(() => {
    document.title = quest ? `Quest #${quest.number}: ${quest.title} · bitcoin4plebs` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [quest]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!quest) {
    return (
      <main className="wrap">
        <section className="hero">
          <h1>Quest not found</h1>
          <p>
            <Link to="/">← Back to all quests</Link>
          </p>
        </section>
      </main>
    );
  }

  const Runner = quest.finale ? getRunner(quest.finale.runnerId) : undefined;
  const prev = quests.find((q) => q.number === quest.number - 1);
  const next = quests.find((q) => q.number === quest.number + 1);
  const isVerified = Boolean(verified[quest.slug]);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">{quest.kicker}</div>
        <h1>{quest.title}</h1>
        {quest.intro.map((paragraph, i) => (
          <p key={i}>
            <RichText text={paragraph} />
          </p>
        ))}
        <p className="promise">
          <RichText text={quest.promise} />
        </p>
      </section>

      {quest.stops.map((stop, i) => {
        const Viz = stop.viz ? getViz(stop.viz) : undefined;
        return (
          <StopSection
            key={stop.id}
            stop={stop}
            index={i + 1}
            total={quest.stops.length}
            pin={quest.pin}
            viz={Viz ? <Viz /> : undefined}
          />
        );
      })}

      {quest.finale && (
        <section className="stop finale" id="finale">
          <div className="stop-head">
            <span className="stop-num">Finale</span>
            <h2>{quest.finale.title}</h2>
          </div>
          <p className="takeaway">
            <RichText text={quest.finale.takeaway} />
          </p>
          {Runner ? (
            <Runner finale={quest.finale} />
          ) : (
            <Callout>
              Interactive runner “{quest.finale.runnerId}” is not available in this build.
            </Callout>
          )}
        </section>
      )}

      <section className="recap">
        <h2>What you just verified</h2>
        <ul>
          {quest.recap.items.map((item, i) => (
            <li key={i}>
              <RichText text={item.text} />
              {item.cite && <span className="cite"> ({item.cite})</span>}
            </li>
          ))}
        </ul>
        <Callout>
          <RichText text={quest.recap.closing} />
        </Callout>
        <button
          className={`verify-toggle ${isVerified ? 'on' : ''}`}
          onClick={() => toggle(quest.slug)}
        >
          {isVerified ? '✓ Verified with my own eyes' : 'Mark as verified — I saw it myself'}
        </button>
        <p className="verify-note">
          Saved only in your browser. Nobody grades you here — that's the point.
        </p>
      </section>

      <nav className="quest-nav">
        {prev ? (
          <Link to={`/quests/${prev.slug}`} className="quest-nav-link">
            <div className="quest-nav-kicker">← Previous · Quest #{prev.number}</div>
            <div className="quest-nav-title">{prev.title}</div>
          </Link>
        ) : (
          <Link to="/" className="quest-nav-link">
            <div className="quest-nav-kicker">← Start</div>
            <div className="quest-nav-title">All quests</div>
          </Link>
        )}
        {next ? (
          <Link to={`/quests/${next.slug}`} className="quest-nav-link next">
            <div className="quest-nav-kicker">Next · Quest #{next.number} →</div>
            <div className="quest-nav-title">{next.title}</div>
          </Link>
        ) : (
          <Link to="/" className="quest-nav-link next">
            <div className="quest-nav-kicker">Curriculum complete →</div>
            <div className="quest-nav-title">Back to all quests</div>
          </Link>
        )}
      </nav>
    </main>
  );
}
