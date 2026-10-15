import { useEffect, useRef, useState } from 'react';
import {
  doubleSha256Hex,
  hashMeetsTarget,
  leadingZeroBits,
  bitsToTarget,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';
import { headerHash, practiceHeader } from '../labs/serialized';

const DIFFICULTIES = [
  { label: 'Warm-up (8 zero bits)', bits: 8 },
  { label: 'Laptop (12 zero bits)', bits: 12 },
  { label: 'Serious (16 zero bits)', bits: 16 },
  { label: 'Painful (20 zero bits)', bits: 20 },
];

const BATCH = 500;

interface MiningState {
  status: 'idle' | 'mining' | 'found';
  nonce: number;
  attempts: number;
  bestZeroBits: number;
  lastHash: string | null;
  lastHeader: string | null;
  foundHash: string | null;
  startedAt: number | null;
}

const INITIAL: MiningState = {
  status: 'idle',
  nonce: 0,
  attempts: 0,
  bestZeroBits: 0,
  lastHash: null,
  lastHeader: null,
  foundHash: null,
  startedAt: null,
};

/**
 * The mine-a-block runner: genuine double SHA-256 over a serialized 80-byte practice header,
 * scanning nonces exactly the way block.h's comment describes.
 */
export function MineABlock({ finale }: RunnerProps) {
  const [payload, setPayload] = useState('pleb pays satoshi 1 BTC');
  const [zeroBits, setZeroBits] = useState(12);
  const [state, setState] = useState<MiningState>(INITIAL);
  const miningRef = useRef(false);

  const compact = (
    { 8: 0x2000ffff, 12: 0x1f0fffff, 16: 0x1f00ffff, 20: 0x1e0fffff } as Record<
      number,
      number
    >
  )[zeroBits];
  const target = bitsToTarget(compact);

  useEffect(() => {
    miningRef.current = state.status === 'mining';
    if (state.status !== 'mining') return;
    let cancelled = false;

    (async function mine() {
      let { nonce, attempts, bestZeroBits } = state;
      const merkle = await doubleSha256Hex(payload);
      while (!cancelled && miningRef.current) {
        let lastHash = '';
        let lastHeader = '';
        let found: { nonce: number; hash: string } | null = null;
        for (let i = 0; i < BATCH; i++) {
          const header = practiceHeader(merkle, nonce, compact);
          lastHeader = header;
          lastHash = await headerHash(header);
          attempts++;
          const zeros = leadingZeroBits(lastHash);
          if (zeros > bestZeroBits) bestZeroBits = zeros;
          if (hashMeetsTarget(lastHash, target)) {
            found = { nonce, hash: lastHash };
            break;
          }
          nonce++;
        }
        if (cancelled) return;
        const snapshot = {
          nonce,
          attempts,
          bestZeroBits,
          lastHash,
          lastHeader,
        };
        if (found) {
          const win = found;
          miningRef.current = false;
          setState((s) => ({
            ...s,
            status: 'found',
            nonce: win.nonce,
            attempts: snapshot.attempts,
            bestZeroBits: snapshot.bestZeroBits,
            lastHash: win.hash,
            lastHeader: snapshot.lastHeader,
            foundHash: win.hash,
          }));
          return;
        }
        setState((s) => ({ ...s, ...snapshot }));
        // Yield to the UI between batches.
        await new Promise((r) => setTimeout(r, 0));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only on status change
  }, [state.status]);

  const start = () =>
    setState({ ...INITIAL, status: 'mining', startedAt: Date.now() });
  const stop = () => {
    miningRef.current = false;
    setState((s) => ({ ...s, status: 'idle' }));
  };

  const elapsed = state.startedAt
    ? Math.max(0.001, (Date.now() - state.startedAt) / 1000)
    : 0;
  const rate =
    state.attempts && elapsed ? Math.round(state.attempts / elapsed) : 0;
  const targetHex = target.toString(16).padStart(64, '0');

  return (
    <div className="cols">
      <div className="prose">
        <label className="height-input-label">
          Practice leaf text (not a serialized transaction):
          <input
            className="height-input mine-payload"
            type="text"
            value={payload}
            disabled={state.status === 'mining'}
            onChange={(e) => {
              setPayload(e.target.value);
              setState(INITIAL);
            }}
          />
        </label>
        <label className="fork-label">
          Difficulty
          <select
            className="fork-select"
            value={zeroBits}
            disabled={state.status === 'mining'}
            onChange={(e) => {
              setZeroBits(Number(e.target.value));
              setState(INITIAL);
            }}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.bits} value={d.bits}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="runbtn"
          onClick={state.status === 'mining' ? stop : start}
        >
          {state.status === 'mining'
            ? '⏸ Stop scanning'
            : state.status === 'found'
              ? '▶ Mine another block'
              : '▶ Start scanning nonces'}
        </button>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
        {state.status === 'found' && state.foundHash && (
          <Callout>
            <strong>⛏ Block found!</strong> Nonce{' '}
            <strong>{state.nonce.toLocaleString('en-US')}</strong> produced a
            hash under your target after{' '}
            <strong>{state.attempts.toLocaleString('en-US')}</strong> attempts.
            Notice there was no cleverness: attempt{' '}
            {state.attempts.toLocaleString('en-US')} knew nothing attempt 1
            didn't. Now raise the difficulty one notch and feel the wall every
            miner lives against: each 4 extra zero bits ≈ 16× more guessing.
          </Callout>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">Your mining rig (this browser tab)</div>
          <div className="viz-sub">
            80-byte header · real double SHA-256 · display-order hash ≤ compact
            target (pow.cpp:167)
          </div>
          <p className="finale-note">
            Version / previous hash / Merkle root / time / nBits / nonce = 4 +
            32 + 32 + 4 + 4 + 4 bytes. Genesis layout is reused with zero
            previous hash and a fixed timestamp; practice nBits 0x
            {compact.toString(16)} is deliberately invalid for mainnet. Hash
            bytes are reversed for numeric comparison. Stop is available between
            bounded batches.
          </p>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">nonces scanned</div>
              <div className="stat-value">
                {state.attempts.toLocaleString('en-US')}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">hashes / second</div>
              <div className="stat-value">{rate.toLocaleString('en-US')}</div>
            </div>
            <div className="stat">
              <div className="stat-label">best run of zero bits so far</div>
              <div className="stat-value">{state.bestZeroBits}</div>
            </div>
            <div className="stat">
              <div className="stat-label">needed to win</div>
              <div className="stat-value">{zeroBits}</div>
            </div>
          </div>
          <div className="guess-feed">
            <div className="stat-label">
              target (hash must be ≤ this number)
            </div>
            <code className="guess-hex mine-target">{targetHex}</code>
            <div className="stat-label">
              latest serialized header (80 bytes / 160 hex digits)
            </div>
            <code className="guess-hex">
              {state.lastHeader ?? 'Start scanning to inspect the exact bytes'}
            </code>
            <div className="stat-label">latest hash</div>
            <code
              className={`guess-hex ${state.status === 'found' ? 'mine-winner' : ''}`}
            >
              {state.lastHash ?? 'press ▶ to begin scanning'}
            </code>
            {state.status === 'found' && (
              <div className="guess-verdict mine-won">
                ✓ This serialized header meets the practice nBits target. The
                leaf is a text digest, not a valid transaction; these fields do
                not form a valid mainnet block. Bitcoin also validates expected
                difficulty, previous block, transactions and consensus rules.
                PoW alone does not make a block valid.
              </div>
            )}
            {state.status === 'mining' && state.lastHash && (
              <div className="guess-verdict">
                ✗ too big. Bump the nonce, hash again.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
