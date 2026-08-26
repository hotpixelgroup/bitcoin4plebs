import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APPENDIX_E,
  derivePrivkey,
  derivePubkey,
  deriveRevocationPrivkey,
  deriveRevocationPubkey,
  perCommitmentPoint,
} from './keys.js';
import { compress, publicKey } from './secp256k1.js';

/**
 * BOLT #3 Appendix E ships key-derivation vectors including every
 * intermediate hash. We read them straight out of the pinned specification
 * rather than copying them here, so this test can never drift from the
 * document the site quotes.
 */

const BOLTS_SRC = process.env['BOLTS_SRC'];
const boltsAvailable = !!BOLTS_SRC && existsSync(BOLTS_SRC);

/** Pull the `name: 0xdeadbeef` lines out of Appendix E. */
function loadAppendixE(): Record<string, string> {
  const doc = readFileSync(join(BOLTS_SRC as string, '03-transactions.md'), 'utf8');
  const start = doc.indexOf('# Appendix E: Key Derivation Test Vectors');
  const end = doc.indexOf('# Appendix F', start);
  if (start < 0 || end < 0) throw new Error('Appendix E not found in the pinned BOLT #3');
  const values: Record<string, string> = {};
  for (const line of doc.slice(start, end).split('\n')) {
    const match = /^\s+([a-z_]+):\s*0x([0-9a-f]+)\s*$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

describe('BOLT #3 revocation, without the spec', () => {
  it('builds a revocation key neither side can build alone', async () => {
    // The security claim in one test: two independent secrets, and the
    // private key only exists once one party hands its half to the other.
    const basepointSecret = '11'.repeat(32);
    const commitmentSecret = '22'.repeat(32);
    const basepoint = compress(publicKey(BigInt('0x' + basepointSecret)));
    const point = perCommitmentPoint(commitmentSecret);

    const derived = await deriveRevocationPubkey(basepoint, point);
    const privkey = await deriveRevocationPrivkey(basepointSecret, commitmentSecret);

    // The public key built from two points equals the private key's own
    // public key — the two halves really do meet.
    expect(compress(publicKey(BigInt('0x' + privkey)))).toBe(derived.revocationPubkey);
    // And it is genuinely a blend: neither input alone produces it.
    expect(derived.revocationPubkey).not.toBe(basepoint);
    expect(derived.revocationPubkey).not.toBe(point);
    expect(derived.basepointTerm).not.toBe(derived.commitmentTerm);
  });
});

describe.skipIf(!boltsAvailable)("BOLT #3 Appendix E: the specification's own key vectors", () => {
  let cached: Record<string, string> | undefined;
  const vectors = () => (cached ??= loadAppendixE());

  it('has not drifted from the specification it was transcribed from', () => {
    // The browser runner uses the transcribed copy; this is what keeps it
    // honest. Any edit to either side, or a re-pin of the BOLTs, fails here.
    expect(vectors()).toMatchObject(APPENDIX_E);
  });

  it('found the vectors in the pinned specification', () => {
    const v = vectors();
    for (const key of [
      'base_secret',
      'per_commitment_secret',
      'base_point',
      'per_commitment_point',
      'localpubkey',
      'localprivkey',
      'revocationpubkey',
      'revocationprivkey',
    ]) {
      expect(v[key], `Appendix E is missing ${key}`).toMatch(/^[0-9a-f]{64,66}$/);
    }
  });

  it('derives the per-commitment point from its secret', () => {
    const v = vectors();
    expect(perCommitmentPoint(v['per_commitment_secret'])).toBe(v['per_commitment_point']);
  });

  it('derives localpubkey from the basepoint and the per-commitment point', async () => {
    const v = vectors();
    expect(await derivePubkey(v['base_point'], v['per_commitment_point'])).toBe(v['localpubkey']);
  });

  it('derives localprivkey from the basepoint secret', async () => {
    const v = vectors();
    expect(await derivePrivkey(v['base_secret'], v['per_commitment_point'])).toBe(
      v['localprivkey']
    );
  });

  it('derives the revocation pubkey, matching every intermediate value', async () => {
    const v = vectors();
    const d = await deriveRevocationPubkey(v['base_point'], v['per_commitment_point']);
    // The spec spells out both hashes and both scaled points in its own
    // commentary; check the work, not just the answer.
    expect(d.basepointTweak).toBe(
      'efbf7ba5a074276701798376950a64a90f698997cce0dff4d24a6d2785d20963'
    );
    expect(d.commitmentTweak).toBe(
      'cbcdd70fcfad15ea8e9e5c5a12365cf00912504f08ce01593689dd426bca9ff0'
    );
    expect(d.basepointTerm).toBe(
      '02c00c4aadc536290422a807250824a8d87f19d18da9d610d45621df22510db8ce'
    );
    expect(d.commitmentTerm).toBe(
      '0325ee7d3323ce52c4b33d4e0a73ab637711057dd8866e3b51202a04112f054c43'
    );
    expect(d.revocationPubkey).toBe(v['revocationpubkey']);
  });

  it('derives the revocation private key once both secrets are in one hand', async () => {
    const v = vectors();
    const privkey = await deriveRevocationPrivkey(v['base_secret'], v['per_commitment_secret']);
    expect(privkey).toBe(v['revocationprivkey']);
    // ...and it really is the key to that lock.
    expect(compress(publicKey(BigInt('0x' + privkey)))).toBe(v['revocationpubkey']);
  });
});
