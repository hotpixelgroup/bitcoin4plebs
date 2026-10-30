import { useState } from 'react';
import { VizFigure } from './viz-figure';

/**
 * The shared ledger: four people, four complete copies of one list.
 * Honest entries land everywhere; Mallory's private edit lands only on
 * her copy, and the reader watches the other three copies quietly make
 * her version irrelevant. The entire idea of Bitcoin, before any code.
 */

const KEEPERS = ['You', 'Bea', 'Carl', 'Mallory'] as const;

const STARTING_ENTRIES = [
  'Ana pays Bea 3',
  'Bea pays Carl 1',
  'Carl pays you 2',
];

const HONEST_ENTRIES = [
  'Bo pays Mallory 2',
  'You pay Ana 1',
  'Bea pays Dan 4',
  'Mallory pays Carl 1',
];

export function SharedLedger() {
  const [honestCount, setHonestCount] = useState(0);
  const [invalidPeers, setInvalidPeers] = useState(1);
  const [tampered, setTampered] = useState(false);

  const honest = [...STARTING_ENTRIES, ...HONEST_ENTRIES.slice(0, honestCount)];

  const reset = () => {
    setHonestCount(0);
    setTampered(false);
  };

  return (
    <VizFigure
      title="Four copies, one truth"
      caption="Everyone keeps the whole list. Add honest entries, then let Mallory try rewriting hers."
    >
      <label htmlFor="ledger-peers">
        Peers proposing an invalid mint: {invalidPeers} of 4
      </label>
      <input
        id="ledger-peers"
        type="range"
        min="1"
        max="3"
        value={invalidPeers}
        onChange={(e) => setInvalidPeers(Number(e.target.value))}
      />
      <div className="preset-row">
        <button
          className="runbtn ledger-btn"
          onClick={() =>
            setHonestCount((n) => Math.min(HONEST_ENTRIES.length, n + 1))
          }
          disabled={honestCount >= HONEST_ENTRIES.length}
        >
          ▶ Add an honest entry
        </button>
        <button
          className="preset"
          onClick={() => setTampered(true)}
          disabled={tampered}
        >
          <span aria-hidden="true">☠</span> Propose an unauthorized 1,000-coin
          mint
        </button>
        {(honestCount > 0 || tampered) && (
          <button className="preset" onClick={reset}>
            reset
          </button>
        )}
      </div>
      <div className="ledger-row">
        {KEEPERS.map((keeper, index) => {
          const isMallory = index >= KEEPERS.length - invalidPeers;
          const rows =
            isMallory && tampered ? [...honest, 'Mallory gets 1,000'] : honest;
          const disagrees = isMallory && tampered;
          return (
            <div
              key={keeper}
              className={`ledger-copy ${disagrees ? 'ledger-bad' : ''}`}
            >
              <div className="ledger-head">
                <span>{keeper}'s copy</span>
                <span className={disagrees ? 'chain-bad' : 'chain-ok'}>
                  {disagrees ? '✗ invalid mint' : '✓ rules checked'}
                </span>
              </div>
              <ol className="ledger-list">
                {rows.map((row, i) => (
                  <li
                    key={i}
                    className={
                      row === 'Mallory gets 1,000' ? 'ledger-forged' : ''
                    }
                  >
                    {row}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      <p className="viz-readout" role="status">
        {!tampered &&
          honestCount === 0 &&
          'Four strangers, four identical copies. There is no "main" copy and no keeper in charge. Add an entry and watch how honest news spreads.'}
        {!tampered &&
          honestCount > 0 &&
          'Every honest entry lands on every copy, because everyone applies the same rule to the same news. In this simplified synchronized view the valid copies match; real nodes can temporarily see different valid tips. Now give Mallory her turn.'}
        {tampered &&
          'Each validating node rejects the unauthorized mint because it violates issuance rules, even when three of four peers propose it. Counting peers cannot make an invalid block valid. Among valid competing histories, nodes select greatest cumulative proof of work, not a majority vote.'}
      </p>
      <p className="finale-note">
        Teaching model: prevalidated payments and instant delivery. This figure
        does not simulate signatures, mining or network delays.
      </p>
    </VizFigure>
  );
}
