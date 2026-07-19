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
interface ToyTx {
  id: string;
  label: string;
  inputs: string[];
  outputs: Array<{ addr: string; sats: number; change?: boolean }>;
}

const CARELESS: ToyTx[] = [
  { id: 't1', label: 'a customer pays the shop', inputs: ['N1'], outputs: [{ addr: 'S1', sats: 20_000 }, { addr: 'N1c', sats: 7_350, change: true }] },
  { id: 't2', label: 'another customer pays', inputs: ['N2'], outputs: [{ addr: 'S2', sats: 35_000 }, { addr: 'N2c', sats: 2_180, change: true }] },
  { id: 't3', label: 'a third customer pays', inputs: ['N3'], outputs: [{ addr: 'S3', sats: 15_000 }, { addr: 'N3c', sats: 940, change: true }] },
  { id: 't4', label: 'the shop pays its supplier', inputs: ['S1', 'S2'], outputs: [{ addr: 'X1', sats: 50_000 }, { addr: 'C1', sats: 4_600, change: true }] },
  { id: 't5', label: 'a fourth customer pays', inputs: ['N4'], outputs: [{ addr: 'S4', sats: 25_000 }, { addr: 'N4c', sats: 11_020, change: true }] },
  { id: 't6', label: 'the shop pays rent', inputs: ['S3', 'C1'], outputs: [{ addr: 'X2', sats: 18_000 }, { addr: 'C2', sats: 1_450, change: true }] },
  { id: 't7', label: 'the shop pays the supplier again', inputs: ['S4', 'C2'], outputs: [{ addr: 'X1b', sats: 26_000 }, { addr: 'C3', sats: 320, change: true }] },
];

const DISCIPLINED: ToyTx[] = [
  { id: 't1', label: 'a customer pays the shop', inputs: ['N1'], outputs: [{ addr: 'S1', sats: 20_000 }, { addr: 'N1c', sats: 7_350, change: true }] },
  { id: 't2', label: 'another customer pays', inputs: ['N2'], outputs: [{ addr: 'S2', sats: 35_000 }, { addr: 'N2c', sats: 2_180, change: true }] },
  { id: 't3', label: 'a third customer pays', inputs: ['N3'], outputs: [{ addr: 'S3', sats: 15_000 }, { addr: 'N3c', sats: 940, change: true }] },
  { id: 't4', label: 'the shop pays its supplier (one coin, no merge)', inputs: ['S2'], outputs: [{ addr: 'X1', sats: 34_000 }, { addr: 'C1', sats: 780, change: true }] },
  { id: 't5', label: 'a fourth customer pays', inputs: ['N4'], outputs: [{ addr: 'S4', sats: 25_000 }, { addr: 'N4c', sats: 11_020, change: true }] },
  { id: 't6', label: 'the shop pays rent (one coin, no merge)', inputs: ['S1'], outputs: [{ addr: 'X2', sats: 18_000 }, { addr: 'C2', sats: 1_820, change: true }] },
];

const KNOWN = 'S1';
/** True shop addresses in the careless ledger (for scoring the player). */
const TRUTH_CARELESS = new Set(['S1', 'S2', 'S3', 'S4', 'C1', 'C2', 'C3']);

interface HeuristicStep {
  text: string;
  found: string[];
}

/**
 * The two real heuristics, run breadth-first from the known address:
 * common-input ownership (inputs spent together share an owner) and
 * fresh-change detection (the marked change output of a cluster spend
 * belongs to the cluster).
 */
function runHeuristics(ledger: ToyTx[]): { cluster: Set<string>; steps: HeuristicStep[] } {
  const cluster = new Set([KNOWN]);
  const steps: HeuristicStep[] = [
    { text: `Ground truth to start: ${KNOWN} is taped in the shop window.`, found: [KNOWN] },
  ];
  let grew = true;
  while (grew) {
    grew = false;
    for (const tx of ledger) {
      if (tx.inputs.some((a) => cluster.has(a))) {
        const newInputs = tx.inputs.filter((a) => !cluster.has(a));
        if (newInputs.length > 0) {
          newInputs.forEach((a) => cluster.add(a));
          steps.push({
            text: `${tx.id} spends ${tx.inputs.join(' + ')} together. One signer controls them all (common-input heuristic), so ${newInputs.join(', ')} joins the cluster.`,
            found: newInputs,
          });
          grew = true;
        }
        const change = tx.outputs.find((o) => o.change && !cluster.has(o.addr));
        if (change) {
          cluster.add(change.addr);
          steps.push({
            text: `${tx.id} is a cluster spend, and its ${change.sats.toLocaleString('en-US')}-sat output to never-seen ${change.addr} is a textbook change signature. ${change.addr} joins.`,
            found: [change.addr],
          });
          grew = true;
        }
      }
    }
  }
  return { cluster, steps };
}

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

  const truth = disciplined ? cluster : TRUTH_CARELESS;
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

      <p className="cd-brief">
        You know one fact: <code>{KNOWN}</code> belongs to the shop. Tap every other address you
        believe is the shop&apos;s too, then run the heuristics and compare.
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
              The heuristics found {cluster.size} address{cluster.size === 1 ? '' : 'es'}; you had
              tagged {hits} of them{misses > 0 ? ` (plus ${misses} that aren't the shop's)` : ''}.
            </strong>{' '}
            <RichText
              text={
                disciplined
                  ? 'With no co-spends to chain from, the cluster never grows past the one known address: the shop still received at S1 through S4, but the watcher cannot prove they share an owner. Same ledger transparency, radically less leakage. That is what spending discipline buys.'
                  : 'One receipt in a window plus two heuristics unmasked the whole shop: every receiving address AND every change hop. Now press "the disciplined shop" and watch the identical attack starve when the shop stops co-spending.'
              }
            />
          </Callout>
        </>
      )}

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
