import { useState } from 'react';
import {
  AGE_OF_UNIVERSE_YEARS,
  expectedYearsToCrack,
  formatBigApprox,
  SECP256K1_ORDER,
} from '@bitcoin4plebs/bitcoin-logic';
import { RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';
/** Scale calculator, not a live key search or benchmark. */
export function GuessTheKey({ finale }: RunnerProps) {
  const [exponent, setExponent] = useState(12);
  const rate = 10n ** BigInt(exponent);
  const years = expectedYearsToCrack(rate);
  return (
    <div className="viz-root">
      <div className="viz-title">Key-search scale calculator</div>
      <p>
        Assume a fixed target, a uniformly random valid private key, and a
        systematic search without repeating candidates. Valid keys are integers
        1 through n−1; zero is invalid. On average the search visits about half
        the space. This calculator generates and tests no keys and measures no
        device speed.
      </p>
      <label htmlFor="key-rate">
        Assumed candidates per second: 10^{exponent}
      </label>
      <input
        id="key-rate"
        type="range"
        min="0"
        max="18"
        value={exponent}
        onChange={(e) => setExponent(Number(e.target.value))}
      />
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">valid private keys</div>
          <div className="stat-value">
            {formatBigApprox(SECP256K1_ORDER - 1n)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">
            expected years under these assumptions
          </div>
          <div className="stat-value">{formatBigApprox(years)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">
            ages of the universe (≈13.8 billion years)
          </div>
          <div className="stat-value">
            {formatBigApprox(years / AGE_OF_UNIVERSE_YEARS)}
          </div>
        </div>
      </div>
      <p className="finale-note">
        Independent random sampling with repeats has a different expected count,
        about the entire space. Exposed-key discrete-log attacks target roughly
        128-bit classical security, not exhaustive 256-bit key guessing. Theft,
        nonce leakage and unsafe signing are separate risks. See BIP340. No real
        keys or funds.
      </p>
      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
