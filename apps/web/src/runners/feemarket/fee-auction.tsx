import { useState } from 'react';
import { RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';
import {
  feeTrace,
  initialPool,
  replacePayment,
  type FeeTx,
} from '../labs/models';

export function FeeAuction({ finale }: RunnerProps) {
  const [pool, setPool] = useState<FeeTx[]>(initialPool);
  const [step, setStep] = useState(0);
  const [bump, setBump] = useState(1000);
  const [newInput, setNewInput] = useState(false);
  const [message, setMessage] = useState(
    'Predict which package enters the first 500-vB block.',
  );
  const [prediction, setPrediction] = useState('competitor');
  const trace = feeTrace(pool);
  const view = step ? trace[step - 1].after : pool;
  const confirmation =
    trace.findIndex((b) => b.mined.some((t) => t.id === 'payment')) + 1;
  const reset = () => {
    setPool(initialPool);
    setStep(0);
    setMessage('Replay reset. Same arrivals and policies.');
  };
  return (
    <section className="prose" aria-label="Package fee laboratory">
      <h3>One queue, one arrival trace</h3>
      <p>
        Deterministic 500-vB teaching blocks, not Bitcoin block capacity. Before
        each block, fixed arrivals enter; ancestor packages compete by combined
        fee / combined vsize. This greedy subset omits sigops, weight details,
        miner discretion and other policy. The starting queue is assumed
        available; relay fee floors are omitted. Neither a fee quote nor a
        guarantee.
      </p>
      <label>
        Replacement / child fee (sats){' '}
        <input
          type="number"
          min="0"
          max="100000"
          value={bump}
          onChange={(e) => setBump(Number(e.target.value))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={newInput}
          onChange={(e) => setNewInput(e.target.checked)}
        />{' '}
        Replacement adds a new unconfirmed input
      </label>
      <div className="stress-chips">
        <button
          className="preset"
          disabled={step > 0}
          onClick={() => {
            const r = replacePayment(pool, bump, newInput);
            setPool(r.pool);
            setMessage(r.reason);
          }}
        >
          Try RBF replacement
        </button>
        <button
          className="preset"
          disabled={
            step > 0 ||
            pool.some((t) => t.id === 'child') ||
            !Number.isSafeInteger(bump) ||
            bump < 0
          }
          onClick={() => {
            setPool([
              ...pool,
              { id: 'child', parent: 'parent', fee: bump, size: 100 },
            ]);
            setMessage(
              'CPFP child spends the parent’s output. Both must fit and be selected together unless the parent is already confirmed. Child fee is additional expense.',
            );
          }}
        >
          Attach CPFP child to parent
        </button>
      </div>
      <p>
        Historical Core 28-era full-RBF policy fixture (selected constraints):
        greater absolute fees including evicted descendants, higher
        direct-conflict feerate, incremental relay fee assumed 1 sat/vB, no new
        unconfirmed inputs, at most 100 evictions. Signalling is not required in
        this fixture. This is not complete Core admission policy. The newer
        pinned Core source uses conflicting-cluster limits and feerate-diagram
        improvement; these historical limits are not current universal rules.
      </p>
      <label>
        Predict the first selected package{' '}
        <select
          value={prediction}
          disabled={step > 0}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="competitor">competitor</option>
          <option value="payment">payment</option>
          <option value="parent">parent + child</option>
          <option value="arrival-1">arrival-1</option>
        </select>
      </label>
      <div className="stress-chips">
        <button
          className="runbtn"
          disabled={step === trace.length}
          onClick={() => {
            if (step === 0) {
              const first = trace[0].mined[0]?.id;
              setMessage(
                `${prediction === first ? 'Prediction matched.' : 'Prediction differed.'} First selected: ${first}. Compare package rates, not the child alone.`,
              );
            }
            setStep(step + 1);
          }}
        >
          Mine next trace block
        </button>
        <button className="preset" onClick={reset}>
          Reset fee experiment
        </button>
      </div>
      <p role="status">{message}</p>
      <p>
        Trace forecast from exactly these arrivals: payment{' '}
        {confirmation
          ? `in block ${confirmation}`
          : 'unconfirmed at four-block cutoff'}
        . No wall-clock estimate: blocks are probabilistic.
      </p>
      <h4>Queue after block {step}</h4>
      <ul>
        {view.map((t) => (
          <li key={t.id}>
            {t.id}: {t.fee} sats / {t.size} vB = {(t.fee / t.size).toFixed(2)}{' '}
            sat/vB
            {t.parent
              ? ` · parent ${t.parent}: ${step > 0 && trace[step - 1].confirmed.includes(t.parent) ? 'already confirmed' : 'unconfirmed dependency'}`
              : ''}
          </li>
        ))}
      </ul>
      <div aria-label="Queue histogram">
        {[0, 2, 5, 10].map((floor, i) => {
          const ceiling = [2, 5, 10, Infinity][i];
          const size = view
            .filter((t) => t.fee / t.size >= floor && t.fee / t.size < ceiling)
            .reduce((s, t) => s + t.size, 0);
          return (
            <p key={floor}>
              {floor}–{ceiling === Infinity ? '∞' : ceiling} sat/vB: {size} vB{' '}
              <meter min={0} max={1000} value={size}>
                {size}
              </meter>
            </p>
          );
        })}
      </div>
      <ol>
        {trace.slice(0, step).map((b, i) => (
          <li key={i}>
            Block {i + 1}: arrivals{' '}
            {b.before
              .filter((t) => t.id.startsWith('arrival'))
              .map((t) => t.id)
              .join(', ') || 'none waiting'}
            ; selected {b.mined.map((t) => t.id).join(' → ') || 'none'}. Fees{' '}
            {b.mined.reduce((s, t) => s + t.fee, 0)} sats.
          </li>
        ))}
      </ol>
      <p>
        The same trace drives the queue, histogram, selection and forecast.
        Change the starting fee strategy, reset, and replay to compare.
      </p>
      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </section>
  );
}
