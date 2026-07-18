import { useState } from 'react';
import { INITIAL_SUBSIDY, satsToBtc } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

const TOTAL_BITS = 36; // 50 BTC = 5,000,000,000 sats needs 33 bits; a little headroom for display

/**
 * The bit-shift: the subsidy shown as raw binary satoshis, with the
 * `>>=` from GetBlockSubsidy erasing one bit off the right edge per
 * halving. Watch 21 million emerge from erosion: 33 shifts and the number
 * is simply gone. No "21,000,000" constant required — this IS the cap.
 */
export function BitshiftHalving() {
  const [halvings, setHalvings] = useState(0);

  const subsidy = halvings >= 64 ? 0n : INITIAL_SUBSIDY >> BigInt(halvings);
  const binary = subsidy.toString(2).padStart(TOTAL_BITS, '0');
  const firstOne = binary.indexOf('1');

  return (
    <VizFigure
      title="The erosion"
      caption="The block reward in raw binary satoshis. Each halving is one right-shift — a bit falls off the edge, forever."
    >
      <div className="bitshift">
        <div className="bitshift-controls">
          <button
            className="preset"
            onClick={() => setHalvings((h) => Math.max(0, h - 1))}
            disabled={halvings === 0}
          >
            ← undo
          </button>
          <button
            className="runbtn bitshift-btn"
            onClick={() => setHalvings((h) => Math.min(33, h + 1))}
            disabled={subsidy === 0n}
          >
            {subsidy === 0n ? 'Nothing left to halve' : '▶ nSubsidy >>= 1 (halve it)'}
          </button>
          <button className="preset" onClick={() => setHalvings(0)} disabled={halvings === 0}>
            reset
          </button>
        </div>
        <div className="bitshift-row" aria-hidden="true">
          {[...binary].map((bit, i) => (
            <span
              key={`${halvings}-${i}`}
              className={`bitshift-bit ${bit === '1' ? 'bitshift-one' : ''} ${
                i < firstOne || firstOne === -1 ? 'bitshift-gone' : ''
              }`}
            >
              {bit}
            </span>
          ))}
          <span className="bitshift-edge">→ 🗑</span>
        </div>
        <div className="stat-grid bitshift-stats">
          <div className="stat">
            <div className="stat-label">halvings so far</div>
            <div className="stat-value">{halvings}</div>
          </div>
          <div className="stat">
            <div className="stat-label">block reward</div>
            <div className="stat-value">
              {satsToBtc(subsidy)} <span className="stat-unit">BTC</span>
            </div>
          </div>
        </div>
        <p className="viz-readout">
          {subsidy === 0n
            ? 'After 33 shifts every bit has fallen off the edge. That — not a constant anyone wrote — is where "21 million" comes from: the sum of everything this row held along the way, 20,999,999.9769 BTC.'
            : halvings === 0
              ? '5,000,000,000 satoshis (50 BTC), as the machine sees it. Press the button: whole-number division by two is just sliding everything right and letting the last bit fall off. Remainders are never kept.'
              : `Each press erased the rightmost bit permanently — that's why the sum of all rewards lands just UNDER 21M, never on it. ${33 - halvings} shifts until zero.`}
        </p>
      </div>
    </VizFigure>
  );
}
