import { useState } from 'react';
import { Link } from 'react-router-dom';
import { groupQuestsByTrack } from '@bitcoin4plebs/quests';
import { RichText } from '@bitcoin4plebs/ui';
import { Diploma } from '../app/diploma';
import { SiblingCard } from '../app/sibling-card';
import { TodayPanel } from '../app/today-panel';
import { latestReadPosition, useVerifiedQuests } from '../lib/progress';
import {
  SITE,
  STORAGE_PREFIX,
  siteEntryPaths,
  siteGlossary,
  siteQuests,
} from '../lib/site';

const PATH_KEY = `${STORAGE_PREFIX}.path.v1`;

/** The "why are you here?" chooser: four personas, each a three-quest on-ramp. */
function EntryPathsSection() {
  const { verified } = useVerifiedQuests();
  const [pathId, setPathId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PATH_KEY);
    } catch {
      return null;
    }
  });
  const choose = (id: string | null) => {
    setPathId(id);
    try {
      if (id) localStorage.setItem(PATH_KEY, id);
      else localStorage.removeItem(PATH_KEY);
    } catch {
      // Private browsing.
    }
  };
  const active = siteEntryPaths.find((p) => p.id === pathId);

  return (
    <section className="paths" aria-label="Pick a starting path">
      <div className="paths-head">Why are you here?</div>
      <div className="paths-chips" role="group" aria-label="Pick the reason that sounds like you">
        {siteEntryPaths.map((p) => (
          <button
            key={p.id}
            className={`preset ${p.id === pathId ? 'preset-active' : ''}`}
            aria-pressed={p.id === pathId}
            onClick={() => choose(p.id === pathId ? null : p.id)}
          >
            {p.prompt}
          </button>
        ))}
      </div>
      {active ? (
        <div className="paths-active">
          <p className="paths-blurb">{active.blurb}</p>
          <ol className="paths-steps">
            {active.questNumbers.map((n, i) => {
              const quest = siteQuests.find((q) => q.number === n);
              if (!quest) return null;
              return (
                <li key={n}>
                  <Link to={`/quests/${quest.slug}`} className="paths-step">
                    <span className="paths-step-num">{i + 1}</span>
                    <span>
                      Quest #{quest.number}: {quest.title}
                      {verified[quest.slug] && <span className="drawer-check"> ✓</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p className="paths-note">
            Three quests, about half an hour. Everything else will still be here.{' '}
            <Link to="/map">See the whole map →</Link>
          </p>
        </div>
      ) : (
        <p className="paths-note">
          Pick one, or just scroll: the tracks below run in order.{' '}
          <Link to="/map">See the whole map →</Link>
        </p>
      )}
    </section>
  );
}

export function HomePage() {
  const { verified } = useVerifiedQuests();
  const verifiedCount = siteQuests.filter((q) => verified[q.slug]).length;
  const groups = groupQuestsByTrack(siteQuests);
  const vizCount = siteQuests.reduce(
    (n, q) => n + q.stops.filter((s) => s.viz).length + (q.finale ? 1 : 0),
    0
  );
  const first = siteQuests[0];

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">{SITE.hero.kicker}</div>
        <h1>{SITE.hero.title}</h1>
        <p>
          <RichText text={SITE.hero.blurb} />
        </p>
        <div className="hero-stats">
          <span className="hero-stat">
            <b>{siteQuests.length}</b> quests
          </span>
          <span className="hero-stat">
            <b>{vizCount}</b> interactive figures
          </span>
          <span className="hero-stat">
            <b>{siteGlossary.length}</b>-term glossary
          </span>
          <span className="hero-stat">
            every excerpt <b>CI-verified</b>
          </span>
        </div>
        {verifiedCount > 0 && verifiedCount < siteQuests.length && (
          <p className="hero-progress">
            ✓ You've verified {verifiedCount} of {siteQuests.length} quests with your own eyes.
          </p>
        )}
        {siteQuests.length > 0 && verifiedCount === siteQuests.length && <Diploma />}
        <p className="hero-question-link">
          Arriving with a question? <Link to="/questions">Find your way in →</Link>
        </p>
        {(() => {
          const resume = latestReadPosition(verified);
          const resumeQuest = resume ? siteQuests.find((q) => q.slug === resume.slug) : undefined;
          if (resume && resumeQuest) {
            return (
              <Link className="hero-cta" to={`/quests/${resume.slug}`}>
                Continue Quest #{resumeQuest.number}: stop {resume.pos.stop} of {resume.pos.total} →
              </Link>
            );
          }
          if (verifiedCount === 0 && first) {
            return (
              <Link className="hero-cta" to={`/quests/${first.slug}`}>
                Start at the beginning: {first.title} →
              </Link>
            );
          }
          return null;
        })()}
      </section>

      <EntryPathsSection />

      {SITE.id === 'bitcoin' && <TodayPanel />}

      {groups.map((group) => {
        const done = group.quests.filter((q) => verified[q.slug]).length;
        return (
        <section key={group.track} className="track">
          <div className="track-head">
            <div className="track-head-main">
              <h2>{group.track}</h2>
              {SITE.trackBlurbs[group.track] && (
                <p className="track-blurb">{SITE.trackBlurbs[group.track]}</p>
              )}
            </div>
            <div className="track-meter">
              <span className="track-meter-bar">
                <span
                  className="track-meter-fill"
                  style={{ width: `${(done / group.quests.length) * 100}%` }}
                />
              </span>
              {done} / {group.quests.length} verified
            </div>
          </div>
          <div className="quest-list">
            {group.quests.map((quest) => (
              <Link key={quest.id} to={`/quests/${quest.slug}`} className="quest-card">
                <div className="quest-card-num">
                  Quest #{quest.number}
                  {verified[quest.slug] && <span className="quest-card-check"> · ✓ verified</span>}
                </div>
                <h2>{quest.title}</h2>
                <p>{quest.summary}</p>
                <div className="quest-card-meta">
                  <span>{quest.duration}</span>
                  <span className="quest-card-cta">Start verifying →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        );
      })}

      <SiblingCard />
    </main>
  );
}
