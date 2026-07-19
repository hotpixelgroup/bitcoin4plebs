import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  eraForHeight,
  estimateDateForHeight,
  formatHeight,
  getBlockSubsidy,
  MAX_MONEY,
  nextHalvingHeight,
  satsToBtc,
  supplyThroughBlock,
} from '@bitcoin4plebs/bitcoin-logic';

/**
 * The network, today: ONE number (the chain tip height) is asked of a
 * public node, and everything else on the panel is derived from it in
 * the reader's own browser by the same arithmetic the quests verify.
 * Fees and the retarget estimate come from the same public node and are
 * labeled as its opinion. Quest #9 is how you need nobody at all.
 */

const API = 'https://mempool.space/api';
const IN_TEST = import.meta.env.MODE === 'test';

interface LiveData {
  height: number;
  fastestFee?: number;
  hourFee?: number;
  diffChangePct?: number;
  diffProgressPct?: number;
}

export function TodayPanel() {
  const [data, setData] = useState<LiveData | null>(null);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const heightRes = await fetch(`${API}/blocks/tip/height`);
      if (!heightRes.ok) throw new Error(String(heightRes.status));
      const height = Number(await heightRes.text());
      if (!Number.isFinite(height) || height <= 0) throw new Error('bad height');
      const next: LiveData = { height };
      try {
        const fees = (await (await fetch(`${API}/v1/fees/recommended`)).json()) as {
          fastestFee?: number;
          hourFee?: number;
        };
        next.fastestFee = fees.fastestFee;
        next.hourFee = fees.hourFee;
      } catch {
        // Fees are optional garnish.
      }
      try {
        const diff = (await (await fetch(`${API}/v1/difficulty-adjustment`)).json()) as {
          difficultyChange?: number;
          progressPercent?: number;
        };
        next.diffChangePct = diff.difficultyChange;
        next.diffProgressPct = diff.progressPercent;
      } catch {
        // Also optional.
      }
      setData(next);
      setState('done');
    } catch {
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (!IN_TEST) void load();
  }, [load]);

  if (IN_TEST) return null;

  if (state === 'error') {
    return (
      <section className="today today-error">
        <span>The public node isn't answering right now, so no live numbers today.</span>
        <button className="preset" onClick={() => void load()}>
          try again
        </button>
      </section>
    );
  }

  const height = data?.height;
  const subsidy = height !== undefined ? getBlockSubsidy(height) : null;
  const era = height !== undefined ? eraForHeight(height) : null;
  const nextH = height !== undefined ? nextHalvingHeight(height) : null;
  const blocksLeft = height !== undefined && nextH !== null ? nextH - height : null;
  const halvingYear = nextH !== null ? estimateDateForHeight(nextH).getUTCFullYear() : null;
  const supply = height !== undefined ? supplyThroughBlock(height) : null;
  const mintedPct = supply !== null ? Number((supply * 10_000n) / MAX_MONEY) / 100 : null;

  return (
    <section className="today" aria-label="The Bitcoin network today">
      <div className="today-head">
        <span className="today-live">
          <span className="today-pulse" aria-hidden="true" />
          the network, today
        </span>
        <button className="today-refresh" onClick={() => void load()} disabled={state === 'loading'}>
          {state === 'loading' ? 'asking…' : '↻ refresh'}
        </button>
      </div>
      <div className="today-grid">
        <Link to="/quests/run-your-own-node" className="today-tile">
          <span className="today-label">chain height</span>
          <span className="today-value">{height !== undefined ? formatHeight(height) : '·····'}</span>
          <span className="today-quest">their node's word · yours could check</span>
        </Link>
        <Link to="/quests/what-happens-at-a-halving" className="today-tile">
          <span className="today-label">block reward now</span>
          <span className="today-value">
            {subsidy !== null ? `${satsToBtc(subsidy)} BTC` : '·····'}
          </span>
          <span className="today-quest">era {era ?? '·'} of 33 · computed here</span>
        </Link>
        <Link to="/quests/what-happens-at-a-halving" className="today-tile">
          <span className="today-label">next halving</span>
          <span className="today-value">
            {blocksLeft !== null ? `${formatHeight(blocksLeft)} blocks` : '·····'}
          </span>
          <span className="today-quest">{halvingYear !== null ? `≈ ${halvingYear}` : '·'} · computed here</span>
        </Link>
        <Link to="/quests/verify-the-21-million-cap" className="today-tile">
          <span className="today-label">minted so far</span>
          <span className="today-value">
            {supply !== null ? `${satsToBtc(supply, 0)} BTC` : '·····'}
          </span>
          <span className="today-quest">
            {mintedPct !== null ? `${mintedPct.toFixed(1)}% of the cap` : '·'} · computed here
          </span>
        </Link>
        <Link to="/quests/who-keeps-bitcoin-usable" className="today-tile">
          <span className="today-label">fee to confirm fast</span>
          <span className="today-value">
            {data?.fastestFee !== undefined ? `${data.fastestFee} sat/vB` : '·····'}
          </span>
          <span className="today-quest">
            {data?.hourFee !== undefined ? `${data.hourFee} within the hour` : '·'} · their estimate
          </span>
        </Link>
        <Link to="/quests/how-does-mining-actually-work" className="today-tile">
          <span className="today-label">next retarget</span>
          <span className="today-value">
            {data?.diffChangePct !== undefined
              ? `${data.diffChangePct >= 0 ? '+' : ''}${data.diffChangePct.toFixed(1)}%`
              : '·····'}
          </span>
          <span className="today-quest">
            {data?.diffProgressPct !== undefined
              ? `${data.diffProgressPct.toFixed(0)}% through the epoch`
              : '·'}{' '}
            · their estimate
          </span>
        </Link>
      </div>
      <p className="today-note">
        One number above comes from someone else's node (mempool.space): the height. The reward,
        era, halving countdown, and minted total are computed from it <em>in your browser</em> by
        the same arithmetic you can verify in Quests #1 and #2. The fee and retarget figures are
        that node's estimates. Want to need nobody? That's{' '}
        <Link to="/quests/run-your-own-node">Quest #9</Link>.
      </p>
    </section>
  );
}
