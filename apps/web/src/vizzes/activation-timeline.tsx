import { useState } from 'react';
import { formatHeight } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

/** The fourth halving: block 840,000, mined 2024-04-20 00:09 UTC. */
const HALVING_4_HEIGHT = 840_000;
const HALVING_4_TIME_MS = Date.UTC(2024, 3, 20, 0, 9);

/**
 * Rough tip height for a date: blocks since the fourth halving at the
 * ten-minute target. Real blocks drift a little faster or slower, which
 * is why the marker says "est."; the axis only needs to stay ahead of it.
 */
function estimateTipHeight(nowMs: number = Date.now()): number {
  const minutes = Math.max(0, (nowMs - HALVING_4_TIME_MS) / 60_000);
  return HALVING_4_HEIGHT + Math.floor(minutes / 10);
}

/** Axis end: the estimated tip plus headroom, rounded up, never below 960,000. */
function timelineMaxHeight(tip: number): number {
  return Math.max(960_000, Math.ceil((tip + 20_000) / 20_000) * 20_000);
}

/** The soft forks carved into chainparams.cpp, plus context. */
const EVENTS = [
  {
    height: 227_931,
    year: '2013',
    name: 'BIP34',
    detail: 'Block heights required in coinbases: the first activation height recorded in chainparams.cpp.',
    cite: 'chainparams.cpp:119',
  },
  {
    height: 363_725,
    year: '2015',
    name: 'BIP66',
    detail: 'Strict signature encoding, which closed a whole family of malleability tricks.',
    cite: 'chainparams.cpp:122',
  },
  {
    height: 388_381,
    year: '2015',
    name: 'BIP65',
    detail: 'CheckLockTimeVerify: coins that provably cannot move until a chosen time.',
    cite: 'chainparams.cpp:121',
  },
  {
    height: 419_328,
    year: '2016',
    name: 'CSV',
    detail: 'Relative timelocks, the building block that later made Lightning channels possible.',
    cite: 'chainparams.cpp:123',
  },
  {
    height: 481_824,
    year: '2017',
    name: 'SegWit',
    detail: 'Witness data separated and bc1 addresses born, after two years of the loudest argument in Bitcoin history.',
    cite: 'chainparams.cpp:124',
  },
  {
    height: 709_632,
    year: '2021',
    name: 'Taproot',
    detail: 'Schnorr signatures and witness v1 (bc1p): the most recent rule change as of the pinned commit. The file records 711,648, which is this activation height plus one 2,016-block confirmation window.',
    cite: 'chainparams.cpp:125',
  },
];

const HALVINGS = [210_000, 420_000, 630_000, 840_000];

/**
 * The rule-change timeline: six rule changes since 2013.
 * Each one a tightening, each one adopted near-unanimously (history, not
 * a rule: a soft fork without majority hashpower splits), each one
 * carved into chainparams.cpp at its exact block height.
 */
export function ActivationTimeline() {
  const [selected, setSelected] = useState(4); // SegWit, the famous one

  const today = estimateTipHeight();
  const maxHeight = timelineMaxHeight(today);
  const x = (height: number) => 30 + (height / maxHeight) * 580;
  const event = EVENTS[selected];

  return (
    <VizFigure
      title="The tree rings"
      caption="Every soft fork activated by block height, as chainparams.cpp records it (Taproot via its warning height). Click the markers. Note the spacing."
      interactive={false}
    >
      <svg className="timeline-svg" viewBox="0 0 640 110" role="img" aria-label="Soft fork activation timeline">
        <line x1={30} y1={62} x2={610} y2={62} className="timeline-axis" />
        {HALVINGS.map((h) => (
          <g key={h} className="timeline-halving">
            <line x1={x(h)} y1={56} x2={x(h)} y2={68} />
            <text x={x(h)} y={84}>
              ½
            </text>
          </g>
        ))}
        {EVENTS.map((e, i) => (
          <g
            key={e.name}
            className={`timeline-event ${i === selected ? 'timeline-selected' : ''}`}
            onClick={() => setSelected(i)}
          >
            <line x1={x(e.height)} y1={40} x2={x(e.height)} y2={62} />
            <circle cx={x(e.height)} cy={36} r={7} />
            <text x={x(e.height)} y={24} className="timeline-name">
              {e.name}
            </text>
          </g>
        ))}
        <g className="timeline-today">
          <line x1={x(today)} y1={50} x2={x(today)} y2={74} />
          <text x={x(today)} y={94}>
            today (est.)
          </text>
        </g>
        <text x={30} y={84} className="timeline-tick">
          block 0 · 2009
        </text>
      </svg>
      <div className="timeline-detail">
        <div className="timeline-detail-head">
          <strong>{event.name}</strong> · {event.year} · block {formatHeight(event.height)}
          <span className="glossary-cite">{event.cite}</span>
        </div>
        <p className="viz-readout" role="status">
          {event.detail} Like every marker here, it's a <em>soft fork</em> (a tightening old
          software tolerates), and it activated only after near-unanimous adoption. That was history,
          not a guarantee: a soft fork stays one chain only if most hashpower enforces it, and BIP110,
          pushed through without that in August 2026, split off on its own. Six changes since
          2013, none loosening the rules, each recorded in the file you read at this stop. (Earlier
          soft forks, such as P2SH in 2012, activated by timestamp instead, which is why they have
          no marker here.) The gaps between markers aren't slowness; they're the price of
          "nobody can change the rules on you."
        </p>
      </div>
    </VizFigure>
  );
}
