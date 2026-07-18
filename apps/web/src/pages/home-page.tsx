import { Link } from 'react-router-dom';
import type { Quest } from '@bitcoin4plebs/quests';
import { quests } from '@bitcoin4plebs/quests';
import { useVerifiedQuests } from '../lib/progress';

/** One-line subtitles for each curriculum track (view concern, so kept here). */
const TRACK_BLURBS: Record<string, string> = {
  Foundations: 'Start here: where the money comes from, why yours is yours, and who enforces it all.',
  Advanced: 'Leave the classroom: real artifacts, real byte order, and finally a node of your own.',
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

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Don't trust. Verify.</div>
        <h1>Understand Bitcoin's code. No engineering degree required.</h1>
        <p>
          Millions of people hold bitcoin on the word of engineers they've never met. You don't
          have to. Each <strong>verification quest</strong> below walks you through the{' '}
          <strong>real Bitcoin Core source code</strong> — pinned, annotated in plain English, and
          runnable — so you can see for yourself what's true.
        </p>
        {verifiedCount > 0 && (
          <p className="hero-progress">
            ✓ You've verified {verifiedCount} of {quests.length} quests with your own eyes.
          </p>
        )}
      </section>

      {groups.map((group) => (
        <section key={group.track} className="track">
          <div className="track-head">
            <h2>{group.track}</h2>
            {TRACK_BLURBS[group.track] && <p className="track-blurb">{TRACK_BLURBS[group.track]}</p>}
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
      ))}
    </main>
  );
}
