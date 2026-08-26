import { useState } from 'react';
import { bytesToHex, hexToBytes } from '@bitcoin4plebs/bitcoin-logic';
import { sha256 } from '@bitcoin4plebs/lightning-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/** The route: Mira pays Ines through a hub neither of them trusts. */
const HOPS = [
  { from: 'Mira', to: 'the hub', amountMsat: 180_000_000, cltv: 800_140, fee: 0 },
  { from: 'the hub', to: 'Ines', amountMsat: 179_820_000, cltv: 800_100, fee: 180_000 },
];

const PREIMAGE = '9f'.repeat(32);
const sats = (msat: number) => `${Math.round(msat / 1000).toLocaleString('en-US')} sats`;
const short = (hex: string) => `${hex.slice(0, 16)}…${hex.slice(-6)}`;

type Stage = 'idle' | 'offered' | 'settled';

/**
 * The HTLC relay: run a two-hop payment, watch the same hash lock both
 * hops with a descending timelock ladder, then settle it backwards from
 * the recipient — and try, as the hub, to keep the money.
 */
export function HtlcRelay({ finale }: RunnerProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [paymentHash, setPaymentHash] = useState('');
  const [theft, setTheft] = useState<{ guess: string; matches: boolean } | null>(null);

  const offer = async () => {
    const hash = bytesToHex(await sha256(hexToBytes(PREIMAGE)));
    setPaymentHash(hash);
    setStage('offered');
    setTheft(null);
  };

  const settle = () => setStage('settled');

  const steal = async () => {
    // The hub has never seen the preimage. All it can do is guess.
    const guess = '00'.repeat(31) + 'ff';
    const hashed = bytesToHex(await sha256(hexToBytes(guess)));
    setTheft({ guess, matches: hashed === paymentHash });
  };

  return (
    <div className="cols">
      <div className="prose">
        <p>
          Act one: <strong>offer the payment</strong>. Ines invents a secret and publishes only
          its hash in her invoice. Mira offers the hub an HTLC locked to that hash; the hub
          offers Ines one locked to the <em>same</em> hash, keeping a fee, with an earlier
          deadline.
        </p>
        <button className="runbtn" onClick={offer}>
          {stage === 'idle' ? '▶ Offer the HTLCs along the route' : '▶ Start again'}
        </button>
        {stage !== 'idle' && (
          <>
            <p>
              Act two: <strong>play the hub and try to keep it</strong>. It is holding a promise
              worth 180,000 sats. To claim it, it must produce a preimage of the hash. It has
              never seen one.
            </p>
            <button className="runbtn" onClick={steal}>
              ▶ Try to claim without the preimage
            </button>
            {theft && !theft.matches && (
              <Callout>
                <strong>✗ Rejected.</strong> The hub's guess hashes to something else entirely,
                so the script's <code>OP_EQUALVERIFY</code> fails and the money stays locked.
                There is no third branch to try: the only other exit is the timeout, which
                refunds Mira. Cheating here is not risky — it is arithmetically unavailable.
              </Callout>
            )}
            <p>
              Act three: <strong>let Ines claim</strong>. She is the only one who knows the
              secret. Watch what claiming costs her.
            </p>
            <button className="runbtn" onClick={settle} disabled={stage === 'settled'}>
              {stage === 'settled' ? '✓ Settled backwards' : '▶ Ines reveals the preimage'}
            </button>
          </>
        )}
        {stage === 'settled' && (
          <Callout>
            <strong>✓ Settled, from the far end backwards.</strong> Revealing the secret is how
            Ines takes her money — and it necessarily hands that secret to the hub, which
            immediately uses it to claim from Mira, because Mira locked to the same hash. Either
            both hops paid or neither did. The hub earned its 180 sats for the service and never
            had the option of keeping the 180,000.
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
          <div className="viz-title">One hash, two hops</div>
          <div className="viz-sub">HTLCs per BOLT #2 §update_add_htlc, deadlines descending</div>

          <div className="guess-feed">
            <div className="stat-label">payment_hash — identical at every hop, from the invoice</div>
            <code className={`guess-hex ${paymentHash ? 'mine-target' : ''}`}>
              {paymentHash ? short(paymentHash) : 'press ▶ to begin'}
            </code>
          </div>

          <div className="field-rows">
            {HOPS.map((hop) => (
              <div className="field-row" key={hop.to}>
                <span className="field-label">
                  {hop.from} → {hop.to}
                </span>
                <span className="field-hex">
                  {stage === 'idle' ? '—' : sats(hop.amountMsat)}
                  <span className="field-src">
                    {' '}
                    ← expires at block {hop.cltv.toLocaleString('en-US')}
                    {hop.fee > 0 && ` · ${sats(hop.fee)} fee`}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {stage !== 'idle' && (
            <div className="guess-feed">
              <div className="stat-label">
                the ladder: 40 blocks of margin, so the hub can always claim its incoming HTLC
                after paying out
              </div>
              <div className="guess-verdict">
                800,140 → 800,100. If it ran the other way, Ines could wait for Mira's HTLC to
                lapse and then claim, leaving the hub out of pocket.
              </div>
            </div>
          )}

          {theft && (
            <div className="guess-feed">
              <div className="stat-label">the hub's attempt: SHA-256(guess)</div>
              <code className="guess-hex">{short(bytesToHex(hexToBytes(theft.guess)))}</code>
              <div className="guess-verdict">
                {theft.matches ? '✓ matched' : '✗ does not equal the payment hash — claim fails'}
              </div>
            </div>
          )}

          {stage === 'settled' && (
            <div className="guess-feed">
              <div className="stat-label">preimage, revealed by Ines and travelling backwards</div>
              <code className="guess-hex mine-winner">{short(PREIMAGE)}</code>
              <div className="guess-verdict mine-won">
                ✓ SHA-256 of this equals the payment hash above — both hops now settle
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
