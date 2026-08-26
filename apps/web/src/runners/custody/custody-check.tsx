import { useState } from 'react';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

interface Question {
  id: string;
  ask: string;
  /** Answering yes points toward self-custody. */
  yesMeansSelf: boolean;
  yesNote: string;
  noNote: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'phrase',
    ask: 'Did the wallet show you a recovery phrase and tell you to write it down?',
    yesMeansSelf: true,
    yesNote: 'A recovery phrase exists because there is a key only you hold.',
    noNote: 'No phrase means there is nothing of yours to recover — the keys are not yours.',
  },
  {
    id: 'signup',
    ask: 'Did you sign up with an email address, a phone number, or a password?',
    yesMeansSelf: false,
    yesNote: 'Accounts imply a provider holding something on your behalf.',
    noNote: 'No account: nothing to log into, and nothing for anyone to lock you out of.',
  },
  {
    id: 'channels',
    ask: 'Can you see a list of channels, with balances and a peer for each?',
    yesMeansSelf: true,
    yesNote: 'Seeing your own channels means you are a party to them.',
    noNote: 'If channels are invisible, they are probably not yours.',
  },
  {
    id: 'onchain',
    ask: 'Did opening it cost an on-chain fee, or ask you to fund it from the chain?',
    yesMeansSelf: true,
    yesNote: 'Somebody paid to put a 2-of-2 output on the chain, and it was you.',
    noNote: 'Free and instant setup usually means no channel of your own was opened.',
  },
];

type Answer = 'yes' | 'no' | undefined;

/**
 * The custody check: four behavioural questions whose answers distinguish
 * the models in practice, and a straight readout of which guarantees from
 * this curriculum currently apply to the reader.
 */
export function CustodyCheck({ finale }: RunnerProps) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const answered = QUESTIONS.filter((q) => answers[q.id]).length;
  const done = answered === QUESTIONS.length;

  const selfScore = QUESTIONS.reduce((n, q) => {
    const a = answers[q.id];
    if (!a) return n;
    const pointsToSelf = (a === 'yes') === q.yesMeansSelf;
    return n + (pointsToSelf ? 1 : 0);
  }, 0);

  const verdict = !done
    ? null
    : selfScore >= 3
      ? 'self'
      : selfScore <= 1
        ? 'custodial'
        : 'mixed';

  return (
    <div className="cols">
      <div className="prose">
        <p>
          Four questions about the wallet you actually use. They are about{' '}
          <strong>behaviour</strong>, not brand names — how a wallet behaves is what distinguishes
          the models in practice, and it does not go stale the way a list of products would.
        </p>
        {QUESTIONS.map((q) => (
          <div key={q.id} style={{ marginBottom: 14 }}>
            <div className="stat-label">{q.ask}</div>
            <div className="paths-chips" role="group" aria-label={q.ask}>
              {(['yes', 'no'] as const).map((choice) => (
                <button
                  key={choice}
                  className={`preset ${answers[q.id] === choice ? 'preset-active' : ''}`}
                  aria-pressed={answers[q.id] === choice}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                >
                  {choice}
                </button>
              ))}
            </div>
            {answers[q.id] && (
              <p className="finale-note" style={{ marginTop: 4 }}>
                {answers[q.id] === 'yes' ? q.yesNote : q.noNote}
              </p>
            )}
          </div>
        ))}

        {verdict === 'self' && (
          <Callout>
            <strong>You are holding your own keys.</strong> Everything in this curriculum
            describes <em>your</em> protection: the 2-of-2 lock is half yours, the penalty branch
            is enforceable by you, and nobody can freeze or reverse your payments. The duties come
            with it — being able to receive, and something watching the chain while you sleep.
          </Callout>
        )}
        {verdict === 'custodial' && (
          <Callout>
            <strong>A company is holding your money.</strong> This is a normal, legitimate choice
            for small amounts, and it works well. But be clear about what it is: the guarantees in
            the last five quests are describing the <em>provider's</em> protection, not yours. They
            can see every payment you make, they can freeze you, and if they fail you are a
            creditor. The fix, if you want the guarantees, is a wallet that hands you a recovery
            phrase.
          </Callout>
        )}
        {verdict === 'mixed' && (
          <Callout>
            <strong>Mixed signals — worth checking properly.</strong> Some wallets are genuinely
            hybrid: your keys, but channels managed by a service that can still see a great deal.
            Others are custodial with a recovery phrase for an on-chain balance only. The
            deciding question is the one from the first stop:{' '}
            <em>if they disappeared tonight, could you still get your money?</em>
          </Callout>
        )}
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">What applies to you</div>
          <div className="viz-sub">
            {done ? 'based on your four answers' : `${answered} of ${QUESTIONS.length} answered`}
          </div>
          <div className="field-rows">
            {[
              ['The 2-of-2 lock is half yours', 'self'],
              ['You can force close and take your balance', 'self'],
              ['The penalty branch protects you', 'self'],
              ['Only your peers see your payments', 'self'],
              ['Nobody can freeze or reverse you', 'self'],
            ].map(([claim]) => (
              <div className="field-row" key={claim}>
                <span className="field-label">{claim}</span>
                <span className="field-hex">
                  {!done ? '—' : verdict === 'self' ? '✓ yours' : verdict === 'mixed' ? '? check' : '✗ theirs'}
                </span>
              </div>
            ))}
          </div>
          {done && (
            <div className="guess-feed">
              <div className="stat-label">the deciding question</div>
              <div className="guess-verdict">
                If the provider disappeared tonight, could you still get your money?
                {verdict === 'self' ? ' — yes, by force closing.' : verdict === 'custodial' ? ' — no.' : ' — worth finding out.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
