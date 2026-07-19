import { useState } from 'react';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

interface PolicyPreset {
  id: string;
  label: string;
  /** -datacarriersize in bytes; null means -datacarrier=0 (relay none). */
  maxDataBytes: number | null;
  blurb: string;
}

/** The three relay policies people actually argue about. */
const PRESETS: PolicyPreset[] = [
  {
    id: 'v30',
    label: 'Core v30 default · 100,000 vbytes',
    maxDataBytes: 100_000,
    blurb: 'The open valve: any standard-sized OP_RETURN relays. Prunable data beats UTXO poison.',
  },
  {
    id: 'classic',
    label: 'classic default · 83 bytes',
    maxDataBytes: 83,
    blurb: 'The old compromise: room for a hash or a timestamp, nothing more.',
  },
  {
    id: 'strict',
    label: 'Knots-style strict · relay none',
    maxDataBytes: null,
    blurb: 'The protest setting: your node carries payments, not billboards.',
  },
];

interface SampleTx {
  id: string;
  label: string;
  detail: string;
  /** OP_RETURN scriptPubKey size in bytes; 0 = plain payment, no data. */
  dataScriptBytes: number;
  feerate: number;
}

const SAMPLES: SampleTx[] = [
  {
    id: 'payment',
    label: 'a plain payment',
    detail: 'Ana pays Bo · no data · 140 vB',
    dataScriptBytes: 0,
    feerate: 3,
  },
  {
    id: 'timestamp',
    label: 'a document timestamp',
    detail: '32-byte hash in an 83-byte OP_RETURN script',
    dataScriptBytes: 83,
    feerate: 2,
  },
  {
    id: 'inscription',
    label: 'a 5 kB token mint',
    detail: '5,000-byte OP_RETURN payload · pays well',
    dataScriptBytes: 5_000,
    feerate: 25,
  },
  {
    id: 'blob',
    label: 'a 90 kB image blob',
    detail: '90,000-byte OP_RETURN script · pays very well',
    dataScriptBytes: 90_000,
    feerate: 40,
  },
];

/**
 * Mirrors the IsStandardTx datacarrier gate the reader just read
 * (policy.cpp:137-156): no budget means no data outputs relayed; otherwise
 * the script must fit within the budget.
 */
function relays(tx: SampleTx, policy: PolicyPreset): boolean {
  if (tx.dataScriptBytes === 0) return true;
  if (policy.maxDataBytes === null) return false;
  return tx.dataScriptBytes <= policy.maxDataBytes;
}

/**
 * The policy-picker runner: choose your node's relay policy, see what your
 * mempool carries, then watch consensus not care. The lesson is the gap
 * between the two columns.
 */
export function PolicyPicker({ finale }: RunnerProps) {
  const [presetId, setPresetId] = useState('classic');
  const [blockArrived, setBlockArrived] = useState(false);
  const policy = PRESETS.find((p) => p.id === presetId) as PolicyPreset;
  const relayedCount = SAMPLES.filter((tx) => relays(tx, policy)).length;

  return (
    <div className="pp">
      <div className="stress-chips" role="group" aria-label="Pick your relay policy">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={`preset ${p.id === presetId ? 'preset-active' : ''}`}
            aria-pressed={p.id === presetId}
            onClick={() => {
              setPresetId(p.id);
              setBlockArrived(false);
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="pp-blurb">{policy.blurb}</p>

      <div className="pp-table" role="table" aria-label="Four transactions vs your policy and consensus">
        <div className="pp-row pp-head" role="row">
          <span role="columnheader">transaction</span>
          <span role="columnheader">your relay verdict</span>
          <span role="columnheader">in the arriving block?</span>
        </div>
        {SAMPLES.map((tx) => {
          const relayed = relays(tx, policy);
          return (
            <div className="pp-row" role="row" key={tx.id}>
              <span role="cell">
                <strong>{tx.label}</strong>
                <span className="pp-detail">
                  {tx.detail} · {tx.feerate} sat/vB
                </span>
              </span>
              <span role="cell" className={relayed ? 'pp-yes' : 'pp-no'}>
                {relayed ? 'relay' : 'refuse (reason: "datacarrier")'}
              </span>
              <span role="cell" className={blockArrived ? 'pp-yes' : 'pp-pending'}>
                {blockArrived ? 'confirmed · your node accepts' : '…'}
              </span>
            </div>
          );
        })}
      </div>

      {!blockArrived ? (
        <button className="runbtn" onClick={() => setBlockArrived(true)}>
          a block arrives (mined from a pool that took direct submissions)
        </button>
      ) : (
        <Callout>
          <strong>
            Your policy relayed {relayedCount} of 4. Consensus confirmed 4 of 4, and your node
            accepted the block without complaint.
          </strong>{' '}
          <RichText text="Your filter shaped your bandwidth and your queue; the chain never asked your opinion. Policy is a personal statement. Consensus is the law. Anyone who wants the law changed has to walk the road in [Quest #13, stop 4](/quests/the-data-wars): a soft fork the economy chooses to enforce." />
        </Callout>
      )}

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
