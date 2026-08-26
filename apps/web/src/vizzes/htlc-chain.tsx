import { useState } from 'react';
import { VizFigure } from './viz-figure';

const HOPS = [
  { name: 'Mira', out: 180_000, cltv: 800_140 },
  { name: 'the hub', out: 179_820, cltv: 800_100 },
  { name: 'Ines', out: 0, cltv: 0 },
];

/**
 * The chain figure: the same hash locking every hop, with deadlines that
 * descend along the route. Settling runs backwards from the recipient,
 * which is the part most explanations draw the wrong way round.
 */
export function HtlcChain() {
  const [settledFrom, setSettledFrom] = useState<number | null>(null);

  const settle = () => setSettledFrom(HOPS.length - 1);
  const isSettled = (i: number) => settledFrom !== null && i >= settledFrom - 1;

  return (
    <VizFigure
      title="The chain of promises"
      caption="One hash locks every hop. Press settle and watch it resolve backwards, from the recipient towards the payer."
    >
      <svg viewBox="0 0 340 96" style={{ width: '100%', height: 'auto' }} role="img" aria-label="A three-node route with HTLCs between them">
        {HOPS.map((hop, i) => {
          const x = 20 + i * 130;
          const settled = isSettled(i);
          return (
            <g key={hop.name}>
              <circle
                cx={x}
                cy={40}
                r={16}
                fill={settled ? 'var(--brand-soft)' : 'var(--surface-2)'}
                stroke={settled ? 'var(--brand)' : 'var(--hairline-strong)'}
                strokeWidth="1.5"
              />
              <text x={x} y={72} textAnchor="middle" fontSize="10" fill="var(--ink-2)">
                {hop.name}
              </text>
              {i < HOPS.length - 1 && (
                <>
                  <line
                    x1={x + 18}
                    y1={40}
                    x2={x + 110}
                    y2={40}
                    stroke={settled ? 'var(--brand)' : 'var(--baseline)'}
                    strokeWidth="2"
                    strokeDasharray={settled ? undefined : '4 3'}
                  />
                  <text x={x + 64} y={30} textAnchor="middle" fontSize="9" fill="var(--muted)">
                    {hop.out.toLocaleString('en-US')} sats
                  </text>
                  <text x={x + 64} y={54} textAnchor="middle" fontSize="9" fill="var(--muted)">
                    expires {hop.cltv.toLocaleString('en-US')}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <button className="runbtn" onClick={settle} disabled={settledFrom !== null}>
        {settledFrom !== null ? '✓ Route settled' : '▶ Settle the route'}
      </button>{' '}
      {settledFrom !== null && (
        <button className="preset" onClick={() => setSettledFrom(null)}>
          reset
        </button>
      )}

      <p className="utxo-box-note">
        {settledFrom === null ? (
          <>
            Two promises, one hash, and deadlines that <strong>descend</strong> — 40 blocks of
            margin so the hub can always claim its incoming HTLC after paying out. Right now
            nobody has been paid and nobody can be cheated.
          </>
        ) : (
          <>
            Ines claimed by revealing the secret, which necessarily gave it to the hub, which
            immediately claimed from Mira. <strong>Both hops or neither</strong> — and the hub
            never had a moment where keeping the money was an option.
          </>
        )}
      </p>
    </VizFigure>
  );
}
