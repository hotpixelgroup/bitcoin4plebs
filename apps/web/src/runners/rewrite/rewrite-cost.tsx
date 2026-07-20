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
  { blocks: 6, label: '6 confirmations', human: 'about an hour old (the customary "final")' },
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
  const scale =
    depth.blocks <= 1
      ? 'And even this shallow rewrite means out-mining the entire planet for those minutes, then pulling ahead. Possible only for an attacker who already commands most of the world\'s hashpower, and only briefly (Quest #4).'
      : depth.blocks <= 6
        ? 'Undoing this means re-burning about an hour of the entire global network\'s energy, faster than everyone else is adding more. This is why merchants treat six confirmations as settled.'
        : depth.blocks <= 144
          ? 'Rewriting a single day means redoing a day of the whole world\'s mining, while the honest network keeps stacking new work on top. No entity on Earth is known to be able to do this.'
          : 'Rewriting a year means out-burning a year of humanity\'s entire Bitcoin mining effort, then racing past a network that never stopped. This is why deep history is treated as physically permanent.';

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
          <div className="stat-label">≈ network-time of energy to redo</div>
          <div className="stat-value">
            {networkDays >= 1
              ? `${Math.round(networkDays).toLocaleString('en-US')} days`
              : `${networkMinutes} min`}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">and simultaneously</div>
          <div className="stat-value">out-race everyone</div>
        </div>
      </div>

      <Callout>
        <RichText text={scale} />
      </Callout>

      <p className="rw-punch">
        <RichText text="Read the energy figure and the safety figure again: they are the **same number**. The electricity a critic calls wasted is the exact wall this attacker cannot climb." />
      </p>

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
