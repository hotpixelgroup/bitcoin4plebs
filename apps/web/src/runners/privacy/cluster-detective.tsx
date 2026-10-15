import { runHeuristics, type ToyTx } from './ownership-inference';
import { PrivacyLab } from '../labs/extended-labs';
import { useMemo, useState } from 'react';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/**
 * A fixed toy neighborhood ledger. The shop receives at fresh addresses
 * (S1..S4) like a good wallet, but spends carelessly: multiple inputs
 * per spend, so the common-input heuristic chains everything together,
 * and each spend's change (C1, C2) joins the cluster via the
 * fresh-change heuristic. In disciplined mode the shop never co-spends,
 * and the same heuristics starve.
 */
const CARELESS: ToyTx[] = [
  {
    id: 't1',
    label: 'a customer pays the shop',
    inputs: ['N1'],
    outputs: [
      { addr: 'S1', sats: 20_000 },
      { addr: 'N1c', sats: 7_350, change: true },
    ],
  },
  {
    id: 't2',
    label: 'another customer pays',
    inputs: ['N2'],
    outputs: [
      { addr: 'S2', sats: 35_000 },
      { addr: 'N2c', sats: 2_180, change: true },
    ],
  },
  {
    id: 't3',
    label: 'a third customer pays',
    inputs: ['N3'],
    outputs: [
      { addr: 'S3', sats: 15_000 },
      { addr: 'N3c', sats: 940, change: true },
    ],
  },
  {
    id: 't4',
    label: 'the shop pays its supplier',
    inputs: ['S1', 'S2'],
    outputs: [
      { addr: 'X1', sats: 50_000 },
      { addr: 'C1', sats: 4_600, change: true },
    ],
  },
  {
    id: 't5',
    label: 'a fourth customer pays',
    inputs: ['N4'],
    outputs: [
      { addr: 'S4', sats: 25_000 },
      { addr: 'N4c', sats: 11_020, change: true },
    ],
  },
  {
    id: 't6',
    label: 'the shop pays rent',
    inputs: ['S3', 'C1'],
    outputs: [
      { addr: 'X2', sats: 18_000 },
      { addr: 'C2', sats: 1_450, change: true },
    ],
  },
  {
    id: 't7',
    label: 'the shop pays the supplier again',
    inputs: ['S4', 'C2'],
    outputs: [
      { addr: 'X1b', sats: 320 },
      { addr: 'C3', sats: 26_000, change: true },
    ],
  },
];

const DISCIPLINED: ToyTx[] = [
  {
    id: 't1',
    label: 'a customer pays the shop',
    inputs: ['N1'],
    outputs: [
      { addr: 'S1', sats: 20_000 },
      { addr: 'N1c', sats: 7_350, change: true },
    ],
  },
  {
    id: 't2',
    label: 'another customer pays',
    inputs: ['N2'],
    outputs: [
      { addr: 'S2', sats: 35_000 },
      { addr: 'N2c', sats: 2_180, change: true },
    ],
  },
  {
    id: 't3',
    label: 'a third customer pays',
    inputs: ['N3'],
    outputs: [
      { addr: 'S3', sats: 15_000 },
      { addr: 'N3c', sats: 940, change: true },
    ],
  },
  {
    id: 't4',
    label: 'the shop pays its supplier (one coin, no merge)',
    inputs: ['S2'],
    outputs: [
      { addr: 'X1', sats: 34_000 },
      { addr: 'C1', sats: 780, change: true },
    ],
  },
  {
    id: 't5',
    label: 'a fourth customer pays',
    inputs: ['N4'],
    outputs: [
      { addr: 'S4', sats: 25_000 },
      { addr: 'N4c', sats: 11_020, change: true },
    ],
  },
  {
    id: 't6',
    label: 'the shop pays rent (one coin, no merge)',
    inputs: ['S1'],
    outputs: [
      { addr: 'X2', sats: 18_000 },
      { addr: 'C2', sats: 1_820, change: true },
    ],
  },
];

const KNOWN = 'S1';
/** True shop addresses in the careless ledger (for scoring the player). */
const TRUTH_CARELESS = new Set(['S1', 'S2', 'S3', 'S4', 'C1', 'C2', 'C3']);

export function ClusterDetective({ finale }: RunnerProps) {
  const [disciplined, setDisciplined] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set([KNOWN]));
  const [revealed, setRevealed] = useState(false);

  const ledger = disciplined ? DISCIPLINED : CARELESS;
  const { cluster, steps } = useMemo(() => runHeuristics(ledger), [ledger]);

  const toggle = (addr: string) => {
    if (revealed || addr === KNOWN) return;
    const next = new Set(picked);
    if (next.has(addr)) next.delete(addr);
    else next.add(addr);
    setPicked(next);
  };

  const truth = disciplined
    ? new Set(['S1', 'S2', 'S3', 'S4', 'C1', 'C2'])
    : TRUTH_CARELESS;
  const hits = [...picked].filter((a) => truth.has(a)).length;
  const misses = [...picked].filter((a) => !truth.has(a)).length;

  return (
    <div className="cd">
      <div className="stress-chips">
        <button
          className={`preset ${!disciplined ? 'preset-active' : ''}`}
          aria-pressed={!disciplined}
          onClick={() => {
            setDisciplined(false);
            setRevealed(false);
            setPicked(new Set([KNOWN]));
          }}
        >
          the careless shop
        </button>
        <button
          className={`preset ${disciplined ? 'preset-active' : ''}`}
          aria-pressed={disciplined}
          onClick={() => {
            setDisciplined(true);
            setRevealed(false);
            setPicked(new Set([KNOWN]));
          }}
        >
          the disciplined shop
        </button>
      </div>

      <p className="finale-note">
        Toy address graph, not a complete UTXO ledger. Inference uses co-spends
        and the public smaller-output assumption, never the private change
        labels. CoinJoin, PayJoin and ambiguous output amounts can produce false
        positives.
      </p>
      <p className="cd-brief">
        You know one fact: <code>{KNOWN}</code> belongs to the shop. Tap every
        other address you believe is the shop&apos;s too, then run the
        heuristics and compare.
      </p>

      <div className="cd-ledger">
        {ledger.map((tx) => (
          <div key={tx.id} className="cd-tx">
            <div className="cd-tx-label">
              <span className="cd-tx-id">{tx.id}</span> {tx.label}
            </div>
            <div className="cd-tx-row">
              <span className="cd-side">
                {tx.inputs.map((a) => (
                  <button
                    key={a}
                    className={`cd-addr ${picked.has(a) ? 'cd-addr-picked' : ''} ${revealed && cluster.has(a) ? 'cd-addr-cluster' : ''}`}
                    aria-pressed={picked.has(a)}
                    onClick={() => toggle(a)}
                  >
                    {a}
                  </button>
                ))}
              </span>
              <span className="cd-arrow" aria-hidden="true">
                →
              </span>
              <span className="cd-side">
                {tx.outputs.map((o) => (
                  <button
                    key={o.addr}
                    className={`cd-addr ${picked.has(o.addr) ? 'cd-addr-picked' : ''} ${revealed && cluster.has(o.addr) ? 'cd-addr-cluster' : ''}`}
                    aria-pressed={picked.has(o.addr)}
                    onClick={() => toggle(o.addr)}
                  >
                    {o.addr} · {o.sats.toLocaleString('en-US')}
                  </button>
                ))}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!revealed ? (
        <button className="runbtn" onClick={() => setRevealed(true)}>
          run the two heuristics
        </button>
      ) : (
        <>
          <ol className="stress-steps">
            {steps.map((step, i) => (
              <li key={i} className="stress-step">
                <p className="stress-step-body">{step.text}</p>
              </li>
            ))}
          </ol>
          <Callout>
            <strong>
              The heuristic hypothesized {cluster.size} address
              {cluster.size === 1 ? '' : 'es'}; you had correctly tagged {hits}{' '}
              true shop addresses
              {misses > 0 ? ` (plus ${misses} that aren't the shop's)` : ''}.
            </strong>{' '}
            <RichText
              text={
                disciplined
                  ? 'No co-spends connect the receiving addresses. The smaller-output guess can still link S1 to C2, but does not identify all shop addresses. These are hypotheses, not ownership proofs.'
                  : 'The common-input hypothesis links several addresses, but the smaller-output guess fails at t7: X1b is a small payment, while C3 is the larger change output. Public amounts alone do not prove change ownership. The fixture truth is kept separate from the inference.'
              }
            />
          </Callout>
        </>
      )}

      <PrivacyLab />
      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
