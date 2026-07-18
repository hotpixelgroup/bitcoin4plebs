import { useEffect, useMemo, useState } from 'react';
import {
  estimateConfirmation,
  feerateBands,
  generateMempool,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import { usePrefersReducedMotion } from '../../lib/use-reduced-motion';
import type { RunnerProps } from '../registry';

const SEED = 42;
const MY_VSIZE = 140;
const BLOCK_VBYTES = 1_000_000;
const MAX_REPLAY = 8;

/**
 * The fee-auction runner: a deterministic model mempool, one slider, and
 * the real mechanism from miner.cpp: highest feerate first, ~1M vbytes
 * per block, one block every ten minutes. The replay mines those blocks
 * before your eyes so "waiting for confirmation" becomes "waiting for the
 * waterline to reach your bid."
 */
export function FeeAuction({ finale }: RunnerProps) {
  const [feerate, setFeerate] = useState(5);
  const [cleared, setCleared] = useState(0);
  const [playing, setPlaying] = useState(false);
  const pool = useMemo(() => generateMempool(SEED), []);
  const bands = useMemo(() => feerateBands(pool), [pool]);
  const estimate = estimateConfirmation(feerate, MY_VSIZE, SEED);
  const fee = feerate * MY_VSIZE;
  const maxBand = Math.max(...bands.map((b) => b.vbytes));
  const targetBlocks = estimate.timedOut ? MAX_REPLAY : Math.min(estimate.blocks, MAX_REPLAY);

  useEffect(() => {
    setCleared(0);
    setPlaying(false);
  }, [feerate]);

  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!playing) return;
    if (reducedMotion) {
      setCleared(targetBlocks);
      setPlaying(false);
      return;
    }
    const timer = setInterval(() => {
      setCleared((c) => {
        if (c + 1 >= targetBlocks) setPlaying(false);
        return Math.min(c + 1, targetBlocks);
      });
    }, 800);
    return () => clearInterval(timer);
  }, [playing, targetBlocks, reducedMotion]);

  // How much of each band survives after `cleared` blocks skim the top.
  const remaining = useMemo(() => {
    let budget = cleared * BLOCK_VBYTES;
    const out = new Map<number, number>();
    for (const band of [...bands].reverse()) {
      const take = Math.min(band.vbytes, budget);
      out.set(band.from, band.vbytes - take);
      budget -= take;
    }
    return out;
  }, [bands, cleared]);

  const confirmed = !estimate.timedOut && cleared >= estimate.blocks;

  return (
    <div className="cols">
      <div className="prose">
        <label className="height-input-label">
          Your bid: <strong>{feerate} sat/vB</strong> (a typical {MY_VSIZE}-vbyte payment ={' '}
          {fee.toLocaleString('en-US')} sats total fee)
          <input
            className="fee-slider"
            type="range"
            min={1}
            max={100}
            value={feerate}
            onChange={(e) => setFeerate(Number(e.target.value))}
          />
        </label>
        <button
          className="runbtn"
          onClick={() => {
            setCleared(0);
            setPlaying(true);
          }}
          disabled={playing}
        >
          {playing ? '⛏ mining…' : cleared > 0 ? '▶ replay the auction' : '▶ Watch the blocks clear the room'}
        </button>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
        <Callout>
          <strong>The auction's verdict:</strong>{' '}
          {estimate.timedOut ? (
            <>
              at {feerate} sat/vB your payment is <strong>still waiting after 20 blocks</strong>{' '}
              (~3+ hours), because everything above your bid keeps filling the blocks. In the real
              network you'd wait for a quiet moment, or bump your fee.
            </>
          ) : estimate.blocks === 1 ? (
            <>
              your bid beats the crowd: <strong>next block</strong>, roughly{' '}
              <strong>~{estimate.minutes} minutes</strong>. You outbid every full block's worth of
              waiting payments.
            </>
          ) : (
            <>
              your payment confirms in about <strong>block {estimate.blocks}</strong>, roughly{' '}
              <strong>~{estimate.minutes} minutes</strong>. Everything in the bands above your bid
              goes first; each block clears ~1M vbytes off the top.
            </>
          )}
        </Callout>
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">The waiting room, sorted by bid</div>
          <div className="viz-sub">
            vbytes waiting at each feerate · ▲ marks your bid · each mined block skims ~1 MvB off
            the top
          </div>
          <div className="band-chart">
            {[...bands].reverse().map((band) => {
              const mine = feerate >= band.from && feerate < band.to;
              const left = remaining.get(band.from) ?? band.vbytes;
              return (
                <div key={band.from} className={`band-row ${left === 0 ? 'band-cleared' : ''}`}>
                  <span className="band-label">
                    {band.from}–{band.to === 151 ? '150+' : band.to} sat/vB
                  </span>
                  <span className="band-bar-track">
                    <span
                      className={`band-bar ${mine ? 'band-bar-mine' : ''}`}
                      style={{ width: `${Math.max(left === 0 ? 0 : 2, (left / maxBand) * 100)}%` }}
                    />
                  </span>
                  <span className="band-value">
                    {left === 0 ? 'mined ✓' : `${(left / 1_000_000).toFixed(2)} MvB`}
                    {mine && <strong className="band-mine-marker"> ▲ you</strong>}
                  </span>
                </div>
              );
            })}
          </div>
          {cleared > 0 && (
            <div className={`auction-progress ${confirmed ? 'mine-won' : ''}`}>
              {confirmed
                ? `⛏ block ${cleared} mined after ~${cleared * 10} minutes. The waterline reached your bid. Confirmed. ✓`
                : `⛏ block ${cleared} mined (~${cleared * 10} min): ${(cleared * BLOCK_VBYTES / 1_000_000).toFixed(0)} MvB of better-paying traffic gone, yours still waiting…`}
            </div>
          )}
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">estimated confirmation</div>
              <div className="stat-value">
                {estimate.timedOut ? '20+ blocks' : `block ${estimate.blocks}`}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">estimated wait</div>
              <div className="stat-value">
                {estimate.timedOut ? '3+ hours' : `~${estimate.minutes} min`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
