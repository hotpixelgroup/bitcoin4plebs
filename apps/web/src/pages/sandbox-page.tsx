import { Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Finale } from '@bitcoin4plebs/quests/content';
import { SITE, siteQuests } from '../lib/site';
import { getRunner } from '../runners/registry';

const DEFAULT_TITLE = `${SITE.name} · ${SITE.tagline}`;

/**
 * The sandbox: every quest finale's interactive machine on one page, free
 * of homework. Poking at real algorithms is how intuition actually forms;
 * each machine links back to the quest that explains it.
 */
interface SandboxEntry {
  finale: Finale;
  fromQuest: number;
  blurb: string;
}

const MACHINES: SandboxEntry[] = siteQuests.flatMap((quest) =>
  quest.finale
    ? [
        {
          fromQuest: quest.number,
          blurb: quest.finale.takeaway,
          finale: quest.finale,
        },
      ]
    : [],
);

export function SandboxPage() {
  useEffect(() => {
    document.title = `Sandbox · ${SITE.name}`;
    window.scrollTo(0, 0);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  const slugByNumber = new Map(
    siteQuests.map((quest) => [quest.number, quest.slug]),
  );

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Poke at it. That's allowed.</div>
        <h1>The sandbox</h1>
        <p>
          Every finale from this site’s quests, gathered on one page with no
          homework attached. They include exact calculations and simplified
          teaching simulations, labelled with their limits. Each one links to
          the quest that shows you the source code behind it.
        </p>
      </section>
      {MACHINES.map((machine) => {
        const Runner = getRunner(machine.finale.runnerId);
        const slug = slugByNumber.get(machine.fromQuest);
        if (!Runner) return null;
        return (
          <section className="stop sandbox-item" key={machine.finale.runnerId}>
            <div className="stop-head">
              <span className="stop-num">machine</span>
              <h2>{machine.finale.title}</h2>
              {slug && (
                <Link className="sandbox-from" to={`/quests/${slug}`}>
                  from Quest #{machine.fromQuest} →
                </Link>
              )}
            </div>
            <p className="takeaway sandbox-blurb">{machine.blurb}</p>
            <Suspense
              fallback={
                <div className="lazy-pending">loading the machine…</div>
              }
            >
              <Runner finale={machine.finale} />
            </Suspense>
          </section>
        );
      })}
    </main>
  );
}
