import { Link } from 'react-router-dom';
import type { Quest } from '@bitcoin4plebs/quests';
import { quests } from '@bitcoin4plebs/quests';
import { Diploma } from '../app/diploma';
import { TodayPanel } from '../app/today-panel';
import { latestReadPosition, useVerifiedQuests } from '../lib/progress';

/** One-line subtitles for each curriculum track (view concern, so kept here). */
const TRACK_BLURBS: Record<string, string> = {
  'Start here': 'Five minutes of mental model. No code and no jargon: what a ledger is, and why copies plus rules changed everything.',
  Foundations: 'The rulebook, one page at a time: where the money comes from, why yours is yours, and who enforces it all.',
  Advanced: 'Leave the classroom: real artifacts, real byte order, and finally a node of your own.',
  'Zoom out':
    'From the code to the network: the incentive machine that keeps it all usable with nobody in charge, and the fight over what a ledger is for.',
  'Take it home':
    'The last mile: what a wallet actually stores, what the 12 words really are, and the five habits that keep coins safe from everything but you.',
};

interface TrackGroup {
  track: string;
  quests: Quest[];
}

/** Group consecutive quests that share a track, preserving curriculum order. */
function groupByTrack(all: Quest[]): TrackGroup[] {
  const groups: TrackGroup[] = [];
  for (const quest of all) {
    const track = quest.track ?? 'Foundations';
    const last = groups[groups.length - 1];
    if (last && last.track === track) {
      last.quests.push(quest);
    } else {
      groups.push({ track, quests: [quest] });
    }
  }
  return groups;
}

export function HomePage() {
  const { verified } = useVerifiedQuests();
  const verifiedCount = quests.filter((q) => verified[q.slug]).length;
  const groups = groupByTrack(quests);
  const vizCount = quests.reduce(
    (n, q) => n + q.stops.filter((s) => s.viz).length + (q.finale ? 1 : 0),
    0
  );

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Don't trust. Verify.</div>
        <h1>Understand Bitcoin's code. No engineering degree required.</h1>
        <p>
          Millions of people hold bitcoin on the word of engineers they've never met. You don't
          have to. Each <strong>verification quest</strong> below walks you through the{' '}
          <strong>real Bitcoin Core source code</strong>. The code is pinned, annotated in plain
          English, and runnable, so you can see for yourself what's true.
        </p>
        <div className="hero-stats">
          <span className="hero-stat">
            <b>{quests.length}</b> quests
          </span>
          <span className="hero-stat">
            <b>{vizCount}</b> interactive figures
          </span>
          <span className="hero-stat">
            <b>80</b>-term glossary
          </span>
          <span className="hero-stat">
            every excerpt <b>CI-verified</b>
          </span>
        </div>
        {verifiedCount > 0 && verifiedCount < quests.length && (
          <p className="hero-progress">
            ✓ You've verified {verifiedCount} of {quests.length} quests with your own eyes.
          </p>
        )}
        {verifiedCount === quests.length && <Diploma />}
        <p className="hero-question-link">
          Arriving with a question? <Link to="/questions">Find your way in →</Link>
        </p>
        {(() => {
          const resume = latestReadPosition(verified);
          const resumeQuest = resume ? quests.find((q) => q.slug === resume.slug) : undefined;
          if (resume && resumeQuest) {
            return (
              <Link className="hero-cta" to={`/quests/${resume.slug}`}>
                Continue Quest #{resumeQuest.number}: stop {resume.pos.stop} of {resume.pos.total} →
              </Link>
            );
          }
          if (verifiedCount === 0) {
            return (
              <Link className="hero-cta" to={`/quests/${quests[0].slug}`}>
                Start at the beginning: what even is a ledger? →
              </Link>
            );
          }
          return null;
        })()}
      </section>

      <TodayPanel />

      {groups.map((group) => {
        const done = group.quests.filter((q) => verified[q.slug]).length;
        return (
        <section key={group.track} className="track">
          <div className="track-head">
            <div className="track-head-main">
              <h2>{group.track}</h2>
              {TRACK_BLURBS[group.track] && <p className="track-blurb">{TRACK_BLURBS[group.track]}</p>}
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
    </main>
  );
}
