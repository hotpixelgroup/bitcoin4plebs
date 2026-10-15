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
    yesNote:
      'A phrase is evidence of a recovery mechanism, not proof that you alone control the Lightning balance.',
    noNote:
      'No phrase does not settle custody: some designs use other backups or recovery mechanisms.',
  },
  {
    id: 'signup',
    ask: 'Did you sign up with an email address, a phone number, or a password?',
    yesMeansSelf: false,
    yesNote:
      'An account can coexist with self-custody; check what the provider actually controls.',
    noNote: 'No account alone does not prove independent spending or recovery.',
  },
  {
    id: 'channels',
    ask: 'Can you see a list of channels, with balances and a peer for each?',
    yesMeansSelf: true,
    yesNote:
      'A channel screen is a clue, not evidence that your device holds the required signing and recovery data.',
    noNote:
      'A wallet may hide channels from its UI even when you control them.',
  },
  {
    id: 'onchain',
    ask: 'Did opening it cost an on-chain fee, or ask you to fund it from the chain?',
    yesMeansSelf: true,
    yesNote:
      'Funding is a clue. Confirm who can sign, force-close and recover without the provider.',
    noNote:
      'Subsidized or prearranged setup does not establish who controls the keys.',
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
          <strong>behaviour</strong>, not brand names, how a wallet behaves is
          what distinguishes the models in practice, and it does not go stale
          the way a list of products would.
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
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: choice }))
                  }
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

        {done && (
          <Callout>
            <strong>
              {verdict === 'self'
                ? 'Clues consistent with self-custody.'
                : verdict === 'custodial'
                  ? 'Clues consistent with provider custody.'
                  : 'Mixed custody clues.'}
            </strong>{' '}
            These answers cannot certify custody or recovery. Check the wallet's
            documented architecture: who holds signing keys, who holds
            channel-state backups, and whether you can recover on-chain if the
            provider disappears. A phrase may cover only an on-chain balance. A
            provider may subsidize channel fees or offer an optional account
            without controlling keys. Never submit real keys or phrases here.
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
            {done
              ? 'based on your four answers'
              : `${answered} of ${QUESTIONS.length} answered`}
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
                  {!done ? 'unanswered' : '? verify independently'}
                </span>
              </div>
            ))}
          </div>
          {done && (
            <div className="guess-feed">
              <div className="stat-label">the deciding question</div>
              <div className="guess-verdict">
                If the provider disappeared tonight, could you still get your
                money?
                {
                  ' Check documented recovery requirements; this quiz cannot determine that.'
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
