import { useState } from 'react';
import { VizFigure } from './viz-figure';

const RACES = 1000;
const HOPELESS_LEAD = 40;

/**
 * The catch-up race: an attacker who wants to rewrite a payment buried
 * under z confirmations must out-mine the entire honest network from z
 * blocks behind. Run a thousand races and watch the exponential wall,
 * then remember what winning would even buy them (reordering, never
 * printing).
 */
export function FiftyoneRace() {
  const [attacker, setAttacker] = useState(30);
  const [confirmations, setConfirmations] = useState(6);
  const [result, setResult] = useState<{
    wins: number;
    unresolved: number;
    dots: boolean[];
  } | null>(null);

  const run = () => {
    const p = attacker / 100;
    const dots: boolean[] = [];
    let wins = 0;
    let seed = 0x51c0ffee;
    let unresolved = 0;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    for (let race = 0; race < RACES; race++) {
      // Attacker starts z blocks behind; each new block is theirs with
      // probability p. "Caught up" = the deficit ever reaches zero: the
      // exact event the whitepaper's (q/p)^z formula prices.
      let deficit = confirmations;
      for (
        let step = 0;
        step < 4000 && deficit > 0 && deficit < HOPELESS_LEAD;
        step++
      ) {
        deficit += random() < p ? -1 : 1;
      }
      const won = deficit <= 0;
      if (!won) unresolved++;
      if (won) wins++;
      if (race < 200) dots.push(won);
    }
    setResult({ wins, unresolved, dots });
  };

  // The famous closed form from the whitepaper's section 11: catch-up
  // probability from z behind is (q/p)^z for a minority attacker.
  const q = attacker / 100;
  const analytic = q >= 0.5 ? 1 : Math.pow(q / (1 - q), confirmations);

  return (
    <VizFigure
      title="The catch-up race"
      caption="A seeded random walk from a known block deficit. Reaching a tie is not guaranteed chain replacement."
    >
      <div className="race-controls">
        <label className="height-input-label race-slider-label">
          Attacker's share of all hashpower: <strong>{attacker}%</strong>
          <input
            className="fee-slider"
            type="range"
            min={5}
            max={60}
            step={1}
            value={attacker}
            onChange={(e) => {
              setAttacker(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
        <label className="height-input-label race-slider-label">
          Known starting block deficit: <strong>{confirmations}</strong>
          <input
            className="fee-slider"
            type="range"
            min={1}
            max={6}
            step={1}
            value={confirmations}
            onChange={(e) => {
              setConfirmations(Number(e.target.value));
              setResult(null);
            }}
          />
        </label>
        <button className="runbtn" onClick={run}>
          ▶ Run {RACES.toLocaleString('en-US')} races
        </button>
      </div>
      {result && (
        <>
          <div className="race-dots" aria-hidden="true">
            {result.dots.map((won, i) => (
              <span
                key={i}
                className={`race-dot ${won ? 'race-dot-win' : ''}`}
              />
            ))}
          </div>
          <div className="stat-grid race-stats">
            <div className="stat">
              <div className="stat-label">
                attacker reached a tie within the budget
              </div>
              <div className="stat-value">
                {result.wins}{' '}
                <span className="stat-unit">
                  of {RACES.toLocaleString('en-US')}
                </span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">
                unbounded tie-reaching probability
              </div>
              <div className="stat-value">
                {analytic >= 1
                  ? 'eventually 100%'
                  : analytic < 0.0001
                    ? '≈ 0%'
                    : `${(analytic * 100).toFixed(2)}%`}
              </div>
            </div>
          </div>
        </>
      )}
      <p className="viz-readout">
        This is the conditional catch-up model from a known deficit, not an
        attacker mining secretly during a merchant’s confirmation wait. Constant
        independent hash shares and equal per-block difficulty are assumed. A
        tie does not guarantee adoption. Trials stop after 4,000 steps or a
        deficit of 40; non-ties are unresolved, not proof the attacker never
        catches up.
      </p>
      {result && (
        <p role="status">
          {result.wins} ties; {result.unresolved} unresolved at the cutoff.
          Fixed seed: 0x51c0ffee. Green dots show ties among the first 200
          trials.
        </p>
      )}
    </VizFigure>
  );
}
