import { useState } from 'react';
import { VizFigure } from './viz-figure';

const VBYTES_PER_PAYMENT = 140;
const VBYTES_OPEN = 150;
const VBYTES_CLOSE = 170;

/**
 * The footprint figure: drag the number of coffees and watch the on-chain
 * cost of doing it the two ways diverge. The channel line is flat, that
 * flatness is the entire argument for a second layer.
 */
export function ChannelFootprint() {
  const [payments, setPayments] = useState(100);

  const onChain = payments * VBYTES_PER_PAYMENT;
  const inChannel = VBYTES_OPEN + VBYTES_CLOSE;
  const saved = onChain - inChannel;
  const ratio = onChain / inChannel;

  // Bars are drawn on a log-ish scale so 1 payment and 1,000 both read well.
  const width = (v: number) => Math.max(2, Math.min(100, (Math.log10(v) / Math.log10(200_000)) * 100));

  return (
    <VizFigure
      title="The footprint"
      caption="Drag the number of payments. One line grows with every coffee; the other never moves."
    >
      <label className="height-input-label" htmlFor="footprint-count">
        payments between the same two people: <strong>{payments.toLocaleString('en-US')}</strong>
      </label>
      <input
        id="footprint-count"
        className="fee-slider"
        type="range"
        min={1}
        max={1000}
        value={payments}
        onChange={(e) => setPayments(Number(e.target.value))}
      />

      <div className="viz-readout">
        <div className="stat-label">every payment on the chain</div>
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" style={{ width: '100%', height: 22 }}>
          <rect x="0" y="1" width="100" height="6" rx="1" fill="var(--surface-2)" />
          <rect x="0" y="1" width={width(onChain)} height="6" rx="1" fill="var(--bad)" />
        </svg>
        <div className="stat">
          <div className="stat-value">
            {onChain.toLocaleString('en-US')}{' '}
            <span className="stat-unit">vbytes of block space, bid for in the global auction</span>
          </div>
        </div>

        <div className="stat-label">the same payments in a channel</div>
        <svg viewBox="0 0 100 8" preserveAspectRatio="none" style={{ width: '100%', height: 22 }}>
          <rect x="0" y="1" width="100" height="6" rx="1" fill="var(--surface-2)" />
          <rect x="0" y="1" width={width(inChannel)} height="6" rx="1" fill="var(--brand)" />
        </svg>
        <div className="stat">
          <div className="stat-value">
            {inChannel}{' '}
            <span className="stat-unit">vbytes: one open, one close, whatever happens in between</span>
          </div>
        </div>
      </div>

      <p className="utxo-box-note">
        {payments === 1 ? (
          <>
            At one payment the channel is <strong>worse</strong>, two transactions instead of
            one. Channels are not free; they are amortised. Drag right.
          </>
        ) : (
          <>
            {saved.toLocaleString('en-US')} vbytes never written down, {' '}
            <strong>{ratio.toFixed(1)}×</strong> less block space, and the chain is still the
            thing enforcing every one of those {payments.toLocaleString('en-US')} payments.
          </>
        )}
      </p>
    </VizFigure>
  );
}
