import { useState } from 'react';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

interface Depth {
  blocks: number;
  label: string;
  human: string;
}

const DEPTHS: Depth[] = [
  { blocks: 1, label: '1 confirmation', human: 'a few minutes old' },
  { blocks: 6, label: '6 confirmations', human: 'six confirmations; elapsed time varies' },
  { blocks: 144, label: '1 day deep', human: 'yesterday' },
  { blocks: 52_560, label: '1 year deep', human: 'a year ago (like Ana\'s bike payment)' },
];

/**
 * Price a rewrite. Deliberately round, illustrative numbers that scale
 * the real relationship: to undo a transaction N blocks deep, an
 * attacker must redo all N blocks of proof-of-work AND out-race the
 * honest network extending the real chain. The exact dollars depend on
 * a live hashrate and power price we do not assert; the mechanism is the
 * lesson.
 */
export function RewriteCost({ finale }: RunnerProps) {
  const [depth, setDepth] = useState<Depth>(DEPTHS[1]);

  const networkMinutes = depth.blocks * 10;
  const networkDays = networkMinutes / 60 / 24;
  const scale = 'An alternative history must satisfy every consensus rule and exceed the active chain’s cumulative target-derived work. Even minority hashpower can sometimes catch up by luck; success probability depends on depth, relative hashpower, difficulty and assumptions. This display is only a depth-to-time scale at an assumed ten-minute interval, not a measurement of historical electricity or a full attack-cost model.';

  return (
    <div className="rw">
      <div className="stress-chips" role="group" aria-label="How deep is the transaction?">
        {DEPTHS.map((d) => (
          <button
            key={d.blocks}
            className={`preset ${d.blocks === depth.blocks ? 'preset-active' : ''}`}
            aria-pressed={d.blocks === depth.blocks}
            onClick={() => setDepth(d)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="rw-sub">
        Target: a transaction <strong>{depth.human}</strong>. To erase it, an attacker must redo
        every block from there to the chain tip, then extend past the real chain.
      </p>

      <div className="stat-grid rw-stats">
        <div className="stat">
          <div className="stat-label">blocks to re-mine</div>
          <div className="stat-value">{depth.blocks.toLocaleString('en-US')}</div>
        </div>
        <div className="stat">
          <div className="stat-label">illustrative elapsed time at 10 min/block</div>
          <div className="stat-value">
            {networkDays >= 1
              ? `${Math.round(networkDays).toLocaleString('en-US')} days`
              : `${networkMinutes} min`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">and simultaneously</div>
          <div className="stat-value">exceed valid-chain work</div>
        </div>
      </div>

      <Callout>
        <RichText text={scale} />
      </Callout>

      <p className="rw-punch">
        <RichText text="Chainwork measures expected hash work, not exact attempts or joules. More confirmations can increase confidence under stated assumptions, but no displayed depth proves physical permanence." />
      </p>

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
