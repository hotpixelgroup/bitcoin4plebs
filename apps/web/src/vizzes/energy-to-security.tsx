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
      caption="Each block is a receipt for energy spent. Stack them and that spent energy becomes a wall the past hides behind. Add blocks and watch it grow."
    >
      <div className="e2s-flow" aria-hidden="true">
        <span className="e2s-stage e2s-energy">electricity spent</span>
        <span className="e2s-arrow">→</span>
        <span className="e2s-stage e2s-guess">trillions of guesses</span>
        <span className="e2s-arrow">→</span>
        <span className="e2s-stage e2s-block">one valid block</span>
        <span className="e2s-arrow">→</span>
        <span className="e2s-stage e2s-wall">a wall of work</span>
      </div>

      <div className="e2s-wallarea">
        <div className="e2s-stack" role="img" aria-label={`${blocks} blocks stacked, each certifying spent energy`}>
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
        <div className="e2s-readout">
          <div className="e2s-metric">
            <span className="e2s-metric-num">{blocks}</span>
            <span className="e2s-metric-label">blocks of history</span>
          </div>
          <div className="e2s-metric">
            <span className="e2s-metric-num">≈ {blocks * 10} min</span>
            <span className="e2s-metric-label">of the whole network's energy an attacker must out-burn to rewrite</span>
          </div>
          <p className="e2s-note">
            Making each block cheaper wouldn&apos;t help Bitcoin: it would shrink this wall. The
            cost <em>is</em> the wall.
          </p>
        </div>
      </div>

      <div className="e2s-controls">
        <button className="preset" onClick={() => setBlocks((b) => Math.min(max, b + 1))} disabled={blocks >= max}>
          mine another block (+10 min of work)
        </button>
        <button className="preset" onClick={() => setBlocks(3)}>
          reset
        </button>
      </div>
    </VizFigure>
  );
}
