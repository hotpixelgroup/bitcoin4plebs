import { useMemo, useState } from 'react';
import {
  computeEras,
  eraForHeight,
  estimateDateForHeight,
  estimateHeightAtTime,
  formatHeight,
  getBlockSubsidy,
  nextHalvingHeight,
  satsToBtc,
  supplyAtHeight,
  totalSupply,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

const ERAS = computeEras();
const TOTAL = totalSupply();
const LAST_SUBSIDY_HEIGHT = ERAS[ERAS.length - 1].endHeight;

/** The reward staircase: subsidy per block for the first eight eras. */
function Staircase({ height }: { height: number }) {
  const W = 800;
  const H = 220;
  const M = { t: 16, r: 16, b: 34, l: 54 };
  const SHOWN_ERAS = 8;
  const hmax = SHOWN_ERAS * 210_000;
  const x = (h: number) => M.l + (Math.min(h, hmax) / hmax) * (W - M.l - M.r);
  const y = (btc: number) => H - M.b - (btc / 50) * (H - M.t - M.b);

  const steps = ERAS.slice(0, SHOWN_ERAS).map((e) => ({
    x1: x(e.startHeight),
    x2: x(e.endHeight + 1),
    y: y(Number(e.subsidy) / 1e8),
  }));
  const inRange = height < hmax;
  const markerY = y(Number(getBlockSubsidy(Math.min(height, hmax - 1))) / 1e8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Block reward staircase by era">
      {[50, 25, 12.5].map((v) => (
        <g key={v}>
          <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="chart-grid" />
          <text x={M.l - 8} y={y(v) + 4} textAnchor="end" className="chart-tick">
            {v}
          </text>
        </g>
      ))}
      <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className="chart-baseline" />
      {steps.map((s, i) => (
        <g key={i}>
          <line x1={s.x1} x2={s.x2} y1={s.y} y2={s.y} className="chart-series" />
          {i < steps.length - 1 && (
            <line x1={s.x2} x2={s.x2} y1={s.y} y2={steps[i + 1].y} className="chart-step" />
          )}
        </g>
      ))}
      {[0, 2, 4, 6, 8].map((k) => (
        <text key={k} x={x(k * 210_000)} y={H - M.b + 16} textAnchor="middle" className="chart-tick">
          {k === 0 ? '0' : `${(k * 210_000) / 1_000_000}M`}
        </text>
      ))}
      <text x={(M.l + W - M.r) / 2} y={H - 2} textAnchor="middle" className="chart-axis-label">
        block height → (first {SHOWN_ERAS} eras shown; BTC per block on the left)
      </text>
      {inRange && <circle cx={x(height)} cy={markerY} r={5} className="chart-hover-dot" />}
    </svg>
  );
}

/**
 * The halving time machine: any height in, everything the code implies
 * about it out — era, reward, supply so far, estimated date.
 */
export function HalvingClock({ finale }: RunnerProps) {
  const estimatedNow = useMemo(() => estimateHeightAtTime(Date.now()), []);
  const [height, setHeight] = useState(estimatedNow);

  const presets: Array<{ label: string; h: number }> = [
    { label: 'Genesis', h: 0 },
    { label: 'First halving', h: 210_000 },
    { label: 'April 2024 halving', h: 840_000 },
    { label: '≈ Today', h: estimatedNow },
    { label: 'Next halving', h: nextHalvingHeight(estimatedNow) },
    { label: 'The last satoshi', h: LAST_SUBSIDY_HEIGHT },
  ];

  const clamped = Math.max(0, Math.min(height, 10_000_000));
  const era = eraForHeight(clamped);
  const subsidy = getBlockSubsidy(clamped);
  const supply = supplyAtHeight(clamped);
  const pct = Number((supply * 10_000n) / TOTAL) / 100;
  const date = estimateDateForHeight(clamped);
  const next = nextHalvingHeight(clamped);
  const isPast = clamped <= estimatedNow;

  return (
    <div className="cols">
      <div className="prose">
        <div className="preset-row">
          {presets.map((p) => (
            <button
              key={p.label}
              className={`preset ${clamped === p.h ? 'preset-active' : ''}`}
              onClick={() => setHeight(p.h)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="height-input-label">
          Or type any block height:
          <input
            className="height-input"
            type="number"
            min={0}
            max={10_000_000}
            value={clamped}
            onChange={(e) => setHeight(Number(e.target.value) || 0)}
          />
        </label>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
        <Callout>
          <strong>Reading for block {formatHeight(clamped)}:</strong> this block sits in{' '}
          <strong>era {Math.min(era, 34)}</strong>
          {subsidy > 0n ? (
            <>
              {' '}
              and mints <strong>{satsToBtc(subsidy)} BTC</strong> of new money. The next halving
              hits at block {formatHeight(next)} ({formatHeight(next - clamped)} blocks away).
            </>
          ) : (
            <>
              {' '}
              — past the final subsidy block. It mints <strong>zero</strong> new satoshis, and so
              does every block after it, forever. Miners live on fees alone.
            </>
          )}
        </Callout>
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">The halving clock</div>
          <div className="viz-sub">
            era · reward · supply · estimated date — computed from the code above
          </div>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">reward per block</div>
              <div className="stat-value">
                {satsToBtc(subsidy)} <span className="stat-unit">BTC</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">total supply by then</div>
              <div className="stat-value">
                {satsToBtc(supply, 4)} <span className="stat-unit">BTC</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">of all bitcoin, ever</div>
              <div className="stat-value">{pct.toFixed(2)}%</div>
            </div>
            <div className="stat">
              <div className="stat-label">{isPast ? 'approx. date (past)' : 'estimated date'}</div>
              <div className="stat-value stat-date">
                {date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
          <Staircase height={clamped} />
        </div>
      </div>
    </div>
  );
}
