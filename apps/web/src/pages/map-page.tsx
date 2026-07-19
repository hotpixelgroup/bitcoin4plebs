import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { groupQuestsByTrack, prerequisites, quests } from '@bitcoin4plebs/quests';
import { useVerifiedQuests } from '../lib/progress';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

/**
 * The map: every quest as a tappable node, grouped by track, with the
 * reader's verified marks lit. Selecting a quest highlights what it
 * builds on and what it leads into, so lost readers get a "you are
 * here" and completionists get a souvenir.
 */
export function MapPage() {
  useEffect(() => {
    document.title = 'The map · bitcoin4plebs';
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  const { verified } = useVerifiedQuests();
  const [sel, setSel] = useState<number | null>(null);
  const groups = groupQuestsByTrack(quests);
  const selected = sel !== null ? quests.find((q) => q.number === sel) : undefined;
  const deps = sel !== null ? (prerequisites[sel] ?? []) : [];
  const unlocks =
    sel !== null
      ? Object.entries(prerequisites)
          .filter(([, d]) => d.includes(sel))
          .map(([n]) => Number(n))
      : [];
  const doneCount = quests.filter((q) => verified[q.slug]).length;

  const pillClass = (n: number, isVerified: boolean) =>
    [
      'map-pill',
      isVerified && 'map-pill-done',
      sel === n && 'map-pill-sel',
      sel !== null && deps.includes(n) && 'map-pill-dep',
      sel !== null && unlocks.includes(n) && 'map-pill-unlock',
    ]
      .filter(Boolean)
      .join(' ');

  const questRef = (n: number) => quests.find((q) => q.number === n);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Reference · you are here</div>
        <h1>The map</h1>
        <p>
          Every quest opens from the menu at any time; nothing is locked. This map shows the{' '}
          <strong>structure</strong>: tap any quest to see what it builds on and what it leads
          into. Your ✓ marks are the ones you've verified with your own eyes
          {doneCount > 0 ? ` (${doneCount} of ${quests.length} so far)` : ''}.
        </p>
        <p className="map-legend" aria-hidden="true">
          <span className="map-key map-key-done">verified</span>
          <span className="map-key map-key-dep">builds on</span>
          <span className="map-key map-key-unlock">leads into</span>
        </p>
      </section>

      <section className="map" aria-label="Curriculum map">
        {groups.map((group) => (
          <div key={group.track} className="map-track">
            <div className="map-track-name">{group.track}</div>
            <div className="map-row">
              {group.quests.map((quest) => (
                <button
                  key={quest.id}
                  className={pillClass(quest.number, !!verified[quest.slug])}
                  aria-pressed={sel === quest.number}
                  onClick={() => setSel(sel === quest.number ? null : quest.number)}
                >
                  <span className="map-pill-num">#{quest.number}</span>
                  <span className="map-pill-title">{quest.title}</span>
                  {verified[quest.slug] && <span aria-hidden="true"> ✓</span>}
                </button>
              ))}
            </div>
          </div>
        ))}

        {selected ? (
          <div className="map-detail" aria-live="polite">
            <div className="map-detail-title">
              Quest #{selected.number}: {selected.title}
            </div>
            <p className="map-detail-body">
              {deps.length > 0 ? (
                <>
                  Builds on{' '}
                  {deps.map((n, i) => (
                    <span key={n}>
                      {i > 0 && ' and '}
                      <button className="map-ref" onClick={() => setSel(n)}>
                        #{n} {questRef(n)?.title}
                      </button>
                    </span>
                  ))}
                  .
                </>
              ) : (
                'Starts from zero: no prerequisites, no jargon.'
              )}{' '}
              {unlocks.length > 0 && (
                <>
                  Leads into{' '}
                  {unlocks.map((n, i) => (
                    <span key={n}>
                      {i > 0 && ' and '}
                      <button className="map-ref" onClick={() => setSel(n)}>
                        #{n} {questRef(n)?.title}
                      </button>
                    </span>
                  ))}
                  .
                </>
              )}
            </p>
            <Link className="hero-cta" to={`/quests/${selected.slug}`}>
              {verified[selected.slug] ? 'Revisit' : 'Start'} Quest #{selected.number} →
            </Link>
          </div>
        ) : (
          <p className="map-hint">
            Tap any quest above. Or ignore structure entirely and read in order: the numbering{' '}
            <em>is</em> the recommended path.
          </p>
        )}
      </section>
    </main>
  );
}
