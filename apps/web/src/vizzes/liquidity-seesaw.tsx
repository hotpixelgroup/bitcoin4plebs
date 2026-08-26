import { useState } from 'react';
import { VizFigure } from './viz-figure';

const CAPACITY = 500_000;
const RESERVE = 5_000; // 1% each side, a common default

/**
 * The seesaw: a channel's coins are always somewhere, and what you can
 * send is your end while what you can receive is theirs. Drag it and the
 * two numbers move in opposite directions, which is the whole of why a
 * freshly funded channel cannot receive a satoshi.
 */
export function LiquiditySeesaw() {
  const [mine, setMine] = useState(CAPACITY);

  const theirs = CAPACITY - mine;
  const canSend = Math.max(0, mine - RESERVE);
  const canReceive = Math.max(0, theirs - RESERVE);
  const pct = (mine / CAPACITY) * 100;
  const fmt = (n: number) => n.toLocaleString('en-US');

  return (
    <VizFigure
      title="The seesaw"
      caption="Drag the balance. What you can send and what you can receive always move in opposite directions."
    >
      <label className="height-input-label" htmlFor="seesaw">
        your side of a {fmt(CAPACITY)}-sat channel: <strong>{fmt(mine)} sats</strong>
      </label>
      <input
        id="seesaw"
        className="fee-slider"
        type="range"
        min={0}
        max={CAPACITY}
        step={5_000}
        value={mine}
        onChange={(e) => setMine(Number(e.target.value))}
      />

      <svg viewBox="0 0 100 10" preserveAspectRatio="none" style={{ width: '100%', height: 30 }} role="img" aria-label="Channel balance split between the two sides">
        <rect x="0" y="1" width="100" height="8" rx="1" fill="var(--surface-2)" />
        <rect x="0" y="1" width={pct} height="8" rx="1" fill="var(--brand)" />
        <rect x={(RESERVE / CAPACITY) * 100} y="1" width="0.6" height="8" fill="var(--bad)" />
        <rect x={100 - (RESERVE / CAPACITY) * 100} y="1" width="0.6" height="8" fill="var(--bad)" />
      </svg>

      <div className="viz-readout">
        <div className="stat">
          <div className="stat-value">
            {fmt(canSend)} <span className="stat-unit">sats you can send</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-value">
            {fmt(canReceive)} <span className="stat-unit">sats anyone can send you</span>
          </div>
        </div>
        <div className="stat-label">
          the two red marks are the reserve, {fmt(RESERVE)} sats each side must always leave the
          other, so nobody ever has nothing left to lose
        </div>
      </div>

      <p className="utxo-box-note">
        {mine === CAPACITY ? (
          <>
            <strong>This is a channel you just funded yourself.</strong> Every satoshi is on your
            side, so you can send freely and receive <strong>nothing</strong>, the most common
            surprise in Lightning, and it is not a bug. There is simply no room on their end yet.
          </>
        ) : mine === 0 ? (
          <>
            <strong>Fully spent.</strong> You can now receive the whole channel and send nothing.
            Notice the reserve still holds a little back on each side.
          </>
        ) : (
          <>
            A balanced channel is the useful one: {fmt(canSend)} out, {fmt(canReceive)} in. Nothing
            was created or destroyed, the coins simply moved along the seesaw.
          </>
        )}
      </p>
    </VizFigure>
  );
}
