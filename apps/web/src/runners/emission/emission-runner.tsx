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
 * Break it yourself: edit the constants the quest just verified and watch
 * what each edit does to the 21M promise. The interval change forks you
 * onto a lonely chain; removing the 64-halving guard reproduces the exact
 * disaster (x86 shift wraparound) that lines 1850-51 exist to prevent.
 */
function TamperPanel() {
  const [interval, setIntervalValue] = useState('210000');
  const [guard, setGuard] = useState(true);
  const [result, setResult] = useState<{ eras: Era[]; interval: number; guard: boolean } | null>(null);

  const run = () => {
    const parsed = Number.parseInt(interval.replace(/,/g, ''), 10);
    const safeInterval = Number.isFinite(parsed) && parsed > 0 ? parsed : 210_000;
    setResult({
      eras: computeEras({ halvingInterval: safeInterval, guard64: guard }),
      interval: safeInterval,
      guard,
    });
  };

  const total = result ? result.eras[result.eras.length - 1].cumulative : null;
  const blewCap = total !== null && total > MAX_MONEY;
  const changedInterval = result !== null && result.interval !== 210_000;

  return (
    <details className="depth tamper">
      <summary><span aria-hidden="true">🔧</span> Break it yourself</summary>
      <div className="depth-body">
        <p className="tamper-intro">
          You just verified the rules. Now edit them and see what you'd actually get.
        </p>
        <label className="height-input-label">
          Halving interval (Bitcoin uses 210,000):
          <input
            className="height-input"
            type="text"
            inputMode="numeric"
            value={interval}
            onChange={(e) => setIntervalValue(e.target.value)}
          />
        </label>
        <label className="tamper-check">
          <input type="checkbox" checked={!guard} onChange={(e) => setGuard(!e.target.checked)} />
          <span>
            Remove the <code>halvings &gt;= 64</code> guard (simulate the undefined C++ shift on
            x86 hardware)
          </span>
        </label>
        <button className="runbtn tamper-btn" onClick={run}>
          ▶ Run my broken schedule
        </button>
        {result && total !== null && (
          <Callout>
            <strong>Your chain's total supply: {satsToBtc(total, 4)} BTC{result.guard ? '' : ' and still climbing'}.</strong>{' '}
            {!result.guard && (
              <>
                Without the guard, the shift count wraps at 64 the way x86 hardware treats C++'s
                undefined behavior, so era 65's reward snaps <em>back to 50 BTC</em> and the
                schedule repeats forever. The cap is gone; that is precisely why validation.cpp
                lines 1850–51 exist.{' '}
              </>
            )}
            {changedInterval && result.guard && (
              <>
                Different interval, different money: your cap is now{' '}
                {satsToBtc(total, 4)} BTC across {result.eras.length} eras.{' '}
              </>
            )}
            {blewCap ? (
              <>
                <span className="chain-bad">✗ MAX_MONEY exceeded.</span> On the real network your
                very first oversized coinbase dies with <code>bad-cb-amount</code> on every node
                (Quest #1, Stop 4).
              </>
            ) : (
              <>
                The arithmetic works, but as Quest #4 showed: you just described a different
                network with zero users, because every existing node rejects its blocks.
              </>
            )}
          </Callout>
        )}
      </div>
    </details>
  );
}

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
        {done && <TamperPanel />}
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
