import { useState } from 'react';
import { BOLT7_EXAMPLE_GRAPH, findRoutes } from '@bitcoin4plebs/lightning-logic';
import { VizFigure } from './viz-figure';

const fmtMsat = (m: number) => `${(m / 1000).toFixed(3)} sats`;

/**
 * The route race: every path from A to C in the specification's own
 * four-node network, costed and ranked. The point is that the cheapest
 * route is chosen by price, not by hop count and here the two-hop
 * options differ by more than double.
 */
export function RouteRace() {
  const [amountSats, setAmountSats] = useState(1_000);
  const routes = findRoutes(BOLT7_EXAMPLE_GRAPH, 'A', 'C', amountSats * 1_000);
  const cheapest = routes[0];
  const dearest = routes[routes.length - 1];

  return (
    <VizFigure
      title="The race"
      caption="Every route from A to C in BOLT #7's own network, costed and ranked. Cheapest wins, not shortest."
    >
      <label className="height-input-label" htmlFor="race-amount">
        paying C <strong>{amountSats.toLocaleString('en-US')} sats</strong>
      </label>
      <input
        id="race-amount"
        className="fee-slider"
        type="range"
        min={1}
        max={50_000}
        value={amountSats}
        onChange={(e) => setAmountSats(Number(e.target.value))}
      />

      <div className="viz-readout">
        {routes.map((route, i) => {
          const path = ['A', ...route.hops.map((h) => h.to)].join(' → ');
          const share = dearest.totalFeeMsat > 0 ? route.totalFeeMsat / dearest.totalFeeMsat : 0;
          return (
            <div key={path} style={{ marginBottom: 10 }}>
              <div className="stat-label">
                {i === 0 ? '✓ chosen · ' : ''}
                {path} · {route.hops.length} hops · {route.totalCltvDelta} blocks of timelock
              </div>
              <svg viewBox="0 0 100 6" preserveAspectRatio="none" style={{ width: '100%', height: 16 }}>
                <rect x="0" y="1" width="100" height="4" rx="1" fill="var(--surface-2)" />
                <rect
                  x="0"
                  y="1"
                  width={Math.max(1, share * 100)}
                  height="4"
                  rx="1"
                  fill={i === 0 ? 'var(--brand)' : 'var(--baseline)'}
                />
              </svg>
              <span className="stat-unit">{fmtMsat(route.totalFeeMsat)} in fees</span>
            </div>
          );
        })}
      </div>

      <p className="utxo-box-note">
        {cheapest && dearest && cheapest !== dearest ? (
          <>
            Both routes are two hops, yet the dearest costs{' '}
            <strong>{(dearest.totalFeeMsat / Math.max(1, cheapest.totalFeeMsat)).toFixed(1)}×</strong>{' '}
            the cheapest, because D advertised higher numbers than B. Distance decides nothing
            here; the advertised price decides everything. Note too that the cheaper route also
            asks for less timelock, which is a second reason wallets favour it.
          </>
        ) : (
          <>Only one route available at this amount.</>
        )}
      </p>
    </VizFigure>
  );
}
