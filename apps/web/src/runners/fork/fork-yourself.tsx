import { useState } from 'react';
import {
  COIN,
  computeEras,
  satsToBtc,
  SUBSIDY_HALVING_INTERVAL,
  totalSupply,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

const BITCOIN_TOTAL = totalSupply();

const INTERVAL_CHOICES = [
  { label: '210,000 blocks (Bitcoin)', value: 210_000 },
  { label: '100,000 blocks (impatient)', value: 100_000 },
  { label: '1,000,000 blocks (generous)', value: 1_000_000 },
];

const SUBSIDY_CHOICES = [
  { label: '50 BTC (Bitcoin)', value: 50n },
  { label: '100 BTC (double or nothing)', value: 100n },
  { label: '1,000 BTC (why not?)', value: 1_000n },
];

/**
 * The fork-yourself runner: change the consensus parameters, run the same
 * halving arithmetic, and discover what changing Bitcoin's code gets you.
 */
export function ForkYourself({ finale }: RunnerProps) {
  const [interval, setIntervalChoice] = useState(210_000);
  const [subsidy, setSubsidy] = useState(50n);
  const [ran, setRan] = useState(false);

  const isConsensus = interval === SUBSIDY_HALVING_INTERVAL && subsidy === 50n;
  const yourEras = computeEras({ halvingInterval: interval, initialSubsidy: subsidy * COIN });
  const yourTotal = yourEras[yourEras.length - 1].cumulative;

  return (
    <div className="cols">
      <div className="prose">
        <p>
          The source is open, so open it. Pick your own consensus parameters below. This is
          exactly what anyone on Earth can do to Bitcoin's code, right now, no permission needed.
        </p>
        <label className="fork-label">
          Halving interval
          <select
            className="fork-select"
            value={interval}
            onChange={(e) => {
              setIntervalChoice(Number(e.target.value));
              setRan(false);
            }}
          >
            {INTERVAL_CHOICES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="fork-label">
          Starting reward
          <select
            className="fork-select"
            value={subsidy.toString()}
            onChange={(e) => {
              setSubsidy(BigInt(e.target.value));
              setRan(false);
            }}
          >
            {SUBSIDY_CHOICES.map((c) => (
              <option key={c.value.toString()} value={c.value.toString()}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button className="runbtn" onClick={() => setRan(true)}>
          ▶ Run your chain's emission schedule
        </button>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">Your chain vs. Bitcoin</div>
          <div className="viz-sub">same ten lines of arithmetic: your parameters vs. everyone else's</div>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">your chain's total supply</div>
              <div className="stat-value">
                {ran ? satsToBtc(yourTotal, 4) : '—'} <span className="stat-unit">coins</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Bitcoin's total supply</div>
              <div className="stat-value">
                {satsToBtc(BITCOIN_TOTAL, 4)} <span className="stat-unit">BTC</span>
              </div>
            </div>
          </div>
          {ran &&
            (isConsensus ? (
              <Callout>
                <strong>✓ You're in consensus.</strong> You picked Bitcoin's own parameters, so
                your node computes the same 20,999,999.9769 BTC as everyone else's, and your
                blocks validate everywhere. This agreement, recomputed independently by every node on
                every block, <em>is</em> Bitcoin.
              </Callout>
            ) : (
              <Callout>
                <strong>⚠ Congratulations: you've forked yourself off the network.</strong> Your
                chain now promises {satsToBtc(yourTotal, 4)} coins, so the first block you produce
                under these rules is <strong>invalid to every Bitcoin node on Earth</strong>, because
                they check it against <em>their</em> arithmetic, not yours (remember{' '}
                <code>bad-cb-amount</code>). You didn't change Bitcoin. You left it. Changing the
                code was never the hard part; changing <em>everyone else's</em> code is.
              </Callout>
            ))}
        </div>
      </div>
    </div>
  );
}
