import { useEffect, useRef, useState } from 'react';
import {
  AGE_OF_UNIVERSE_YEARS,
  expectedYearsToCrack,
  formatBigApprox,
  SECP256K1_ORDER,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

const GUESSES_PER_TICK = 2_000;
const TICK_MS = 50;

/** One random 256-bit candidate key as hex. */
function randomKeyHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const TRILLION = 1_000_000_000_000n;
const YEARS_AT_TRILLION = expectedYearsToCrack(TRILLION);
const UNIVERSE_MULTIPLE = YEARS_AT_TRILLION / AGE_OF_UNIVERSE_YEARS;

/**
 * The brute-force futility runner: really guesses random keys, really
 * counts them — and then does the honest arithmetic on the key space.
 */
export function GuessTheKey({ finale }: RunnerProps) {
  const [running, setRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lastGuess, setLastGuess] = useState<string | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startedAt.current ??= Date.now();
    const timer = setInterval(() => {
      setAttempts((n) => n + GUESSES_PER_TICK);
      setLastGuess(randomKeyHex());
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [running]);

  const elapsedSec = startedAt.current ? Math.max(1, (Date.now() - startedAt.current) / 1000) : 0;
  const rate = elapsedSec > 0 ? Math.round(attempts / elapsedSec) : 0;

  return (
    <div className="cols">
      <div className="prose">
        <p>
          The lock on a bitcoin output accepts exactly one thing: a signature from the right
          private key. There are no other doors. So the only theoretical attack is the dumbest one
          imaginable — <strong>guess keys until one fits</strong>. Let's actually try it.
        </p>
        <button className="runbtn" onClick={() => setRunning((r) => !r)}>
          {running ? '⏸ Pause the attack' : attempts === 0 ? '▶ Start guessing keys' : '▶ Resume the attack'}
        </button>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
        {attempts > 0 && (
          <Callout>
            <strong>How it's going:</strong> your browser has made{' '}
            <strong>{attempts.toLocaleString('en-US')}</strong> genuinely random guesses
            {rate > 0 && <> (~{rate.toLocaleString('en-US')}/sec)</>} and found{' '}
            <strong>0 keys</strong>. Expected time to finish at this pace:{' '}
            <strong>unimaginably longer than the numbers on the right</strong> — and those already
            assume an attacker ten billion times faster than you.
          </Callout>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">The honest arithmetic</div>
          <div className="viz-sub">exact integer math on the key space — no rounding tricks</div>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">possible private keys</div>
              <div className="stat-value">{formatBigApprox(SECP256K1_ORDER)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">expected years @ 1 trillion guesses/sec</div>
              <div className="stat-value">{formatBigApprox(YEARS_AT_TRILLION)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">that's this many ages of the universe</div>
              <div className="stat-value">{formatBigApprox(UNIVERSE_MULTIPLE)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">keys your browser has tried</div>
              <div className="stat-value">{attempts.toLocaleString('en-US')}</div>
            </div>
          </div>
          <div className="guess-feed">
            <div className="stat-label">latest guess (a real random 256-bit number)</div>
            <code className="guess-hex">{lastGuess ?? 'press ▶ to begin'}</code>
            {lastGuess && <div className="guess-verdict">✗ not the key. Nothing opened.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
