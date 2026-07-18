import { useState } from 'react';
import { formatHeight } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

const MAX_HEIGHT = 960_000;

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
const TODAY = 938_343; // the reviewed checkpoint height from chainparams.cpp:142

/**
 * The rule-change timeline: sixteen years of chain, six rule changes.
 * Each one a tightening, each one adopted near-unanimously, each one
 * carved into chainparams.cpp at its exact block height.
 */
export function ActivationTimeline() {
  const [selected, setSelected] = useState(4); // SegWit, the famous one

  const x = (height: number) => 30 + (height / MAX_HEIGHT) * 580;
  const event = EVENTS[selected];

  return (
    <VizFigure
      title="The tree rings"
      caption="Every soft fork whose activation height chainparams.cpp records. Click the markers. Note the spacing."
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
          <line x1={x(TODAY)} y1={50} x2={x(TODAY)} y2={74} />
          <text x={x(TODAY)} y={94}>
            today-ish
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
        <p className="viz-readout">
          {event.detail} Like every marker here, it's a <em>soft fork</em> (a tightening old
          software tolerates), and it activated only after near-unanimous adoption. Six changes in
          seventeen years, none loosening the rules, each recorded in the file you read at this
          stop (P2SH, 2012, activated by timestamp instead, which is why it has no marker here). The gaps between markers aren't slowness; they're the price of
          "nobody can change the rules on you."
        </p>
      </div>
    </VizFigure>
  );
}
