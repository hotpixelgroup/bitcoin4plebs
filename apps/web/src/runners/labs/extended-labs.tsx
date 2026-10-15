import { useState } from 'react';
import {
  chainInitial,
  chainStep,
  chainView,
  inferOwnership,
  merchantRace,
  privacyCases,
  recover,
  reconcileSnapshot,
  reservationInitial,
  reservationStep,
  type RecoveryKit,
} from './models';

export function ReorgLab() {
  const [state, setState] = useState(chainInitial);
  const [prediction, setPrediction] = useState('split');
  const [feedback, setFeedback] = useState('');
  return (
    <section
      className="prose lab-extension"
      aria-label="Reorg network laboratory"
    >
      <h3>Propagate, disconnect, reconnect</h3>
      <p>
        Two nodes, one shared input, valid equal-difficulty branches. Work units
        are illustrative, not joules or votes. Mine Bo at A, Carol at B, then
        propagate a tie; extend B and propagate again. A withheld or stale tip
        cannot be detected from one peer alone.
      </p>
      <label>
        Predict the next propagation{' '}
        <select
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="split">Nodes keep different tips</option>
          <option value="same">Nodes converge</option>
        </select>
      </label>
      <div className="stress-chips">
        {(['bo', 'carol', 'extend', 'invalid', 'propagate'] as const).map(
          (action) => (
            <button
              className="preset"
              key={action}
              onClick={() => {
                const next = chainStep(state, action);
                setState(next);
                if (action === 'propagate')
                  setFeedback(
                    (next.tips[0] === next.tips[1]) === (prediction === 'same')
                      ? 'Prediction matched.'
                      : 'Prediction differed: inspect work and validity.',
                  );
              }}
            >
              {
                {
                  bo: 'Mine Bo at node A',
                  carol: 'Mine Carol at node B',
                  extend: 'Extend B’s branch',
                  invalid: 'Offer invalid high-work block',
                  propagate: 'Propagate tips',
                }[action]
              }
            </button>
          ),
        )}
        <button
          className="preset"
          onClick={() => {
            setState(chainInitial());
            setFeedback('');
          }}
        >
          Reset network
        </button>
      </div>
      <p role="status">
        {feedback} {state.log}
      </p>
      {state.tips.map((tip, i) => {
        const v = chainView(state, tip);
        return (
          <p key={i}>
            Node {i === 0 ? 'A' : 'B'}: {v.path.join(' → ')} · cumulative added
            work {v.work} · active UTXO owner {v.owner} (1 coin); other
            recipients 0.
          </p>
        );
      })}
      <p>
        UTXO views are replayed from the common ancestor; an orphaned
        confirmation does not remain in the active balance. This controlled
        model does not implement scripts, mempool policy or a full bootstrap
        verifier.
      </p>
      <MerchantWait />
    </section>
  );
}
export function MerchantWait() {
  const [share, setShare] = useState(30);
  const [depth, setDepth] = useState(3);
  const [seed, setSeed] = useState(42);
  const [shown, setShown] = useState(false);
  const r = merchantRace(share / 100, depth, seed);
  return (
    <div>
      <h4>Secret mining during the merchant’s wait</h4>
      <label>
        Attacker hash share (%){' '}
        <input
          type="number"
          min="0"
          max="100"
          value={share}
          onChange={(e) => {
            setShare(Math.max(0, Math.min(100, Number(e.target.value))));
            setShown(false);
          }}
        />
      </label>
      <label>
        Merchant confirmations{' '}
        <input
          type="number"
          min="1"
          max="12"
          value={depth}
          onChange={(e) => {
            setDepth(Math.max(1, Math.min(12, Number(e.target.value))));
            setShown(false);
          }}
        />
      </label>
      <label>
        Replay seed{' '}
        <input
          type="number"
          value={seed}
          onChange={(e) => {
            setSeed(Number(e.target.value));
            setShown(false);
          }}
        />
      </label>
      <button className="preset" onClick={() => setShown(true)}>
        Reveal seeded merchant race
      </button>
      {shown && (
        <p role="status">
          At delivery: honest {r.atDelivery.honest}, private{' '}
          {r.atDelivery.secret}. Final: honest {r.honest}, private {r.secret};{' '}
          {r.outcome === 'replacement'
            ? 'attacker obtained strictly more work'
            : 'unresolved at cutoff'}
          . A tie does not replace the active chain: this model resolves it by
          continuing until a strict private lead or the 400-event total budget.
        </p>
      )}
      <p>
        Independent constant hash shares, equal work per block, no difficulty
        retarget, costs, propagation advantage or tie-breaking advantage. The
        attacker mines from the same parent during the wait; this differs from
        starting at a known deficit. Cutoff is not permanent failure; a minority
        can succeed. A trial is not a probability estimate.
      </p>
    </div>
  );
}
export function PrivacyLab() {
  const [kind, setKind] = useState<keyof typeof privacyCases>('payjoin');
  const [common, setCommon] = useState(true);
  const [smaller, setSmaller] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [prediction, setPrediction] = useState('false-positive');
  const fixture = privacyCases[kind];
  const guesses = inferOwnership(fixture.tx, common, smaller);
  const falsePos = [...guesses].filter((a) => !fixture.truth.includes(a));
  const hasFalsePositives = falsePos.length > 0;
  return (
    <section
      className="prose lab-extension"
      aria-label="Privacy counterexample laboratory"
    >
      <h3>Break your ownership hypothesis</h3>
      <label>
        Public transaction fixture{' '}
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as keyof typeof privacyCases);
            setRevealed(false);
          }}
        >
          {Object.keys(privacyCases).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <p>
        Known shop input S1. Inputs: {fixture.tx.inputs.join(' + ')}. Outputs:{' '}
        {fixture.tx.outputs
          .map((o) => `${o.address} ${o.sats} sats`)
          .join('; ')}
        .
      </p>
      <label>
        <input
          type="checkbox"
          checked={common}
          onChange={(e) => {
            setCommon(e.target.checked);
            setRevealed(false);
          }}
        />{' '}
        Apply common-input hypothesis
      </label>
      <label>
        <input
          type="checkbox"
          checked={smaller}
          onChange={(e) => {
            setSmaller(e.target.checked);
            setRevealed(false);
          }}
        />{' '}
        Guess uniquely smaller output is change
      </label>
      <p>
        Public-data guesses: {[...guesses].join(', ')}. Equal outputs produce no
        smaller-output guess.
      </p>
      <label>
        Predict ownership errors{' '}
        <select
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="false-positive">At least one false positive</option>
          <option value="none">No false positives</option>
        </select>
      </label>
      <button className="preset" onClick={() => setRevealed(true)}>
        Reveal independent fixture truth
      </button>
      {revealed && (
        <p role="status">
          {hasFalsePositives === (prediction === 'false-positive')
            ? 'Prediction matched.'
            : 'Prediction differed.'}{' '}
          Actual shop addresses: {fixture.truth.join(', ')}. False positives:{' '}
          {falsePos.join(', ') || 'none'}; missed:{' '}
          {fixture.truth.filter((a) => !guesses.has(a)).join(', ') || 'none'}.{' '}
          {fixture.explanation}
        </p>
      )}
      <p>
        Only public inputs and amounts enter the inference function. Private
        fixture ownership is used afterwards to challenge the guess, never to
        select it. These examples do not quantify real-world privacy.
      </p>
    </section>
  );
}
const kitInitial = (): RecoveryKit => ({
  seed: true,
  passphrase: true,
  descriptor: false,
  cosigners: 0,
  currentState: false,
  staticBackup: true,
  peerOnline: false,
  tower: true,
});
export function RecoveryLab({ lightning = false }: { lightning?: boolean }) {
  const [kind, setKind] = useState<'single' | 'multisig' | 'lightning'>(
    lightning ? 'lightning' : 'single',
  );
  const [kit, setKit] = useState(kitInitial);
  const [result, setResult] = useState('');
  const [predict, setPredict] = useState('blocked');
  const choices: [keyof RecoveryKit, string][] = [
    ['seed', 'This signer’s seed available'],
    ['passphrase', 'Exact original BIP39 passphrase (fixture uses one)'],
    [
      'descriptor',
      'Correct descriptor / script / derivation and public cosigner data',
    ],
    ['currentState', 'Current channel database available'],
    ['staticBackup', 'Static channel backup available'],
    ['peerOnline', 'Peer reachable and cooperative'],
    ['tower', 'Configured watchtower available'],
  ];
  return (
    <section className="prose lab-extension" aria-label="Recovery laboratory">
      <h3>Recover a wallet, not just some words</h3>
      <p>
        Synthetic backup cards only. Do not enter seeds, passphrases or real
        keys. Descriptor cards represent public recovery metadata; they cannot
        sign by themselves.
      </p>
      <label>
        Recovery target{' '}
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as typeof kind);
            setResult('');
          }}
        >
          <option value="single">Single-key on-chain wallet</option>
          <option value="multisig">2-of-3 multisig wallet</option>
          <option value="lightning">Lightning node</option>
        </select>
      </label>
      {choices
        .filter(
          ([key]) =>
            (kind === 'lightning' && key !== 'descriptor') ||
            (kind !== 'lightning' &&
              !['currentState', 'staticBackup', 'peerOnline', 'tower'].includes(
                key,
              )),
        )
        .map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={kit[key] as boolean}
              onChange={(e) => {
                setKit({ ...kit, [key]: e.target.checked });
                setResult('');
              }}
            />
            {kind === 'lightning' && key === 'passphrase'
              ? 'Exact implementation-specific recovery passphrase (LND uses aezeed, not BIP39)'
              : label}
          </label>
        ))}
      {kind === 'multisig' && (
        <label>
          Other available private cosigners{' '}
          <select
            value={kit.cosigners}
            onChange={(e) => {
              setKit({ ...kit, cosigners: Number(e.target.value) });
              setResult('');
            }}
          >
            {[0, 1, 2].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        Prediction{' '}
        <select value={predict} onChange={(e) => setPredict(e.target.value)}>
          <option value="blocked">
            Cannot fully restore the target with these cards
          </option>
          <option value="ready">Fixture can restore the target</option>
        </select>
      </label>
      <div className="stress-chips">
        <button
          className="preset"
          onClick={() => {
            const message = recover(kind, kit);
            const ready =
              message.startsWith('Fixture wallet') ||
              message.startsWith('Current channel');
            setResult(
              `${ready === (predict === 'ready') ? 'Prediction matched.' : 'Prediction differed.'} ${message}`,
            );
          }}
        >
          Attempt fixture recovery
        </button>
        <button
          className="preset"
          onClick={() => {
            setKit(kitInitial());
            setResult('');
          }}
        >
          Reset recovery cards
        </button>
      </div>
      <p role="status">
        {result}
        {kind === 'lightning' && result
          ? ` Watchtower card: ${kit.tower ? 'configured' : 'absent'}; neither choice supplies lost channel state.`
          : ''}
      </p>
      <p>
        A watchtower is a breach-response service for supported states, not seed
        storage, general downtime protection or a guaranteed confirmation
        service. Static backups cannot safely recreate a live channel; never
        test by broadcasting an obsolete commitment.
      </p>
    </section>
  );
}
export function FundingLab() {
  const [state, setState] = useState(reservationInitial);
  const [amount, setAmount] = useState(5000);
  const [feedback, setFeedback] = useState('');
  return (
    <section
      className="prose lab-extension"
      aria-label="Funding and reservation laboratory"
    >
      <h3>Ready before routing; reserve before fulfillment</h3>
      <p>
        Separate simplified lifecycle: legacy-style 100,000-sat channel, Ana
        80,000 / Bo 20,000; Ana retains a 1,000-sat reserve. Funding and initial
        commitment signatures precede the assumed confirmation depth and
        exchange of channel_ready. No actual signatures or transactions are
        created; zero-conf negotiation is excluded.
      </p>
      <label>
        Offered HTLC sats{' '}
        <input
          type="number"
          min="1"
          max="100000"
          value={amount}
          disabled={state.phase === 'pending'}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </label>
      <div className="stress-chips">
        {(['sign', 'ready', 'offer', 'settle', 'fail'] as const).map(
          (action) => (
            <button
              className="preset"
              key={action}
              onClick={() => {
                const next = reservationStep(state, action, amount);
                setFeedback(
                  next === state
                    ? 'Transition rejected: check readiness, reserve, amount or already consumed HTLC.'
                    : `${action} accepted.`,
                );
                setState(next);
              }}
            >
              {
                {
                  sign: 'Exchange funding + commitment signatures',
                  ready: 'Confirm depth + both channel_ready',
                  offer: 'Reserve HTLC',
                  settle: 'Fulfill reserved HTLC',
                  fail: 'Fail and release reservation',
                }[action]
              }
            </button>
          ),
        )}
        <button
          className="preset"
          onClick={() => {
            setState(reservationInitial());
            setFeedback('');
          }}
        >
          Reset funding lifecycle
        </button>
      </div>
      <p role="status">
        Phase {state.phase}; Ana available {state.ana}; Bo available {state.bo};
        HTLC locked {state.locked}; conserved total{' '}
        {state.ana + state.bo + state.locked} sats. {feedback}
      </p>
      <p>
        Pending value is neither spendable local balance nor a delivered
        payment. Fulfillment credits Bo; failure returns Ana’s reservation
        exactly once. Actual commitments include fees, dust, reserves, HTLC
        limits and timeout paths; see the claim-race exercise for timing.
      </p>
    </section>
  );
}
const block = '0'.repeat(63) + '1';
const snapshot = JSON.stringify(
  {
    height: 1,
    bestblock: block,
    total_amount: '50.00000000',
    total_unspendable_amount: '50.00000000',
  },
  null,
  2,
);
export function SnapshotLab() {
  const [json, setJson] = useState(snapshot);
  const [height, setHeight] = useState('1');
  const [hash, setHash] = useState(block);
  const [result, setResult] = useState('');
  return (
    <section
      className="prose lab-extension"
      aria-label="RPC snapshot laboratory"
    >
      <h3>Match the measurement to its block</h3>
      <p>
        Paste complete gettxoutsetinfo JSON or edit this synthetic height-1
        fixture: 100 BTC scheduled, 50 BTC in the UTXO set and 50 BTC excluded
        genesis reward. Hash is a fixture, not a real block. Optional
        coinstatsindex accounting is reported only when supplied.
      </p>
      <label>
        Expected snapshot height{' '}
        <input
          value={height}
          onChange={(e) => {
            setHeight(e.target.value);
            setResult('');
          }}
        />
      </label>
      <label>
        Independently expected bestblock{' '}
        <input
          value={hash}
          onChange={(e) => {
            setHash(e.target.value);
            setResult('');
          }}
        />
      </label>
      <label>
        Complete RPC JSON{' '}
        <textarea
          rows={8}
          value={json}
          onChange={(e) => {
            setJson(e.target.value);
            setResult('');
          }}
        />
      </label>
      <div className="stress-chips">
        <button
          className="preset"
          onClick={() =>
            setResult(reconcileSnapshot(json, height, hash).message)
          }
        >
          Reconcile RPC identity
        </button>
        <button
          className="preset"
          onClick={() => {
            setHeight('2');
            setResult(
              'Expected height changed; predict the result before reconciling.',
            );
          }}
        >
          Try mismatched height
        </button>
        <button
          className="preset"
          onClick={() => {
            setJson(snapshot);
            setHeight('1');
            setHash(block);
            setResult('');
          }}
        >
          Reset RPC fixture
        </button>
      </div>
      <p role="status">{result}</p>
      <p>
        Obtain expected identity independently; copying the same reported hash
        into both inputs is not independent evidence. Lost-key outputs remain
        counted. Missing optional fields remain unknown; a matching identity
        does not authenticate your data source or verify chain validation.
      </p>
    </section>
  );
}
