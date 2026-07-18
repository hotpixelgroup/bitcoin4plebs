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
  const [result, setResult] = useState<{ wins: number; dots: boolean[] } | null>(null);

  const run = () => {
    const p = attacker / 100;
    const dots: boolean[] = [];
    let wins = 0;
    for (let race = 0; race < RACES; race++) {
      // Attacker starts z blocks behind; each new block is theirs with
      // probability p. "Caught up" = the deficit ever reaches zero: the
      // exact event the whitepaper's (q/p)^z formula prices.
      let deficit = confirmations;
      for (let step = 0; step < 4000 && deficit > 0 && deficit < HOPELESS_LEAD; step++) {
        deficit += Math.random() < p ? -1 : 1;
      }
      const won = deficit <= 0;
      if (won) wins++;
      if (race < 200) dots.push(won);
    }
    setResult({ wins, dots });
  };

  // The famous closed form from the whitepaper's section 11: catch-up
  // probability from z behind is (q/p)^z for a minority attacker.
  const q = attacker / 100;
  const analytic = q >= 0.5 ? 1 : Math.pow(q / (1 - q), confirmations);

  return (
    <VizFigure
      title="The catch-up race"
      caption="An attacker re-mining history has to catch the honest chain from behind. Feel how fast the wall grows."
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
          Confirmations burying the payment: <strong>{confirmations}</strong>
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
              <span key={i} className={`race-dot ${won ? 'race-dot-win' : ''}`} />
            ))}
          </div>
          <div className="stat-grid race-stats">
            <div className="stat">
              <div className="stat-label">attacker rewrote history</div>
              <div className="stat-value">
                {result.wins} <span className="stat-unit">of {RACES.toLocaleString('en-US')}</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">whitepaper's math says</div>
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
        {!result &&
          'Each race: the payment sits under the chosen confirmations, and the attacker secretly mines an alternative history, needing to overtake the honest chain. First dot grid shows 200 of the races; green means the attacker caught up.'}
        {result &&
          q < 0.5 &&
          `Every extra confirmation multiplies the attacker's required luck. That's the exponential (q/p)^z from Satoshi's whitepaper, and why "wait for 6" is folk wisdom with math behind it. And notice the fine print of "winning": ${
            result.wins > 0 ? 'even the green dots' : 'even a win'
          } only lets the attacker take back coins THEY recently spent. The coinbase audit from Quest #1 still runs on their rewritten blocks: reordering is possible with luck; printing never is.`}
        {result &&
          q >= 0.5 &&
          'With a true majority the attacker eventually catches any depth; that\'s the honest meaning of "51% attack." But look closely at the prize: they can reorder recent history and double-spend their OWN coins. Their rewritten blocks still pass through every node\'s subsidy and signature audits, so majority hashpower cannot print a satoshi or touch your keys (Quest #4).'}
      </p>
    </VizFigure>
  );
}
