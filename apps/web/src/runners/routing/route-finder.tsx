import { useState } from 'react';
import {
  BOLT7_EXAMPLE_GRAPH,
  findRoutes,
  hopFeeMsat,
  type ChannelPolicy,
} from '@bitcoin4plebs/lightning-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/** The exact sum BOLT #7 prints in its worked example. */
const SPEC_CHECK = {
  amountMsat: 4_999_999,
  base: 200,
  ppm: 2_000,
  expected: 10_199,
  line: '200 + ( 4999999 * 2000 / 1000000 ) = 10199',
};

const fmt = (m: number) => `${(m / 1000).toFixed(3)} sats`;

/**
 * The route finder: BOLT #7's own four-node network, with its own eight
 * channel_update values, costed by this site's own arithmetic. The second
 * act runs the sum the specification prints and refuses to claim anything
 * unless it matches to the millisatoshi.
 */
export function RouteFinder({ finale }: RunnerProps) {
  const [amountSats, setAmountSats] = useState(1_000);
  const [bBase, setBBase] = useState(200);
  const [bPpm, setBPpm] = useState(2_000);
  const [checked, setChecked] = useState<{ got: number; ok: boolean } | null>(null);

  // Same graph, with B's outgoing terms under the reader's control.
  const graph: ChannelPolicy[] = BOLT7_EXAMPLE_GRAPH.map((p) =>
    p.from === 'B' && p.to === 'C'
      ? { ...p, feeBaseMsat: bBase, feeProportionalMillionths: bPpm }
      : p
  );
  const routes = findRoutes(graph, 'A', 'C', amountSats * 1_000);
  const chosen = routes[0];

  const runSpecCheck = () => {
    const got = hopFeeMsat(
      {
        from: 'B',
        to: 'C',
        feeBaseMsat: SPEC_CHECK.base,
        feeProportionalMillionths: SPEC_CHECK.ppm,
        cltvExpiryDelta: 20,
      },
      SPEC_CHECK.amountMsat
    );
    setChecked({ got, ok: got === SPEC_CHECK.expected });
  };

  return (
    <div className="cols">
      <div className="prose">
        <p>
          Act one: <strong>be the network</strong>. This is the four-node graph BOLT #7 works
          through, with the eight <code>channel_update</code> values it prints. Change what B
          charges to forward towards C and watch the routing decision move.
        </p>
        <label className="height-input-label" htmlFor="rf-amount">
          A pays C <strong>{amountSats.toLocaleString('en-US')} sats</strong>
        </label>
        <input
          id="rf-amount"
          className="fee-slider"
          type="range"
          min={1}
          max={50_000}
          value={amountSats}
          onChange={(e) => setAmountSats(Number(e.target.value))}
        />
        <label className="height-input-label" htmlFor="rf-base">
          B→C <code>fee_base_msat</code>: <strong>{bBase.toLocaleString('en-US')}</strong>
        </label>
        <input
          id="rf-base"
          className="fee-slider"
          type="range"
          min={0}
          max={10_000}
          step={100}
          value={bBase}
          onChange={(e) => setBBase(Number(e.target.value))}
        />
        <label className="height-input-label" htmlFor="rf-ppm">
          B→C <code>fee_proportional_millionths</code>:{' '}
          <strong>{bPpm.toLocaleString('en-US')}</strong>
        </label>
        <input
          id="rf-ppm"
          className="fee-slider"
          type="range"
          min={0}
          max={10_000}
          step={100}
          value={bPpm}
          onChange={(e) => setBPpm(Number(e.target.value))}
        />
        {chosen && (
          <Callout>
            <strong>
              Cheapest route: {['A', ...chosen.hops.map((h) => h.to)].join(' → ')}, costing{' '}
              {fmt(chosen.totalFeeMsat)}.
            </strong>{' '}
            {bBase > 3_000 || bPpm > 4_000
              ? 'B has priced itself out — the payment now prefers D, who charges more per unit but asked for less overall. A node that overcharges does not earn more; it simply stops seeing traffic.'
              : 'B is the cheaper way through, so that is where the payment goes. Push B’s numbers up and watch the route abandon it.'}
          </Callout>
        )}

        <p>
          Act two: <strong>check our arithmetic against the specification's</strong>. BOLT #7
          does one sum in full and prints the answer. Ours must match it exactly, truncation
          included.
        </p>
        <button className="runbtn" onClick={runSpecCheck}>
          {checked ? '▶ Run the check again' : "▶ Run the specification's own sum"}
        </button>
        {checked?.ok && (
          <Callout>
            <strong>✓ {checked.got.toLocaleString('en-US')} msat — exactly what the spec prints.</strong>{' '}
            Note it is 10,199 and not 10,200: the division truncates, and getting that wrong would
            mean offering a fee the next hop rejects. The same check runs in CI, and CI also
            confirms this line is still in the pinned specification.
          </Callout>
        )}
        {checked && !checked.ok && (
          <Callout>
            <strong>✗ Mismatch: we computed {checked.got}, the spec says {SPEC_CHECK.expected}.</strong>{' '}
            If you are seeing this, the fee arithmetic on this site is wrong.
          </Callout>
        )}
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">Routes from A to C</div>
          <div className="viz-sub">network and terms per BOLT #7 §Worked Example</div>

          <div className="field-rows">
            {routes.map((route, i) => (
              <div className="field-row" key={route.hops.map((h) => h.to).join()}>
                <span className="field-label">
                  {i === 0 ? '✓ ' : '  '}
                  {['A', ...route.hops.map((h) => h.to)].join(' → ')}
                </span>
                <span className="field-hex">
                  {fmt(route.totalFeeMsat)}
                  <span className="field-src"> ← {route.totalCltvDelta} blocks timelock</span>
                </span>
              </div>
            ))}
          </div>

          {chosen && (
            <div className="guess-feed">
              <div className="stat-label">what each hop carries, and who keeps the difference</div>
              <div className="field-rows">
                {chosen.hops.map((hop) => (
                  <div className="field-row" key={`${hop.from}${hop.to}`}>
                    <span className="field-label">
                      {hop.from} → {hop.to}
                    </span>
                    <span className="field-hex">
                      carries {fmt(hop.amountMsat)}
                      <span className="field-src">
                        {' '}
                        ←{' '}
                        {hop.feeMsat === 0
                          ? `${hop.from} charges nothing — it is the sender, forwarding for no one`
                          : `${hop.from} keeps ${hop.feeMsat.toLocaleString('en-US')} msat`}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="guess-verdict">
                {chosen.hops.filter((h) => h.feeMsat > 0).length} fee
                {chosen.hops.filter((h) => h.feeMsat > 0).length === 1 ? '' : 's'} across{' '}
                {chosen.hops.length} channels — every forwarding node takes one, the sender and
                the payee take none. Nothing is sent to them: each simply keeps the gap between
                what arrives and what it passes on.
              </div>
              <div className="guess-verdict">
                A sends {fmt(chosen.totalSendMsat)} so that C receives{' '}
                {amountSats.toLocaleString('en-US')} sats — fees never come out of the invoice
              </div>
            </div>
          )}

          {checked && (
            <div className="guess-feed">
              <div className="stat-label">the specification's own line</div>
              <code className="guess-hex mine-target">{SPEC_CHECK.line}</code>
              <div className="stat-label">what this page computed</div>
              <code className={`guess-hex ${checked.ok ? 'mine-winner' : ''}`}>
                {SPEC_CHECK.base} + ( {SPEC_CHECK.amountMsat} × {SPEC_CHECK.ppm} ÷ 1000000 ) ={' '}
                {checked.got}
              </code>
              {checked.ok && <div className="guess-verdict mine-won">✓ identical</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
