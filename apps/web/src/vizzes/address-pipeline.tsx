import { useState } from 'react';
import { encodeSegwitAddress, hexToBytes } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

/**
 * The derivation pipeline, using the segwit spec's own example key — which
 * happens to be private key #1, so every byte below is the real, published
 * BIP-173 test vector. Only the last stage is a mystery to no one: our own
 * bech32 encoder computes it live.
 */
const PUBKEY_HEX = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const HASH160_HEX = '751e76e8199196d454941c45d1b3a323f1433bd6';
const ADDRESS = encodeSegwitAddress('bc', 0, [...hexToBytes(HASH160_HEX)]);

const STAGES = [
  {
    key: 'priv',
    title: '1 · private key',
    value: '1',
    note: 'the spec\'s example secret is literally the number one — the most famous "never use this" key in Bitcoin',
    oneWay: null,
  },
  {
    key: 'pub',
    title: '2 · public key',
    value: PUBKEY_HEX,
    note: 'derived by elliptic-curve multiplication (Quest #3) — for key 1, this is the curve\'s generator point itself',
    oneWay: 'elliptic curve — no way back',
  },
  {
    key: 'hash',
    title: '3 · key hash (the witness program)',
    value: HASH160_HEX,
    note: 'SHA-256, then RIPEMD-160: 33 bytes crushed to 20',
    oneWay: 'hashing — no way back',
  },
  {
    key: 'addr',
    title: '4 · the address',
    value: ADDRESS,
    note: 'version 0 + the 20 bytes, regrouped into 5-bit letters and checksummed — computed live by this page\'s bech32 encoder',
    oneWay: 'spelling — fully reversible, on purpose',
  },
] as const;

export function AddressPipeline() {
  const [stage, setStage] = useState(0);

  return (
    <VizFigure
      title="The derivation pipeline"
      caption="From a secret number to a bc1 address in three transformations — two of them strictly one-way."
    >
      <div className="pipeline">
        {STAGES.map((s, i) => (
          <div key={s.key} className="pipeline-item">
            {s.oneWay && (
              <div className={`pipeline-valve ${i <= stage ? 'pipeline-live' : ''}`}>
                <span className="pipeline-arrow">▼</span>
                <span className="pipeline-valve-label">{s.oneWay}</span>
              </div>
            )}
            <div className={`pipeline-stage ${i <= stage ? 'pipeline-live' : ''} ${i === stage ? 'pipeline-current' : ''}`}>
              <div className="pipeline-title">{s.title}</div>
              <code className="pipeline-value">{i <= stage ? s.value : '· · ·'}</code>
              {i <= stage && <div className="pipeline-note">{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="preset-row pipeline-controls">
        <button
          className="runbtn"
          onClick={() => setStage((s) => Math.min(STAGES.length - 1, s + 1))}
          disabled={stage === STAGES.length - 1}
        >
          {stage === STAGES.length - 1 ? '✓ address derived' : '▶ next transformation'}
        </button>
        {stage > 0 && (
          <button className="preset" onClick={() => setStage(0)}>
            start over
          </button>
        )}
      </div>
      <p className="viz-readout">
        {stage < STAGES.length - 1
          ? 'Every value here is the real, published example from BIP-173 (the segwit specification) — step through and watch a secret become something safe to say out loud.'
          : 'Notice the direction of every arrow: computing downward is instant; climbing back up is impossible at stages 2 and 3. That asymmetry is why an address is safe to publish, why wallets mint them offline and infinitely, and why the only secret that ever needs guarding is the number at the top.'}
      </p>
    </VizFigure>
  );
}
