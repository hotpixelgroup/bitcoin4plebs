import { useState } from 'react';
import { VizFigure } from './viz-figure';
import { usePrefersReducedMotion } from '../lib/use-reduced-motion';

/**
 * Energy in, security out: the transformation people miss. Each mined
 * block is a receipt for real energy spent, and stacking blocks turns
 * that spent energy into a wall of accumulated work no attacker can
 * cheaply out-build. Tap to add blocks and watch the wall (and the
 * energy an attacker must out-burn) grow.
 */
export function EnergyToSecurity() {
  const reduced = usePrefersReducedMotion();
  const [blocks, setBlocks] = useState(3);
  const max = 12;

  return (
    <VizFigure
      title="Energy in, security out"
      caption="Conceptual work accumulation at constant illustrative difficulty. Block count is not a joule measurement, and elapsed time varies."
    >
      <div className="e2s-flow" aria-hidden="true">
        <span className="e2s-stage e2s-energy">electricity spent</span>
        <span className="e2s-arrow">→</span>
        <span className="e2s-stage e2s-guess">hundreds of sextillions of guesses</span>
        <span className="e2s-arrow">→</span>
        <span className="e2s-stage e2s-block">one valid block</span>
        <span className="e2s-arrow">→</span>
        <span className="e2s-stage e2s-wall">a wall of work</span>
      </div>

      <div className="e2s-wallarea">
        <div className="e2s-stack" role="img" aria-label={`${blocks} blocks stacked, each adding target-derived expected work`}>
          {Array.from({ length: blocks }, (_, i) => (
            <div
              key={i}
              className="e2s-brick"
              style={reduced ? undefined : { animationDelay: `${i * 30}ms` }}
            >
              block {i + 1}
            </div>
          ))}
        </div>
        <div className="e2s-readout" role="status">
          <div className="e2s-metric">
            <span className="e2s-metric-num">{blocks}</span>
            <span className="e2s-metric-label">blocks of history</span>
          </div>
          <div className="e2s-metric">
            <span className="e2s-metric-num">≈ {blocks * 10} min</span>
            <span className="e2s-metric-label">illustrative elapsed time at ten minutes per block</span>
          </div>
          <p className="e2s-note">
            Hardware efficiency can improve without breaking Bitcoin. A replacement valid chain must carry greater cumulative work; minority attackers sometimes succeed by chance.
          </p>
        </div>
      </div>

      <div className="e2s-controls">
        <button className="preset" onClick={() => setBlocks((b) => Math.min(max, b + 1))} disabled={blocks >= max}>
          add a block (illustrative +10 min)
        </button>
        <button className="preset" onClick={() => setBlocks(3)}>
          reset
        </button>
      </div>
    </VizFigure>
  );
}
