import { useState } from 'react';
import { COIN, satsToBtc } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

const STARTING_BOXES = [
  { id: 'a', label: 'Box A', sats: 50n * (COIN / 100n) },
  { id: 'b', label: 'Box B', sats: 30n * (COIN / 100n) },
  { id: 'c', label: 'Box C', sats: 20n * (COIN / 100n) },
  { id: 'd', label: 'Box D', sats: 5n * (COIN / 100n) },
];

interface LiveBox {
  id: string;
  label: string;
  sats: bigint;
  owner: 'you' | 'bob';
}

/**
 * The box builder: Ana pays Bo 0.60 BTC out of boxes that don't divide.
 * Selected boxes are DESTROYED; brand-new boxes appear for Bo and for
 * your change; the fee is the visible gap. The point: there is no
 * account, no balance, no "0.6 leaves your box": only boxes opened
 * whole and boxes created fresh, exactly like transaction.h says.
 */
export function UtxoFlow() {
  const [payment, setPayment] = useState(60_000_000);
  const [confirmed, setConfirmed] = useState(false);
  const [failure, setFailure] = useState('');
  const PAYMENT = BigInt(payment);
  const [fee, setFee] = useState(10_000);
  const [prediction, setPrediction] = useState('');
  const FEE = BigInt(fee);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<{
    spent: string[];
    created: LiveBox[];
  } | null>(null);

  const inputTotal = STARTING_BOXES.filter((b) => selected.has(b.id)).reduce(
    (sum, b) => sum + b.sats,
    0n,
  );
  const enough = inputTotal >= PAYMENT + FEE;
  const change = enough ? inputTotal - PAYMENT - FEE : 0n;

  const liveBoxes: LiveBox[] =
    sent && confirmed
      ? [
          ...STARTING_BOXES.filter((b) => !sent.spent.includes(b.id)).map(
            (b): LiveBox => ({ ...b, owner: 'you' }),
          ),
          ...sent.created,
        ]
      : STARTING_BOXES.map((b): LiveBox => ({ ...b, owner: 'you' }));
  const yourBalance = liveBoxes
    .filter((b) => b.owner === 'you')
    .reduce((s, b) => s + b.sats, 0n);

  const send = () => {
    if (!enough) {
      setFailure(
        'Insufficient inputs: payment plus fee exceeds selected value. Confirmed UTXOs did not change.',
      );
      return;
    }
    setFailure('');
    const created: LiveBox[] = [
      { id: 'bob', label: "Bo's new box", sats: PAYMENT, owner: 'bob' },
    ];
    if (change > 0n) {
      created.push({
        id: 'change',
        label: 'Change (new box, yours)',
        sats: change,
        owner: 'you',
      });
    }
    setSent({ spent: [...selected], created });
  };

  const reset = () => {
    setSelected(new Set());
    setSent(null);
    setPrediction('');
    setConfirmed(false);
    setFailure('');
  };

  const toggle = (id: string) => {
    if (sent) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <VizFigure
      title="The box builder"
      caption="Build Ana’s payment. Choose whole inputs, a recipient amount and a fee, then compare pending and confirmed state."
    >
      <label htmlFor="utxo-payment">
        Recipient amount: {satsToBtc(PAYMENT)} BTC
      </label>
      <input
        id="utxo-payment"
        type="range"
        min="1000000"
        max="80000000"
        step="1000000"
        value={payment}
        disabled={!!sent}
        onChange={(e) => {
          setPayment(Number(e.target.value));
          setPrediction('');
        }}
      />
      <label htmlFor="utxo-fee">
        Fee budget: {fee.toLocaleString('en-US')} sats (not a confirmation
        guarantee)
      </label>
      <input
        id="utxo-fee"
        type="range"
        min="0"
        max="50000"
        step="1000"
        value={fee}
        disabled={!!sent}
        onChange={(e) => {
          setFee(Number(e.target.value));
          setPrediction('');
        }}
      />
      <label htmlFor="utxo-prediction">
        Predict what happens to a selected input
      </label>{' '}
      <select
        id="utxo-prediction"
        value={prediction}
        disabled={!!sent}
        onChange={(e) => setPrediction(e.target.value)}
      >
        <option value="">Choose before sending</option>
        <option value="whole">
          It is spent whole; new outputs are created
        </option>
        <option value="subtract">Only the payment is subtracted from it</option>
      </select>
      <div className="utxo-board">
        <div className="utxo-col">
          <div className="stat-label">
            {confirmed
              ? 'confirmed UTXOs after the transaction'
              : 'your boxes (click to select inputs)'}
          </div>
          <div className="utxo-boxes">
            {STARTING_BOXES.map((box) => {
              const isSpent = confirmed && sent?.spent.includes(box.id);
              const isSelected = selected.has(box.id);
              return (
                <button
                  key={box.id}
                  className={`utxo-box ${isSelected && !sent ? 'utxo-selected' : ''} ${
                    isSpent ? 'utxo-spent' : ''
                  }`}
                  onClick={() => toggle(box.id)}
                  disabled={!!sent}
                >
                  <span className="utxo-box-label">{box.label}</span>
                  <span className="utxo-box-amount">
                    {satsToBtc(box.sats)} BTC
                  </span>
                  {isSpent && (
                    <span className="utxo-box-note">
                      destroyed (opened whole)
                    </span>
                  )}
                  {isSelected && !sent && (
                    <span className="utxo-box-note">will be destroyed</span>
                  )}
                </button>
              );
            })}
            {sent?.created.map((box) => (
              <div
                key={box.id}
                className={`utxo-box utxo-new ${box.owner === 'bob' ? 'utxo-theirs' : ''}`}
              >
                <span className="utxo-box-label">{box.label}</span>
                <span className="utxo-box-amount">
                  {satsToBtc(box.sats)} BTC
                </span>
                <span className="utxo-box-note">
                  {!confirmed
                    ? 'proposed output, not confirmed'
                    : box.owner === 'bob'
                      ? "locked to Bo's key"
                      : 'locked to a fresh key of yours'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="utxo-col utxo-summary">
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">inputs selected</div>
              <div className="stat-value">
                {satsToBtc(inputTotal)} <span className="stat-unit">BTC</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">your “balance”</div>
              <div className="stat-value">
                {satsToBtc(yourBalance)} <span className="stat-unit">BTC</span>
              </div>
            </div>
          </div>
          {!sent && (
            <button className="runbtn" onClick={send} disabled={!prediction}>
              {enough
                ? `▶ Build: Bo ${satsToBtc(PAYMENT)} + change ${satsToBtc(change)} + fee ${satsToBtc(FEE)}`
                : `Attempt: need ≥ ${satsToBtc(PAYMENT + FEE)} BTC`}
            </button>
          )}
          {sent && !confirmed && (
            <button className="runbtn" onClick={() => setConfirmed(true)}>
              Confirm transaction in the active chain
            </button>
          )}
          {sent && (
            <button className="preset" onClick={reset}>
              ↺ start over
            </button>
          )}
          <p className="viz-readout">
            {sent && confirmed
              ? `Look at what happened: nothing was subtracted from anything. ${sent.spent.length} box${
                  sent.spent.length > 1 ? 'es' : ''
                } stopped existing, ${sent.created.length} brand-new box${
                  sent.created.length > 1 ? 'es' : ''
                } appeared, and the missing ${satsToBtc(FEE)} BTC (inputs minus outputs) is the fee, claimable by whichever miner buries this (Quest #2). Your "balance" was never a number in an account; it's just the sum of boxes your keys still open.`
              : sent
                ? 'Transaction built, not confirmed. The proposed outputs do not yet replace the confirmed inputs.'
                : enough
                  ? change === 0n
                    ? 'Inputs exactly cover payment plus fee. No change output is needed.'
                    : `Whole inputs cover payment plus fee. The surplus ${satsToBtc(change)} BTC returns as a new change output.`
                  : `Select whole inputs covering at least ${satsToBtc(PAYMENT + FEE)} BTC for the payment and fee.`}
          </p>
        </div>
      </div>
      {sent && confirmed && (
        <p role="status">
          {prediction === 'whole'
            ? 'Prediction confirmed.'
            : 'The input was spent whole, rather than edited.'}{' '}
          Conservation: {satsToBtc(inputTotal)} BTC in = {satsToBtc(PAYMENT)}{' '}
          payment + {satsToBtc(change)} change + {satsToBtc(FEE)} fee.
        </p>
      )}
      {sent && !confirmed && (
        <p role="status">
          Pending transaction: inputs remain in the confirmed UTXO set until a
          block spends them. The wallet reserves selected inputs locally. New
          boxes shown above are proposed outputs.
        </p>
      )}
      {failure && <p role="alert">{failure}</p>}
      <p className="finale-note">
        Teaching model: this shows the UTXO set after acceptance in the active
        chain. Historical transaction data is not destroyed. Fees are inputs
        minus outputs; real wallets estimate virtual size and fee rate, account
        for dust policy, sign, broadcast and wait for confirmation. Zero fees do
        not guarantee relay. No real keys or funds.
      </p>
    </VizFigure>
  );
}
