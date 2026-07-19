import { useState } from 'react';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

const FUNDING = 100_000;
const START_ANA = 80_000;
const COFFEE = 5_000;
const BO_PAYS = 3_000;
/** Approximate on-chain sizes, labeled as such in the finale note. */
const VB_PAYMENT = 140;
const VB_OPEN = 200;
const VB_CLOSE = 200;

type Phase = 'closed' | 'open' | 'settled' | 'penalized';

interface Update {
  n: number;
  text: string;
  ana: number;
  bo: number;
}

/**
 * A two-party channel driven by the BOLT #3 machinery the quest just
 * read: every payment is a mutually signed new split (an off-chain
 * commitment), old states become radioactive via revocation, and the
 * chain is touched exactly twice unless someone cheats.
 */
export function ChannelSimulator({ finale }: RunnerProps) {
  const [phase, setPhase] = useState<Phase>('closed');
  const [ana, setAna] = useState(START_ANA);
  const [bo, setBo] = useState(FUNDING - START_ANA);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [cheat, setCheat] = useState<string[] | null>(null);

  const open = () => {
    setPhase('open');
    setAna(START_ANA);
    setBo(FUNDING - START_ANA);
    setCheat(null);
    setUpdates([
      {
        n: 0,
        text: `on-chain: the funding transaction confirms, ${FUNDING.toLocaleString('en-US')} sats locked to 2-of-2 multisig`,
        ana: START_ANA,
        bo: FUNDING - START_ANA,
      },
    ]);
  };

  const pay = (from: 'ana' | 'bo', sats: number, what: string) => {
    if (phase !== 'open') return;
    const nextAna = from === 'ana' ? ana - sats : ana + sats;
    const nextBo = FUNDING - nextAna;
    if (nextAna < 0 || nextBo < 0) return;
    setAna(nextAna);
    setBo(nextBo);
    setUpdates((u) => [
      ...u,
      {
        n: u.length,
        text: `off-chain: ${what}; both sign commitment #${u.length} and revoke #${u.length - 1}`,
        ana: nextAna,
        bo: nextBo,
      },
    ]);
  };

  const payments = updates.length - 1;
  const canCheat = phase === 'open' && payments >= 2;
  const bytesIfOnChain = payments > 0 ? payments * VB_PAYMENT : 0;
  const bytesActual = VB_OPEN + (phase === 'settled' || phase === 'penalized' ? VB_CLOSE : 0);

  const tryCheat = () => {
    if (!canCheat) return;
    const old = updates[1];
    setCheat([
      `Bo broadcasts stale commitment #1 (his balance then: ${old.bo.toLocaleString('en-US')} sats instead of ${bo.toLocaleString('en-US')} now).`,
      'His to_local output is timelocked: OP_CHECKSEQUENCEVERIFY makes him wait to_self_delay blocks before he can touch a satoshi.',
      "Ana's node sees the stale broadcast during the delay. She holds the revocation key Bo surrendered when they signed commitment #2.",
      `Penalty path (the OP_IF branch): Ana spends Bo's ENTIRE output immediately. Final score: Ana ${FUNDING.toLocaleString('en-US')}, Bo 0.`,
      'This is why no rational node ever broadcasts an old state. The script you read is the reason the tab stays honest.',
    ]);
    setAna(FUNDING);
    setBo(0);
    setPhase('penalized');
  };

  const close = () => {
    if (phase !== 'open') return;
    setPhase('settled');
    setUpdates((u) => [
      ...u,
      {
        n: u.length,
        text: `on-chain: cooperative close confirms the final split (Ana ${ana.toLocaleString('en-US')} / Bo ${bo.toLocaleString('en-US')})`,
        ana,
        bo,
      },
    ]);
  };

  return (
    <div className="chan">
      {phase === 'closed' ? (
        <button className="runbtn" onClick={open}>
          open the tab: lock {FUNDING.toLocaleString('en-US')} sats to both keys
        </button>
      ) : (
        <>
          <div className="chan-balance" aria-label="Channel balance">
            <div className="chan-bar" aria-hidden="true">
              <div className="chan-bar-ana" style={{ width: `${(ana / FUNDING) * 100}%` }} />
            </div>
            <div className="chan-legend">
              <span>
                <span className="story-avatar story-avatar-ana" aria-hidden="true">A</span> Ana{' '}
                {ana.toLocaleString('en-US')} sats
              </span>
              <span>
                Bo {bo.toLocaleString('en-US')} sats{' '}
                <span className="story-avatar story-avatar-bo" aria-hidden="true">B</span>
              </span>
            </div>
          </div>

          {phase === 'open' && (
            <div className="stress-chips">
              <button className="preset" onClick={() => pay('ana', COFFEE, `Ana buys a ${COFFEE.toLocaleString('en-US')}-sat coffee`)} disabled={ana < COFFEE}>
                Ana buys a coffee ({COFFEE.toLocaleString('en-US')} sats)
              </button>
              <button className="preset" onClick={() => pay('bo', BO_PAYS, `Bo pays Ana back ${BO_PAYS.toLocaleString('en-US')} sats`)} disabled={bo < BO_PAYS}>
                Bo pays Ana ({BO_PAYS.toLocaleString('en-US')} sats)
              </button>
              <button className="preset" onClick={tryCheat} disabled={!canCheat}>
                Bo tries to cheat with an old state
              </button>
              <button className="preset" onClick={close} disabled={payments < 1}>
                close the tab cooperatively
              </button>
            </div>
          )}

          <div className="stat-grid chan-stats">
            <div className="stat">
              <div className="stat-label">payments made</div>
              <div className="stat-value">{Math.max(0, payments)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">on-chain transactions</div>
              <div className="stat-value">{phase === 'open' ? 1 : 2}</div>
            </div>
            <div className="stat">
              <div className="stat-label">≈ vbytes bought at auction</div>
              <div className="stat-value">{bytesActual.toLocaleString('en-US')}</div>
            </div>
            <div className="stat">
              <div className="stat-label">≈ vbytes if each payment were on-chain</div>
              <div className="stat-value">{bytesIfOnChain.toLocaleString('en-US')}</div>
            </div>
          </div>

          <ol className="stress-steps">
            {updates.slice(-4).map((u) => (
              <li key={u.n} className="stress-step">
                <p className="stress-step-body">{u.text}</p>
              </li>
            ))}
          </ol>

          {cheat && (
            <ol className="stress-steps">
              {cheat.map((line, i) => (
                <li key={i} className={`stress-step ${i === 3 ? 'stress-good' : 'stress-bad'}`}>
                  <p className="stress-step-body">{line}</p>
                </li>
              ))}
            </ol>
          )}

          {phase === 'settled' && (
            <Callout>
              <strong>
                {payments} payment{payments === 1 ? '' : 's'}, two on-chain transactions.
              </strong>{' '}
              <RichText
                text={`The chain sold you ≈${bytesActual.toLocaleString('en-US')} vbytes total instead of ≈${bytesIfOnChain.toLocaleString('en-US')}, and every unwritten payment was still enforceable Bitcoin the whole time. That gap is Lightning's entire pitch, and the penalty script is why the gap is safe.`}
              />
            </Callout>
          )}
          {phase === 'penalized' && (
            <Callout>
              <strong>The tab ended in court, and the cheater paid for the courtroom.</strong>{' '}
              <RichText text="Bo's stale broadcast met the OP_IF penalty branch: Ana took the entire channel. Replay it honestly with 'open the tab' and close cooperatively instead; the whole point of the script is that this path is never worth taking." />
            </Callout>
          )}
          {(phase === 'settled' || phase === 'penalized') && (
            <button className="runbtn" onClick={open}>
              open a fresh tab
            </button>
          )}
        </>
      )}

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
