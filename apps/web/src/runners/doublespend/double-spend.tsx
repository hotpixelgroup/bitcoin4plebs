import { useState } from 'react';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

type Phase = 'ready' | 'broadcast' | 'resolved';

/**
 * The double-spend duel: a faithful model of the rule that made digital
 * cash possible. The reader signs one coin to two recipients; the
 * refereeless network keeps whichever confirms first and rejects the
 * other as already-spent. No trusted party decides; the shared ledger
 * does, exactly as every node's input-already-spent check does on the
 * real chain.
 */
export function DoubleSpend({ finale }: RunnerProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [reorged, setReorged] = useState(false);
  const [winner, setWinner] = useState<'bo' | 'carol' | null>(null);

  const broadcast = () => setPhase('broadcast');

  const mine = (first: 'bo' | 'carol') => {
    setWinner(first);
    setPhase('resolved');
  };

  const reset = () => {
    setReorged(false);
    setPhase('ready');
    setWinner(null);
  };

  return (
    <div className="ds">
      <div className="ds-coin" aria-hidden="true">
        <span className="ds-coin-face">1 coin</span>
        <span className="ds-coin-sub">locked to your key</span>
      </div>

      {phase === 'ready' && (
        <>
          <p className="ds-brief">
            You hold one coin. In physical cash you could not pay two people
            with it: handing it over means you no longer have it. But this is
            data. Try the trick that broke every digital-cash design before
            2009: sign the <em>same</em> coin to two people at once.
          </p>
          <button className="runbtn" onClick={broadcast}>
            sign this coin to BOTH Bo and Carol, and broadcast
          </button>
        </>
      )}

      {phase === 'broadcast' && (
        <>
          <div className="ds-race">
            <div className="ds-tx">
              <div className="ds-tx-head">
                <span
                  className="story-avatar story-avatar-bo"
                  aria-hidden="true"
                >
                  B
                </span>{' '}
                pay Bo
              </div>
              <div className="ds-tx-note">valid signature · spends coin #1</div>
            </div>
            <div className="ds-tx">
              <div className="ds-tx-head">
                <span className="ds-avatar-carol" aria-hidden="true">
                  C
                </span>{' '}
                pay Carol
              </div>
              <div className="ds-tx-note">valid signature · spends coin #1</div>
            </div>
          </div>
          <p className="ds-brief">
            Node A first saw the payment to Bo; node B first saw the payment to
            Carol. Their local mempools disagree. Both carry a valid signature,
            because you own the coin. A node does not ordinarily keep both
            conflicting spends in its mempool; replacement depends on its
            policy. Nothing has confirmed yet. A miner is about to build the
            next block (Quest #6) and can include only one. Which block do you
            want to see mined?
          </p>
          <div className="stress-chips">
            <button className="preset" onClick={() => mine('bo')}>
              mine a block containing the payment to Bo
            </button>
            <button className="preset" onClick={() => mine('carol')}>
              mine a block containing the payment to Carol
            </button>
          </div>
        </>
      )}

      {phase === 'resolved' && winner && (
        <>
          <div className="ds-race">
            <div
              className={`ds-tx ${winner === 'bo' ? 'ds-tx-won' : 'ds-tx-lost'}`}
            >
              <div className="ds-tx-head">
                <span
                  className="story-avatar story-avatar-bo"
                  aria-hidden="true"
                >
                  B
                </span>{' '}
                pay Bo
              </div>
              <div className="ds-tx-note">
                {winner === 'bo'
                  ? 'confirmed · coin #1 now spent'
                  : 'rejected: "bad-txns-inputs-missingorspent"'}
              </div>
            </div>
            <div
              className={`ds-tx ${winner === 'carol' ? 'ds-tx-won' : 'ds-tx-lost'}`}
            >
              <div className="ds-tx-head">
                <span className="ds-avatar-carol" aria-hidden="true">
                  C
                </span>{' '}
                pay Carol
              </div>
              <div className="ds-tx-note">
                {winner === 'carol'
                  ? 'confirmed · coin #1 now spent'
                  : 'rejected: "bad-txns-inputs-missingorspent"'}
              </div>
            </div>
          </div>
          <Callout>
            <strong>
              {winner === 'bo' ? 'Bo' : 'Carol'} has{' '}
              {reorged
                ? 'the payment on the replacement chain'
                : 'one confirmation on this chain'}
              . The conflicting spend cannot also confirm on this chain.
            </strong>{' '}
            <RichText text="Nodes independently validate every block. Once they adopt this valid chain, its UTXO set records coin #1 as spent, so the conflicting payment cannot also be included. A valid alternative chain with greater cumulative proof of work can replace this history. One confirmation is evidence, not irreversible finality. Node counts do not choose the chain." />
          </Callout>
          <button
            className="preset"
            disabled={reorged}
            onClick={() => {
              setWinner(winner === 'bo' ? 'carol' : 'bo');
              setReorged(true);
            }}
          >
            adopt a valid competing branch with more cumulative work
          </button>
          {reorged && (
            <p role="status">
              Reorg: the old confirmation was disconnected. The other spend is
              confirmed on the new active chain. Both never coexist in one valid
              history.
            </p>
          )}
          <p className="finale-note">
            Teaching model: two nodes, one input, no fees or replacement-policy
            engine. You choose the block outcome; real miners search
            probabilistically and nodes may learn blocks at different times.
          </p>
          <button className="runbtn" onClick={reset}>
            try again (mine the other one first)
          </button>
        </>
      )}

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
