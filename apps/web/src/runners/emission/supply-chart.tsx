import { useCallback, useRef, useState, type MouseEvent } from 'react';
import {
  formatHeight,
  getBlockSubsidy,
  satsToBtc,
  supplyAtHeight,
  SUBSIDY_HALVING_INTERVAL,
  totalSupply,
  type Era,
} from '@bitcoin4plebs/bitcoin-logic';

const W = 800;
const H = 340;
const M = { t: 26, r: 16, b: 40, l: 62 } as const;
const X0 = M.l;
const X1 = W - M.r;
const Y0 = H - M.b;
const Y1 = M.t;
const HMAX = 7_000_000; // block height axis
const VMAX = 22_000_000; // BTC axis

const x = (height: number) => X0 + (height / HMAX) * (X1 - X0);
const y = (btc: number) => Y0 - (btc / VMAX) * (Y0 - Y1);

const TOTAL = totalSupply();

/** Roughly the present day: the reviewed checkpoint height from chainparams.cpp:142. */
const TODAY = 938_343;
const HALVINGS = [1, 2, 3, 4].map((k) => k * SUBSIDY_HALVING_INTERVAL);

interface Hover {
  height: number;
  px: number;
  py: number;
  clientX: number;
  clientY: number;
}

export interface SupplyChartProps {
  eras: Era[];
  /** Number of eras currently revealed by the animation. */
  revealed: number;
  done: boolean;
}

/**
 * The supply curve, drawn from era boundary points. Cumulative supply is
 * exactly piecewise-linear between halvings, so this polyline is not an
 * approximation: every vertex and every hover value is exact math.
 */
export function SupplyChart({ eras, revealed, done }: SupplyChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const points = [[x(0), y(0)] as const].concat(
    eras.slice(0, revealed).map((e) => [x(e.endHeight + 1), y(Number(e.cumulative) / 1e8)] as const)
  );
  const last = points[points.length - 1];

  const onMouseMove = useCallback(
    (ev: MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !done) return;
      const rect = svg.getBoundingClientRect();
      const mx = ((ev.clientX - rect.left) / rect.width) * W;
      if (mx < X0 || mx > X1) {
        setHover(null);
        return;
      }
      const height = Math.round(((mx - X0) / (X1 - X0)) * HMAX);
      const cumulative = supplyAtHeight(height, eras);
      setHover({
        height,
        px: mx,
        py: y(Number(cumulative) / 1e8),
        clientX: ev.clientX - rect.left,
        clientY: ev.clientY - rect.top,
      });
    },
    [done, eras]
  );

  const hoverSupply = hover ? supplyAtHeight(hover.height, eras) : 0n;
  const hoverEra = hover ? Math.min(Math.floor(hover.height / SUBSIDY_HALVING_INTERVAL) + 1, 34) : 0;

  return (
    <div className="chartwrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Cumulative bitcoin supply approaching but never reaching 21 million"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines + y labels */}
        {[7_000_000, 14_000_000, 21_000_000].map((v) => (
          <g key={v}>
            {v !== 21_000_000 && (
              <line x1={X0} x2={X1} y1={y(v)} y2={y(v)} className="chart-grid" />
            )}
            <text x={X0 - 8} y={y(v) + 4} textAnchor="end" className="chart-tick">
              {v / 1_000_000}M
            </text>
          </g>
        ))}
        {/* baseline + x ticks */}
        <line x1={X0} x2={X1} y1={Y0} y2={Y0} className="chart-baseline" />
        {Array.from({ length: 8 }, (_, i) => i * 1_000_000).map((h) => (
          <text key={h} x={x(h)} y={Y0 + 18} textAnchor="middle" className="chart-tick">
            {h === 0 ? '0' : `${h / 1_000_000}M`}
          </text>
        ))}
        <text x={(X0 + X1) / 2} y={H - 4} textAnchor="middle" className="chart-axis-label">
          block height →
        </text>
        {/* MAX_MONEY cap line */}
        <line
          x1={X0}
          x2={X1}
          y1={y(21_000_000)}
          y2={y(21_000_000)}
          className="chart-cap"
        />
        <text x={X0 + 6} y={y(21_000_000) - 6} textAnchor="start" className="chart-tick">
          MAX_MONEY · 21,000,000
        </text>
        {/* halving markers + the reader's place in history */}
        {done &&
          HALVINGS.map((h) => (
            <g key={h} className="chart-halving">
              <line x1={x(h)} x2={x(h)} y1={Y0 - 8} y2={Y0} />
              <text x={x(h)} y={Y0 - 12} textAnchor="middle">
                ½
              </text>
            </g>
          ))}
        {done && (
          <g className="chart-today">
            <line
              x1={x(TODAY)}
              x2={x(TODAY)}
              y1={y(Number(supplyAtHeight(TODAY, eras)) / 1e8)}
              y2={Y0}
            />
            <circle cx={x(TODAY)} cy={y(Number(supplyAtHeight(TODAY, eras)) / 1e8)} r={4} />
            <text x={x(TODAY)} y={y(Number(supplyAtHeight(TODAY, eras)) / 1e8) - 10} textAnchor="middle">
              you are here (95% already minted)
            </text>
          </g>
        )}
        {/* the supply curve */}
        <polyline points={points.map((p) => p.join(',')).join(' ')} className="chart-series" />
        {revealed > 0 && <circle cx={last[0]} cy={last[1]} r={4} className="chart-dot" />}
        {done && (
          <text x={last[0] - 8} y={last[1] + 22} textAnchor="end" className="chart-end-label">
            {satsToBtc(TOTAL, 4)} BTC, and no more, ever
          </text>
        )}
        {/* crosshair */}
        {hover && (
          <g>
            <line x1={hover.px} x2={hover.px} y1={Y1} y2={Y0} className="chart-crosshair" />
            <circle cx={hover.px} cy={hover.py} r={4} className="chart-hover-dot" />
          </g>
        )}
      </svg>
      {hover && (
        <div
          className="chart-tip"
          style={{ left: Math.min(hover.clientX + 14, 560), top: hover.clientY - 10 }}
        >
          block <b>{formatHeight(hover.height)}</b> · era {hoverEra}
          <br />
          reward: <b>{satsToBtc(getBlockSubsidy(hover.height))} BTC</b>
          <br />
          total supply: <b>{satsToBtc(hoverSupply, 4)} BTC</b>
        </div>
      )}
    </div>
  );
}
