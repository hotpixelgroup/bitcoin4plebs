import { HistoricOverflow } from '../labs/historic-overflow';
import { useState } from 'react';
import {
  checkTransaction,
  COIN,
  satsToBtc,
  type SimpleTx,
  type TxCheckResult,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, CodeCard, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

interface Sample {
  id: string;
  title: string;
  description: string;
  tx: SimpleTx;
}

const SAMPLES: Sample[] = [
  {
    id: 'honest',
    title: '① An honest payment',
    description: 'Spends two different coins, pays out 1.5 BTC total.',
    tx: {
      vin: [
        { txid: 'c0ffee…01', vout: 0 },
        { txid: 'facade…02', vout: 1 },
      ],
      vout: [{ value: 1n * COIN }, { value: COIN / 2n }],
    },
  },
  {
    id: 'cve-2018',
    title: '② The 2018 near-miss: spend the same coin twice',
    description: 'Both inputs point at the identical outpoint, which is the CVE-2018-17144 shape.',
    tx: {
      vin: [
        { txid: 'c0ffee…01', vout: 0 },
        { txid: 'c0ffee…01', vout: 0 },
      ],
      vout: [{ value: 2n * COIN }],
    },
  },
  {
    id: 'cve-2010',
    title: '③ Output-total ceiling example',
    description: 'Two 11,000,000-BTC outputs exceed the output-total ceiling. This illustrates a current bound, not the historical 2010 overflow transaction.',
    tx: {
      vin: [{ txid: 'c0ffee…01', vout: 0 }],
      vout: [{ value: 11_000_000n * COIN }, { value: 11_000_000n * COIN }],
    },
  },
];

function describeTx(tx: SimpleTx): string {
  const ins = tx.vin.map((i) => `${i.txid}:${i.vout}`).join(', ');
  const outs = tx.vout.map((o) => `${satsToBtc(o.value)} BTC`).join(' + ');
  return `spends [${ins}] → pays ${outs}`;
}

/**
 * The run-the-check runner: feeds an honest transaction and both historic
 * attacks through the CheckTransaction translation, live.
 */
export function RunTheCheck({ finale }: RunnerProps) {
  const [results, setResults] = useState<Record<string, TxCheckResult> | null>(null);

  return (
    <div className="cols">
      <div className="prose">
        {finale.translation && <CodeCard excerpt={finale.translation} />}
        <button
          className="runbtn"
          onClick={() =>
            setResults(Object.fromEntries(SAMPLES.map((s) => [s.id, checkTransaction(s.tx)])))
          }
        >
          ▶ Run CheckTransaction on all three
        </button>
        <HistoricOverflow />
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
        {results && (
          <Callout>
            <strong>What just happened:</strong> one simplified transaction passed the context-free checks; duplicate inputs and the output-total example failed. This does not check that inputs exist, signatures satisfy their scripts, or input value covers outputs. The 22-million example is not a reconstruction of the 2010 overflow exploit.
          </Callout>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">Three transactions walk into a node…</div>
          <div className="viz-sub">the same gauntlet every real transaction faces</div>
          <div className="tx-list">
            {SAMPLES.map((s) => {
              const r = results?.[s.id];
              return (
                <div key={s.id} className="tx-card">
                  <div className="tx-title">{s.title}</div>
                  <div className="tx-desc">{s.description}</div>
                  <code className="tx-data">{describeTx(s.tx)}</code>
                  <div
                    className={
                      r === undefined ? 'tx-verdict' : r.ok ? 'tx-verdict tx-ok' : 'tx-verdict tx-bad'
                    }
                  >
                    {r === undefined
                      ? 'awaiting check…'
                      : r.ok
                        ? '✓ context-free checks passed; full acceptance not tested'
                        : `✗ rejected: "${r.error}"`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
