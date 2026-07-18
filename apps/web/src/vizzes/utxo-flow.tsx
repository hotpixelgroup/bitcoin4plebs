import { useState } from 'react';
import { COIN, satsToBtc } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

const FEE = 10_000n; // 0.0001 BTC
const PAYMENT = 60n * (COIN / 100n); // 0.60 BTC
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
 * The box builder: pay Bob 0.60 BTC out of boxes that don't divide.
 * Selected boxes are DESTROYED; brand-new boxes appear for Bob and for
 * your change; the fee is the visible gap. The point: there is no
 * account, no balance, no "0.6 leaves your box" — only boxes opened
 * whole and boxes created fresh, exactly like transaction.h says.
 */
export function UtxoFlow() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<{ spent: string[]; created: LiveBox[] } | null>(null);

  const inputTotal = STARTING_BOXES.filter((b) => selected.has(b.id)).reduce(
    (sum, b) => sum + b.sats,
    0n
  );
  const enough = inputTotal >= PAYMENT + FEE;
  const change = enough ? inputTotal - PAYMENT - FEE : 0n;

  const liveBoxes: LiveBox[] = sent
    ? [
        ...STARTING_BOXES.filter((b) => !sent.spent.includes(b.id)).map(
          (b): LiveBox => ({ ...b, owner: 'you' })
        ),
        ...sent.created,
      ]
    : STARTING_BOXES.map((b): LiveBox => ({ ...b, owner: 'you' }));
  const yourBalance = liveBoxes.filter((b) => b.owner === 'you').reduce((s, b) => s + b.sats, 0n);

  const send = () => {
    const created: LiveBox[] = [
      { id: 'bob', label: "Bob's new box", sats: PAYMENT, owner: 'bob' },
    ];
    if (change > 0n) {
      created.push({ id: 'change', label: 'Change (new box, yours)', sats: change, owner: 'you' });
    }
    setSent({ spent: [...selected], created });
  };

  const reset = () => {
    setSelected(new Set());
    setSent(null);
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
      caption="Pay Bob 0.60 BTC. Your money is boxes that only open whole — pick which to destroy."
    >
      <div className="utxo-board">
        <div className="utxo-col">
          <div className="stat-label">
            {sent ? 'what exists after the transaction' : 'your boxes (click to select inputs)'}
          </div>
          <div className="utxo-boxes">
            {STARTING_BOXES.map((box) => {
              const isSpent = sent?.spent.includes(box.id);
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
                  <span className="utxo-box-amount">{satsToBtc(box.sats)} BTC</span>
                  {isSpent && <span className="utxo-box-note">destroyed — opened whole</span>}
                  {isSelected && !sent && <span className="utxo-box-note">will be destroyed</span>}
                </button>
              );
            })}
            {sent?.created.map((box) => (
              <div key={box.id} className={`utxo-box utxo-new ${box.owner === 'bob' ? 'utxo-theirs' : ''}`}>
                <span className="utxo-box-label">{box.label}</span>
                <span className="utxo-box-amount">{satsToBtc(box.sats)} BTC</span>
                <span className="utxo-box-note">
                  {box.owner === 'bob' ? "locked to Bob's key" : 'locked to a fresh key of yours'}
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
            <button className="runbtn" onClick={send} disabled={!enough}>
              {enough
                ? `▶ Send: Bob 0.6 + change ${satsToBtc(change)} + fee 0.0001`
                : `Select boxes worth ≥ ${satsToBtc(PAYMENT + FEE)} BTC`}
            </button>
          )}
          {sent && (
            <button className="preset" onClick={reset}>
              ↺ start over
            </button>
          )}
          <p className="viz-readout">
            {sent
              ? `Look at what happened: nothing was subtracted from anything. ${sent.spent.length} box${
                  sent.spent.length > 1 ? 'es' : ''
                } stopped existing, ${sent.created.length} brand-new box${
                  sent.created.length > 1 ? 'es' : ''
                } appeared, and the missing 0.0001 BTC — inputs minus outputs — is the fee, claimable by whichever miner buries this (Quest #2). Your "balance" was never a number in an account; it's just the sum of boxes your keys still open.`
              : enough
                ? 'Note the problem change solves: your boxes don\'t add to exactly 0.6001. The transaction will destroy them whole and hand the surplus back to you as a brand-new box.'
                : 'Boxes never open partially — to pay 0.6 you must destroy whole boxes covering at least 0.6001 (payment + fee), and take the rest back as change.'}
          </p>
        </div>
      </div>
    </VizFigure>
  );
}
