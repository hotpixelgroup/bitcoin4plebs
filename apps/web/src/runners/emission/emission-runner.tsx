import { useEffect, useRef, useState } from 'react';
import {
  computeEras,
  formatHeight,
  MAX_MONEY,
  satsToBtc,
  totalSupply,
  type Era,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, CodeCard, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';
import { SupplyChart } from './supply-chart';

const ERAS = computeEras();
const TOTAL = totalSupply();
const STEP_MS = 110;

/**
 * The "run it yourself" finale for Quest #1: animates every reward era,
 * fills the table and chart, and lands on the exact total supply,
 * computed live in the reader's own browser.
 */
export function EmissionRunner({ finale }: RunnerProps) {
  // Number of eras revealed so far; 0 = not started.
  const [revealed, setRevealed] = useState(0);
  const running = revealed > 0 && revealed < ERAS.length;
  const done = revealed === ERAS.length;
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setRevealed((n) => Math.min(n + 1, ERAS.length)), STEP_MS);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    const el = tableRef.current;
    if (el && revealed > 0) el.scrollTop = el.scrollHeight;
  }, [revealed]);

  const current: Era | undefined = revealed > 0 ? ERAS[revealed - 1] : undefined;

  return (
    <div className="cols">
      <div className="prose">
        {finale.translation && <CodeCard excerpt={finale.translation} />}
        <button
          className="runbtn"
          onClick={() => setRevealed((n) => (n === 0 ? 1 : n))}
          disabled={revealed > 0}
        >
          {done
            ? `✓ Verified: ${satsToBtc(TOTAL, 4)} BTC`
            : running
              ? 'Running…'
              : '▶ Run the emission schedule'}
        </button>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
        {done && (
          <Callout>
            <strong>What just happened:</strong> your computer computed all {ERAS.length} reward
            eras. After era {ERAS.length} the reward shifts to zero and stays there: no block
            after height {formatHeight(ERAS[ERAS.length - 1].endHeight)} mints a single new
            satoshi. The rewards sum to <strong>{satsToBtc(TOTAL, 4)} BTC</strong>:{' '}
            <em>under</em> 21 million, forever, exactly as the ten lines predicted.
          </Callout>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">Total bitcoin in existence, by block height</div>
          <div className="viz-sub">
            Computed live from the function on the left · dashed line = MAX_MONEY sanity cap
          </div>
          <div className="hero-num">
            {current ? satsToBtc(current.cumulative, 4) : '0'}
            <span className="hero-unit"> BTC</span>
          </div>
          <div className="hero-cap">
            {done ? (
              <>
                <span className="ok">✓ cap holds</span>: {satsToBtc(MAX_MONEY - TOTAL, 4)} BTC
                below 21,000,000, verified on your machine
              </>
            ) : current ? (
              `era ${current.era} of ${ERAS.length} · reward ${satsToBtc(current.subsidy)} BTC/block`
            ) : (
              'press ▶ to compute'
            )}
          </div>
          <SupplyChart eras={ERAS} revealed={revealed} done={done} />
        </div>
        <div className="eratbl-wrap" ref={tableRef}>
          <table aria-label="Emission schedule by era">
            <thead>
              <tr>
                <th>Era</th>
                <th>Blocks</th>
                <th>Reward / block</th>
                <th>Minted in era</th>
                <th>Running total</th>
              </tr>
            </thead>
            <tbody>
              {revealed === 0 ? (
                <tr>
                  <td colSpan={5} className="eratbl-empty">
                    Run the schedule to fill this table.
                  </td>
                </tr>
              ) : (
                ERAS.slice(0, revealed).map((e) => (
                  <tr key={e.era}>
                    <td>Era {e.era}</td>
                    <td>
                      {formatHeight(e.startHeight)}–{formatHeight(e.endHeight)}
                    </td>
                    <td>{satsToBtc(e.subsidy)}</td>
                    <td>{satsToBtc(e.minted)}</td>
                    <td>{satsToBtc(e.cumulative, 4)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
