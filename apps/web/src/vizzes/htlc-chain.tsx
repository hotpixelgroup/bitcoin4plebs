import { useState } from 'react';
import { VizFigure } from './viz-figure';

type State =
  'locked' | 'revealed' | 'settled' | 'failed' | 'timeout' | 'refunded';
/** A two-hop, single-part payment. No real funds, keys or on-chain signing. */
export function HtlcChain() {
  const [state, setState] = useState<State>('locked');
  const [height, setHeight] = useState(800_090);
  const [prediction, setPrediction] = useState('');
  const [liquidity, setLiquidity] = useState(200_000);
  const locked =
    state === 'locked' || state === 'revealed' || state === 'timeout';
  const reset = () => {
    setState('locked');
    setHeight(800_090);
    setPrediction('');
  };
  return (
    <VizFigure
      title="The chain of promises"
      caption="Predict, then step through success or failure. One hash, two channel promises, different deadlines."
    >
      <label htmlFor="htlc-liquidity">Hub outbound liquidity (sats)</label>
      <input
        id="htlc-liquidity"
        type="range"
        min="0"
        max="200000"
        step="10000"
        value={liquidity}
        disabled={state !== 'locked'}
        onChange={(e) => {
          setLiquidity(Number(e.target.value));
          setPrediction('');
        }}
      />
      <p>
        Available: {liquidity.toLocaleString('en-US')} sats. Needs: 180,000 sats
        to Ines.
      </p>
      <label htmlFor="htlc-predict">
        Predict: who learns the secret first?
      </label>{' '}
      <select
        id="htlc-predict"
        value={prediction}
        onChange={(e) => setPrediction(e.target.value)}
      >
        <option value="">Choose before revealing</option>
        <option value="recipient">Ines reveals it to the hub</option>
        <option value="payer">Mira reveals it first</option>
      </select>
      <ol aria-label="HTLC route">
        <li>Mira → hub: 180,180 sats, expiry height 800,140</li>
        <li>Hub → Ines: 180,000 sats, expiry height 800,100</li>
      </ol>
      <p role="status">
        Height {height.toLocaleString('en-US')} ·{' '}
        {state === 'locked'
          ? 'HTLCs pending; balances not settled'
          : state === 'revealed'
            ? 'Ines fulfilled the outgoing HTLC. Hub knows the preimage; incoming HTLC still pending.'
            : state === 'settled'
              ? 'Hub fulfilled incoming HTLC: Ines receives 180,000 sats; hub earns 180 sats.'
              : state === 'failed'
                ? 'Forward failed: insufficient outbound liquidity. No payment or forwarding fee earned.'
                : state === 'timeout'
                  ? 'Outgoing timeout recovery confirmed. Incoming HTLC remains pending until resolved separately.'
                  : 'Incoming timeout recovery also confirmed. No forwarding fee earned.'}
      </p>
      {state === 'locked' && (
        <button
          className="runbtn"
          disabled={!prediction || height >= 800_100}
          onClick={() => setState(liquidity < 180_000 ? 'failed' : 'revealed')}
        >
          Reveal the recipient outcome
        </button>
      )}{' '}
      {state === 'revealed' && (
        <button
          className="runbtn"
          disabled={height >= 800_140}
          onClick={() => setState('settled')}
        >
          Hub fulfills incoming HTLC with the same preimage
        </button>
      )}{' '}
      {locked && (
        <button className="preset" onClick={() => setHeight((h) => h + 10)}>
          Advance 10 illustrative blocks
        </button>
      )}{' '}
      {state === 'locked' && height >= 800_100 && (
        <button className="preset" onClick={() => setState('timeout')}>
          Confirm outgoing timeout recovery (simplified)
        </button>
      )}
      {state === 'timeout' && height >= 800_140 && (
        <button className="preset" onClick={() => setState('refunded')}>
          Confirm incoming timeout recovery
        </button>
      )}
      {state === 'revealed' && height >= 800_140 && (
        <p>
          The hub waited too long. Incoming timeout recovery may now race its
          claim. The safety margin was time to act, not an unconditional
          guarantee.
        </p>
      )}
      {state !== 'locked' && prediction && (
        <p>
          {prediction === 'recipient'
            ? 'Your prediction matches the success path.'
            : 'On the success path Ines reveals first; the hub uses what it learns to claim upstream.'}
        </p>
      )}
      <button className="preset" onClick={reset}>
        Reset route
      </button>
      <p className="finale-note">
        Educational model: deadlines are illustrative, not real-time clocks.
        Expiry enables a timeout spend; it does not move funds automatically or
        disable the preimage path. Real recovery can require force-close,
        multiple transactions, fees, and timely confirmation. Revoked
        commitments have penalty paths; dust HTLCs may be trimmed. A liquidity
        failure normally propagates off-chain. Safety depends on monitoring and
        adequate timelock margins. See the pinned BOLT #2, #3 and #5 sources in
        this quest.
      </p>
    </VizFigure>
  );
}
