import { bytesToHex, hexToBytes } from '@bitcoin4plebs/bitcoin-logic';
import { concatBytes, sha256 } from './crypto.js';
import { add, compress, decompress, mod, multiply, publicKey, G, N } from './secp256k1.js';

/**
 * BOLT #3 key derivation: the machinery that makes cheating unprofitable.
 *
 * Every commitment gets fresh keys, derived from a per-commitment point.
 * The interesting one is the REVOCATION key, and it is worth reading the
 * formula slowly because it is the whole security model in one line:
 *
 *   revocationpubkey = revocation_basepoint * SHA256(revocation_basepoint || per_commitment_point)
 *                    + per_commitment_point * SHA256(per_commitment_point || revocation_basepoint)
 *
 * Two people contribute one half each. Neither can compute the private key
 * alone, the spec says so in as many words, but the moment one of them
 * hands over their per-commitment secret (which is exactly what accepting a
 * new balance costs), the other can. That is why an old channel state is
 * radioactive: publishing one is handing your counterparty your money.
 *
 * Checked against the specification's own Appendix E vectors in keys.spec.ts.
 */

/** The point for a per-commitment secret: secret · G. */
export function perCommitmentPoint(secret: string): string {
  return compress(publicKey(BigInt('0x' + secret)));
}

/**
 * The ordinary derivation shared by localpubkey, the HTLC keys and the
 * delayed keys:  pubkey = basepoint + SHA256(per_commitment_point || basepoint) · G
 */
export async function derivePubkey(
  basepoint: string,
  commitmentPoint: string
): Promise<string> {
  const tweak = await sha256(concatBytes(hexToBytes(commitmentPoint), hexToBytes(basepoint)));
  const point = add(decompress(basepoint), multiply(G, BigInt('0x' + bytesToHex(tweak))));
  if (!point) throw new Error('degenerate pubkey derivation');
  return compress(point);
}

/** The same derivation on the private side: privkey = basepoint_secret + SHA256(...) */
export async function derivePrivkey(
  basepointSecret: string,
  commitmentPoint: string
): Promise<string> {
  const basepoint = compress(publicKey(BigInt('0x' + basepointSecret)));
  const tweak = await sha256(concatBytes(hexToBytes(commitmentPoint), hexToBytes(basepoint)));
  const key = mod(BigInt('0x' + basepointSecret) + BigInt('0x' + bytesToHex(tweak)), N);
  return key.toString(16).padStart(64, '0');
}

/**
 * Every step of the revocation pubkey derivation, kept separate so a reader
 * can watch the two halves being built and then meet. The field names match
 * the spec's own commentary in Appendix E line for line.
 */
export interface RevocationDerivation {
  revocationBasepoint: string;
  commitmentPoint: string;
  /** SHA256(revocation_basepoint || per_commitment_point) */
  basepointTweak: string;
  /** SHA256(per_commitment_point || revocation_basepoint) */
  commitmentTweak: string;
  /** revocation_basepoint · basepointTweak: the half only your counterparty can build. */
  basepointTerm: string;
  /** per_commitment_point · commitmentTweak: the half only you can build. */
  commitmentTerm: string;
  /** The sum: the key that guards the penalty branch. */
  revocationPubkey: string;
}

/** Derive the revocation pubkey, showing the work. */
export async function deriveRevocationPubkey(
  revocationBasepoint: string,
  commitmentPoint: string
): Promise<RevocationDerivation> {
  const basepointTweak = bytesToHex(
    await sha256(concatBytes(hexToBytes(revocationBasepoint), hexToBytes(commitmentPoint)))
  );
  const commitmentTweak = bytesToHex(
    await sha256(concatBytes(hexToBytes(commitmentPoint), hexToBytes(revocationBasepoint)))
  );

  const basepointTerm = multiply(decompress(revocationBasepoint), BigInt('0x' + basepointTweak));
  const commitmentTerm = multiply(decompress(commitmentPoint), BigInt('0x' + commitmentTweak));
  const sum = add(basepointTerm, commitmentTerm);
  if (!basepointTerm || !commitmentTerm || !sum) {
    throw new Error('degenerate revocation derivation');
  }

  return {
    revocationBasepoint,
    commitmentPoint,
    basepointTweak,
    commitmentTweak,
    basepointTerm: compress(basepointTerm),
    commitmentTerm: compress(commitmentTerm),
    revocationPubkey: compress(sum),
  };
}

/**
 * The private key, which exists only once BOTH secrets are in one pair of
 * hands. Until your counterparty revokes a state by handing over its
 * per-commitment secret, this is uncomputable, by either of you.
 */
export async function deriveRevocationPrivkey(
  revocationBasepointSecret: string,
  commitmentSecret: string
): Promise<string> {
  const revocationBasepoint = compress(publicKey(BigInt('0x' + revocationBasepointSecret)));
  const commitmentPoint = perCommitmentPoint(commitmentSecret);

  const basepointTweak = bytesToHex(
    await sha256(concatBytes(hexToBytes(revocationBasepoint), hexToBytes(commitmentPoint)))
  );
  const commitmentTweak = bytesToHex(
    await sha256(concatBytes(hexToBytes(commitmentPoint), hexToBytes(revocationBasepoint)))
  );

  const key = mod(
    BigInt('0x' + revocationBasepointSecret) * BigInt('0x' + basepointTweak) +
      BigInt('0x' + commitmentSecret) * BigInt('0x' + commitmentTweak),
    N
  );
  return key.toString(16).padStart(64, '0');
}

/**
 * BOLT #3 Appendix E's key-derivation vectors, transcribed so the browser
 * can check our arithmetic without a network fetch.
 *
 * Transcribed is not the same as trusted: keys.spec.ts re-reads Appendix E
 * out of the PINNED specification and fails if a single character here has
 * drifted. So the numbers a reader checks in the browser are provably the
 * specification's own.
 */
export const APPENDIX_E = {
  base_secret: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
  per_commitment_secret: '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100',
  base_point: '036d6caac248af96f6afa7f904f550253a0f3ef3f5aa2fe6838a95b216691468e2',
  per_commitment_point: '025f7117a78150fe2ef97db7cfc83bd57b2e2c0d0dd25eaf467a4a1c2a45ce1486',
  localpubkey: '0235f2dbfaa89b57ec7b055afe29849ef7ddfeb1cefdb9ebdc43f5494984db29e5',
  localprivkey: 'cbced912d3b21bf196a766651e436aff192362621ce317704ea2f75d87e7be0f',
  revocationpubkey: '02916e326636d19c33f13e8c0c3a03dd157f332f3e99c317c141dd865eb01f8ff0',
  revocationprivkey: 'd09ffff62ddb2297ab000cc85bcb4283fdeb6aa052affbc9dddcf33b61078110',
} as const;
