import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuestBySlug, quests } from '@bitcoin4plebs/quests';
import { Callout, RichText, StopSection } from '@bitcoin4plebs/ui';
import { ReadProgress } from '../app/read-progress';
import { isFreshVisitor, recordReadPosition, useVerifiedQuests } from '../lib/progress';
import { getRunner } from '../runners/registry';
import { getViz } from '../vizzes/registry';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

/**
 * The generic quest engine: renders ANY quest from its data alone.
 * Adding a quest to the registry is all it takes to ship it here.
 */
export function QuestPage() {
  const { slug } = useParams<{ slug: string }>();
  const quest = slug ? getQuestBySlug(slug) : undefined;
  const { verified, toggle } = useVerifiedQuests();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    document.title = quest ? `Quest #${quest.number}: ${quest.title} · bitcoin4plebs` : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [quest]);

  useEffect(() => {
    // Jump to a deep-linked stop if the URL carries one; otherwise top.
    const anchor = window.location.hash.slice(1);
    if (anchor && document.getElementById(anchor)) {
      document.getElementById(anchor)?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [slug]);

  // Remember the furthest stop the reader scrolled past, for "Continue…".
  useEffect(() => {
    if (!quest) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('section.stop'));
    if (!sections.length || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index >= 0) recordReadPosition(quest.slug, index + 1, quest.stops.length);
        }
      },
      // Any visible part of a stop counts: tall sections never reach a
      // fractional threshold inside a short viewport.
      { threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [quest]);

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
  const showPrereq =
    !bannerDismissed && quest.number > 1 && isFreshVisitor(verified);

  return (
    <main className="wrap">
      <ReadProgress />
      {showPrereq && (
        <div className="prereq">
          <span>
            This quest builds on earlier ones. New here? The curriculum starts gently:
          </span>
          <span className="prereq-actions">
            <Link to={`/quests/${quests[0].slug}`}>Start at Quest #{quests[0].number} →</Link>
            <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
              ✕
            </button>
          </span>
        </div>
      )}
      <section className="hero">
        <div className="kicker">{quest.kicker}</div>
        <h1>{quest.title}</h1>
        <div className="quest-meta">
          <span className="quest-meta-chip is-track">{quest.track ?? 'Foundations'}</span>
          <span className="quest-meta-chip">quest {quest.number} of {quests.length}</span>
          <span className="quest-meta-chip">{quest.duration} read</span>
          <span className="quest-meta-chip">
            {quest.stops.length} stops{quest.finale ? ' + finale' : ''}
          </span>
          {isVerified && <span className="quest-meta-chip is-verified">✓ verified by you</span>}
        </div>
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
          {isVerified ? '✓ Verified with my own eyes' : 'Mark as verified: I saw it myself'}
        </button>
        <p className="verify-note">
          Saved only in your browser. Nobody grades you here. That's the point.
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
