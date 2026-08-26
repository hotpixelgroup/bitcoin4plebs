import { useState } from 'react';
import {
  APPENDIX_E,
  compress,
  deriveRevocationPrivkey,
  deriveRevocationPubkey,
  perCommitmentPoint,
  publicKey,
  type RevocationDerivation,
} from '@bitcoin4plebs/lightning-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/** Two independent secrets: Mira's basepoint, and the state Tomas is on. */
const MIRA_BASEPOINT_SECRET = '2b'.repeat(32);
const TOMAS_COMMITMENT_SECRET = '7c'.repeat(32);

const short = (hex: string) => `${hex.slice(0, 20)}…${hex.slice(-8)}`;

interface Forged {
  derivation: RevocationDerivation;
  /** Present only once the secret has been handed over. */
  privkey?: string;
  /** privkey · G, to prove it really opens that lock. */
  privkeyPubkey?: string;
}

interface VectorCheck {
  rows: { label: string; expected: string; got: string; ok: boolean }[];
  allOk: boolean;
}

/**
 * The revocation forge: build both halves of a revocation key from two
 * independent secrets, watch them meet, then reveal the per-commitment
 * secret and see the private key appear. Finally, run BOLT #3 Appendix E's
 * own vectors through the same code and check every intermediate value.
 */
export function RevocationForge({ finale }: RunnerProps) {
  const [forged, setForged] = useState<Forged | null>(null);
  const [check, setCheck] = useState<VectorCheck | null>(null);

  const build = async () => {
    const basepoint = compress(publicKey(BigInt('0x' + MIRA_BASEPOINT_SECRET)));
    const point = perCommitmentPoint(TOMAS_COMMITMENT_SECRET);
    setForged({ derivation: await deriveRevocationPubkey(basepoint, point) });
  };

  const revoke = async () => {
    if (!forged) return;
    const privkey = await deriveRevocationPrivkey(
      MIRA_BASEPOINT_SECRET,
      TOMAS_COMMITMENT_SECRET
    );
    setForged({
      ...forged,
      privkey,
      privkeyPubkey: compress(publicKey(BigInt('0x' + privkey))),
    });
  };

  const runVectors = async () => {
    const d = await deriveRevocationPubkey(
      APPENDIX_E.base_point,
      APPENDIX_E.per_commitment_point
    );
    const priv = await deriveRevocationPrivkey(
      APPENDIX_E.base_secret,
      APPENDIX_E.per_commitment_secret
    );
    const rows = [
      {
        label: 'per_commitment_point = secret · G',
        expected: APPENDIX_E.per_commitment_point,
        got: perCommitmentPoint(APPENDIX_E.per_commitment_secret),
      },
      {
        label: 'SHA256(revocation_basepoint ‖ per_commitment_point)',
        expected: 'efbf7ba5a074276701798376950a64a90f698997cce0dff4d24a6d2785d20963',
        got: d.basepointTweak,
      },
      {
        label: 'SHA256(per_commitment_point ‖ revocation_basepoint)',
        expected: 'cbcdd70fcfad15ea8e9e5c5a12365cf00912504f08ce01593689dd426bca9ff0',
        got: d.commitmentTweak,
      },
      {
        label: 'revocation_basepoint × first hash',
        expected: '02c00c4aadc536290422a807250824a8d87f19d18da9d610d45621df22510db8ce',
        got: d.basepointTerm,
      },
      {
        label: 'per_commitment_point × second hash',
        expected: '0325ee7d3323ce52c4b33d4e0a73ab637711057dd8866e3b51202a04112f054c43',
        got: d.commitmentTerm,
      },
      { label: 'revocationpubkey (the sum)', expected: APPENDIX_E.revocationpubkey, got: d.revocationPubkey },
      { label: 'revocationprivkey', expected: APPENDIX_E.revocationprivkey, got: priv },
    ].map((row) => ({ ...row, ok: row.expected === row.got }));
    setCheck({ rows, allOk: rows.every((r) => r.ok) });
  };

  const d = forged?.derivation;
  const keysMatch = !!forged?.privkeyPubkey && forged.privkeyPubkey === d?.revocationPubkey;

  return (
    <div className="cols">
      <div className="prose">
        <p>
          Act one: <strong>build the lock</strong>. Mira contributes a revocation basepoint;
          Tomas contributes the per-commitment point for the state he is currently on. Each
          half is scaled by a hash of both values — in opposite orders — and the two halves
          are added.
        </p>
        <button className="runbtn" onClick={build}>
          {forged ? '▶ Build it again' : '▶ Build the revocation key'}
        </button>
        {d && !forged?.privkey && (
          <Callout>
            <strong>Both of them can compute that public key right now.</strong> Neither of
            them can compute the matching private key. Mira is missing Tomas's per-commitment
            secret; Tomas is missing Mira's basepoint secret. The lock exists and has no key.
          </Callout>
        )}
        <p>
          Act two: <strong>Tomas buys a coffee</strong>. To move to a new balance he must
          revoke this one, and revoking means handing Mira the per-commitment secret. Watch
          what that costs him.
        </p>
        <button className="runbtn" onClick={revoke} disabled={!forged || !!forged.privkey}>
          {forged?.privkey ? '✓ Secret revealed' : '▶ Reveal the per-commitment secret'}
        </button>
        {keysMatch && (
          <Callout>
            <strong>✓ Mira now holds the private key.</strong> She combined her basepoint
            secret with the secret Tomas just handed her, and the result is the key to the
            penalty branch of every copy of that state Tomas still has. He did not sign
            anything away and he did not send her money — he simply completed her half of a
            key. From this moment, publishing that old balance would hand Mira the entire
            channel.
          </Callout>
        )}
        <p>
          Act three: <strong>don't trust this page either</strong>. BOLT #3 Appendix E
          publishes its own worked example, including every intermediate hash. Run it through
          the exact same code:
        </p>
        <button className="runbtn" onClick={runVectors}>
          {check ? '▶ Run the vectors again' : "▶ Check against the specification's vectors"}
        </button>
        {check?.allOk && (
          <Callout>
            <strong>✓ Every value matches, including the intermediates.</strong> The elliptic
            curve arithmetic and SHA-256 above are this site's own code, written from scratch
            with no cryptography library — so this is not a library agreeing with itself. It
            is the Lightning specification grading our homework, in your browser. The same
            check runs in CI on every change.
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
          <div className="viz-title">Two halves, one key</div>
          <div className="viz-sub">derivation per BOLT #3 §Key Derivation, line 817</div>
          <div className="field-rows">
            <div className="field-row">
              <span className="field-label">Mira's basepoint</span>
              <span className="field-hex">
                {d ? short(d.revocationBasepoint) : '—'}{' '}
                <span className="field-src">← her secret × G</span>
              </span>
            </div>
            <div className="field-row">
              <span className="field-label">Tomas's point</span>
              <span className="field-hex">
                {d ? short(d.commitmentPoint) : '—'}{' '}
                <span className="field-src">← this state's secret × G</span>
              </span>
            </div>
          </div>

          <div className="guess-feed">
            <div className="stat-label">SHA256(basepoint ‖ point) — scales Mira's half</div>
            <code className="guess-hex mine-target">{d ? short(d.basepointTweak) : '…'}</code>
            <div className="stat-label">SHA256(point ‖ basepoint) — scales Tomas's half</div>
            <code className="guess-hex mine-target">{d ? short(d.commitmentTweak) : '…'}</code>
            <div className="stat-label">basepoint × first hash</div>
            <code className="guess-hex mine-target">{d ? short(d.basepointTerm) : '…'}</code>
            <div className="stat-label">point × second hash</div>
            <code className="guess-hex mine-target">{d ? short(d.commitmentTerm) : '…'}</code>
            <div className="stat-label">the sum: revocationpubkey (public, in the script)</div>
            <code className={`guess-hex ${d ? 'mine-winner' : ''}`}>
              {d ? short(d.revocationPubkey) : '…'}
            </code>
          </div>

          <div className="guess-feed">
            <div className="stat-label">revocationprivkey — needs BOTH secrets</div>
            <code className={`guess-hex ${forged?.privkey ? 'mine-winner' : ''}`}>
              {forged?.privkey ? short(forged.privkey) : 'uncomputable by either party'}
            </code>
            {keysMatch && (
              <div className="guess-verdict mine-won">
                ✓ privkey × G equals the revocationpubkey above — it really is the key to
                that lock
              </div>
            )}
          </div>

          {check && (
            <div className="guess-feed">
              <div className="stat-label">BOLT #3 Appendix E, recomputed here</div>
              <div className="field-rows">
                {check.rows.map((row) => (
                  <div className="field-row" key={row.label}>
                    <span className="field-label">{row.label}</span>
                    <span className="field-hex">
                      {row.ok ? '✓ ' : '✗ '}
                      {short(row.got)}
                    </span>
                  </div>
                ))}
              </div>
              {check.allOk && (
                <div className="guess-verdict mine-won">
                  ✓ {check.rows.length} of {check.rows.length} values match the specification
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
