import { useState } from 'react';
import { VizFigure } from './viz-figure';

/** Mira builds the onion; she never peels it. One layer per receiving node. */
const SENDER = 'Mira';
const HOPS = ['the hub', 'a relay', 'another relay', 'Ines'];
const PACKET_BYTES = 1366;

/**
 * The peel figure: the sender wraps one layer per hop, then layers come
 * off one at a time, and the packet that gets forwarded is always exactly
 * the same size. The constant number is the whole point: a shrinking
 * packet would leak your position.
 */
export function OnionPeel() {
  // How many layers have been peeled so far (0 = still as Mira built it).
  const [peeled, setPeeled] = useState(0);

  const remaining = HOPS.length - peeled;
  const atFinal = peeled === HOPS.length;
  const lastPeeler = peeled > 0 ? HOPS[peeled - 1] : null;

  return (
    <VizFigure
      title="Layers, at a constant size"
      caption="Peel a layer per hop. Watch what each node learns and watch the forwarded size never budge."
    >
      <svg viewBox="0 0 240 140" style={{ width: '100%', maxWidth: 300, height: 'auto' }} role="img" aria-label="Nested onion layers, peeled one per hop">
        {HOPS.map((_, i) => {
          const r = 62 - i * 11;
          const gone = i < peeled;
          if (gone) return null;
          return (
            <circle
              key={i}
              cx={120}
              cy={70}
              r={r}
              fill="none"
              stroke={i === peeled ? 'var(--brand)' : 'var(--hairline-strong)'}
              strokeWidth={i === peeled ? 2 : 1.2}
            />
          );
        })}
        <text x={120} y={74} textAnchor="middle" fontSize="11" fill="var(--ink-2)">
          {remaining === 0 ? 'all opened' : `${remaining} layer${remaining === 1 ? '' : 's'}`}
        </text>
      </svg>

      <button
        className="runbtn"
        onClick={() => setPeeled((p) => Math.min(p + 1, HOPS.length))}
        disabled={atFinal}
      >
        {atFinal ? '✓ Reached the recipient' : `▶ ${HOPS[peeled]} peels a layer`}
      </button>{' '}
      {peeled > 0 && (
        <button className="preset" onClick={() => setPeeled(0)}>
          reset
        </button>
      )}

      <div className="viz-readout">
        <div className="stat">
          <div className="stat-value">
            {PACKET_BYTES}{' '}
            <span className="stat-unit">bytes forwarded, the same after every single hop</span>
          </div>
        </div>
        <div role="status">
          <div className="stat-label">
            {lastPeeler ? `what ${lastPeeler} learns` : `${SENDER}, the sender, built this`}
          </div>
          <span className="stat-unit">
            {lastPeeler === null
              ? `${SENDER} wrapped one layer per hop, ${HOPS.length} in all, so she alone knows the whole route. Nobody downstream learns that she started it.`
              : atFinal
                ? 'that the payment is for them: the onward HMAC is all zeros, which is the only positional fact anyone on the route gets'
                : `send it to ${HOPS[peeled]}, and this much. Not who started it, not who ends it, not how long the route is, not where in it they are.`}
          </span>
        </div>
      </div>

      <p className="utxo-box-note">
        Each hop re-pads what it forwards, so the size carries no information. A packet that got
        shorter would tell every node how close to the recipient it was and a node that knows
        it is last knows who is being paid.
      </p>
    </VizFigure>
  );
}
