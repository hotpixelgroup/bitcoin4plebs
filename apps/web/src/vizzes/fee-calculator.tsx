import { useState } from 'react';
import { hopFeeMsat } from '@bitcoin4plebs/lightning-logic';
import { VizFigure } from './viz-figure';

const PRESETS = [
  { label: 'a typical routing node', base: 1_000, ppm: 100 },
  { label: 'the spec’s example (B→C)', base: 200, ppm: 2_000 },
  { label: 'wants your traffic', base: 0, ppm: 0 },
  { label: 'priced itself out', base: 50_000, ppm: 5_000 },
];

const fmt = (msat: number) =>
  msat % 1000 === 0
    ? `${(msat / 1000).toLocaleString('en-US')} sats`
    : `${(msat / 1000).toFixed(3)} sats`;

/**
 * The fee calculator: two numbers a node picks for itself, put through
 * the one formula the specification fixes. Change either and watch what
 * a forward costs — including the truncation that makes the spec's own
 * example land on 10,199 rather than 10,200.
 */
export function FeeCalculator() {
  const [base, setBase] = useState(200);
  const [ppm, setPpm] = useState(2_000);
  const [amountSats, setAmountSats] = useState(5_000);

  const amountMsat = amountSats * 1_000;
  const policy = {
    from: 'B',
    to: 'C',
    feeBaseMsat: base,
    feeProportionalMillionths: ppm,
    cltvExpiryDelta: 20,
  };
  const fee = hopFeeMsat(policy, amountMsat);
  const exact = base + (amountMsat * ppm) / 1_000_000;
  const truncated = exact !== fee;
  const pct = amountMsat > 0 ? (fee / amountMsat) * 100 : 0;

  return (
    <VizFigure
      title="What one hop charges"
      caption="Two numbers the node picked for itself, in the one formula the specification fixes."
    >
      <div className="paths-chips" role="group" aria-label="Example fee policies">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`preset ${base === p.base && ppm === p.ppm ? 'preset-active' : ''}`}
            onClick={() => {
              setBase(p.base);
              setPpm(p.ppm);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="height-input-label" htmlFor="fee-base">
        <code>fee_base_msat</code>: <strong>{base.toLocaleString('en-US')}</strong> — flat, every
        forward
      </label>
      <input
        id="fee-base"
        className="fee-slider"
        type="range"
        min={0}
        max={5_000}
        step={100}
        value={Math.min(base, 5_000)}
        onChange={(e) => setBase(Number(e.target.value))}
      />

      <label className="height-input-label" htmlFor="fee-ppm">
        <code>fee_proportional_millionths</code>: <strong>{ppm.toLocaleString('en-US')}</strong> —{' '}
        {(ppm / 10_000).toFixed(4)}% of the amount
      </label>
      <input
        id="fee-ppm"
        className="fee-slider"
        type="range"
        min={0}
        max={5_000}
        step={100}
        value={Math.min(ppm, 5_000)}
        onChange={(e) => setPpm(Number(e.target.value))}
      />

      <label className="height-input-label" htmlFor="fee-amount">
        forwarding <strong>{amountSats.toLocaleString('en-US')} sats</strong>
      </label>
      <input
        id="fee-amount"
        className="fee-slider"
        type="range"
        min={1}
        max={100_000}
        step={1}
        value={amountSats}
        onChange={(e) => setAmountSats(Number(e.target.value))}
      />

      <div className="viz-readout">
        <div className="stat-label">
          {base.toLocaleString('en-US')} + ( {amountMsat.toLocaleString('en-US')} ×{' '}
          {ppm.toLocaleString('en-US')} ÷ 1,000,000 )
        </div>
        <div className="stat">
          <div className="stat-value">
            {fee.toLocaleString('en-US')} <span className="stat-unit">msat = {fmt(fee)}</span>
          </div>
        </div>
        <span className="stat-unit">
          {pct < 0.001 ? 'under a thousandth of a percent' : `${pct.toFixed(4)}% of the amount`}
        </span>
      </div>

      <p className="utxo-box-note">
        {truncated ? (
          <>
            The exact product is {exact.toLocaleString('en-US')} msat and the fee is{' '}
            <strong>{fee.toLocaleString('en-US')}</strong> — the division{' '}
            <strong>truncates</strong>. This is not pedantry: it is why the specification's own
            worked example comes to 10,199 and not 10,200, and an implementation that rounded up
            would offer a fee the next hop rejects.
          </>
        ) : (
          <>
            No remainder to lose here. Nudge the amount until the numbers stop dividing evenly and
            watch the fee truncate rather than round.
          </>
        )}
      </p>
    </VizFigure>
  );
}
