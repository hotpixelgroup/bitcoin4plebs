import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Finale } from '@bitcoin4plebs/quests';
import { quests } from '@bitcoin4plebs/quests';
import { getRunner } from '../runners/registry';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

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

const MACHINES: SandboxEntry[] = [
  {
    fromQuest: 1,
    blurb: 'Sum every block reward Bitcoin will ever pay, then break the schedule on purpose.',
    finale: {
      title: 'The emission schedule',
      takeaway: '',
      runnerId: 'emission-schedule',
      note: 'Exact whole-number arithmetic, the same kind Bitcoin uses.',
    },
  },
  {
    fromQuest: 2,
    blurb: 'Scrub through every halving, past and future.',
    finale: {
      title: 'The halving clock',
      takeaway: '',
      runnerId: 'halving-clock',
      note: 'Dates beyond the next halving are estimates at 10 minutes per block.',
    },
  },
  {
    fromQuest: 3,
    blurb: 'Attack a real key space with genuinely random guesses.',
    finale: {
      title: 'Guess the key',
      takeaway: '',
      runnerId: 'guess-the-key',
      note: 'The key space is the secp256k1 curve order, a 78-digit number.',
    },
  },
  {
    fromQuest: 4,
    blurb: "Fork Bitcoin's monetary policy and see what you'd actually own.",
    finale: {
      title: 'Fork yourself',
      takeaway: '',
      runnerId: 'fork-yourself',
      note: 'The same halving arithmetic as Quest #1, with your parameters.',
    },
  },
  {
    fromQuest: 5,
    blurb: "Run the 2010 and 2018 attacks against today's checks.",
    finale: {
      title: 'Run the check',
      takeaway: '',
      runnerId: 'run-the-check',
      note: 'Real CheckTransaction logic with the exact error strings a node uses.',
    },
  },
  {
    fromQuest: 6,
    blurb: 'Mine a block with real double SHA-256, at a difficulty your laptop can win.',
    finale: {
      title: 'Mine a block',
      takeaway: '',
      runnerId: 'mine-a-block',
      note: 'Same hash function as Bitcoin, same rule: hash ≤ target.',
    },
  },
  {
    fromQuest: 7,
    blurb: 'Bid against a model mempool and watch blocks clear the room.',
    finale: {
      title: 'The fee auction',
      takeaway: '',
      runnerId: 'fee-auction',
      note: 'Deterministic model mempool; the auction mechanism is the real one.',
    },
  },
  {
    fromQuest: 8,
    blurb: "Rebuild and hash block zero's header; decode the headline inside it.",
    finale: {
      title: 'The genesis hash',
      takeaway: '',
      runnerId: 'genesis-hash',
      note: "WebCrypto SHA-256, the identical function every mining rig runs.",
    },
  },
  {
    fromQuest: 9,
    blurb: "Compute what any node's gettxoutsetinfo must report at any height.",
    finale: {
      title: 'The supply audit',
      takeaway: '',
      runnerId: 'supply-check',
      note: 'Exact satoshis from the Quest #1 schedule.',
    },
  },
  {
    fromQuest: 10,
    blurb: 'X-ray any bc1 address, then plant typos and watch the checksum catch them.',
    finale: {
      title: 'The address x-ray',
      takeaway: '',
      runnerId: 'address-xray',
      note: 'A faithful bech32/bech32m decoder, tested against the official BIP vectors.',
    },
  },
];

export function SandboxPage() {
  useEffect(() => {
    document.title = 'Sandbox · bitcoin4plebs';
    window.scrollTo(0, 0);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  const slugByNumber = new Map(quests.map((quest) => [quest.number, quest.slug]));

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Poke at it. That's allowed.</div>
        <h1>The sandbox</h1>
        <p>
          Every interactive machine from the quests, gathered on one page with no homework
          attached. Each one runs the <strong>real algorithm</strong> in your browser; each one
          links to the quest that shows you the source code behind it.
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
            <Runner finale={machine.finale} />
          </section>
        );
      })}
    </main>
  );
}
