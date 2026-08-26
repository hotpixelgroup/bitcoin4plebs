import { useState } from 'react';
import { VizFigure } from './viz-figure';

const START = 200_000;
const COFFEE = 4_000;

/**
 * The ladder figure: buy coffees and watch each previous balance turn
 * radioactive as its revocation secret is handed over. The point is that
 * poisoning old states is not a separate step anyone has to remember, * it is a side effect of ordinary use.
 */
export function RevocationLadder() {
  const [count, setCount] = useState(0);

  const states = Array.from({ length: count + 1 }, (_, i) => ({
    n: i,
    tomas: START - i * COFFEE,
    mira: i * COFFEE,
    revoked: i < count,
  }));
  const visible = states.slice(-6).reverse();

  return (
    <VizFigure
      title="Radioactive history"
      caption="Buy a coffee. Every balance you leave behind becomes one your counterparty can punish you for publishing."
    >
      <button className="runbtn" onClick={() => setCount((c) => c + 1)}>
        ▶ Buy a coffee ({COFFEE.toLocaleString('en-US')} sats)
      </button>{' '}
      {count > 0 && (
        <button className="preset" onClick={() => setCount(0)}>
          reset
        </button>
      )}

      <div className="viz-readout">
        {visible.map((state) => (
          <div
            key={state.n}
            className="sc-detail-row"
            style={{
              opacity: state.revoked ? 0.55 : 1,
              borderLeft: `3px solid ${state.revoked ? 'var(--bad)' : 'var(--brand)'}`,
              paddingLeft: 10,
              marginBottom: 6,
            }}
          >
            <span className="stat-label">
              state {state.n}
              {state.revoked ? ' · revoked' : ' · current'}
            </span>
            <span className="stat-unit">
              Tomas {state.tomas.toLocaleString('en-US')} · Mira{' '}
              {state.mira.toLocaleString('en-US')}
              {state.revoked && ', publishing this hands Mira the lot'}
            </span>
          </div>
        ))}
        {count > 5 && (
          <div className="stat-label">…and {count - 5} older states, every one of them radioactive</div>
        )}
      </div>

      <p className="utxo-box-note">
        {count === 0 ? (
          <>One state, nothing revoked yet. Nobody can punish anybody: there is no past to lie about.</>
        ) : (
          <>
            Tomas holds <strong>{count + 1}</strong> perfectly valid signed transactions and can
            publish any of them. {count} of them would cost him everything, because each was
            revoked by handing Mira the secret that completes her penalty key.
          </>
        )}
      </p>
    </VizFigure>
  );
}
