import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BOLT11_EXAMPLES, decodeInvoice, formatMsat, type Bolt11Invoice } from './bolt11.js';

/**
 * BOLT #11 publishes a set of worked example invoices. We pull them out of
 * the pinned specification and decode every one, so this decoder is graded
 * against the document the site quotes rather than against itself.
 */

const BOLTS_SRC = process.env['BOLTS_SRC'];
const boltsAvailable = !!BOLTS_SRC && existsSync(BOLTS_SRC);

/** Every `> lnbc…` line in the valid-examples section of the pinned spec. */
function loadExampleInvoices(): string[] {
  const doc = readFileSync(join(BOLTS_SRC as string, '11-payment-encoding.md'), 'utf8');
  const start = doc.indexOf('# Examples');
  const end = doc.indexOf('# Examples of Invalid Invoices');
  if (start < 0 || end < 0) throw new Error('Examples section not found in the pinned BOLT #11');
  return doc
    .slice(start, end)
    .split('\n')
    .filter((line) => /^> ln[a-z0-9]+1[a-z0-9]+$/i.test(line.trim()))
    .map((line) => line.trim().slice(2));
}

const ok = (result: ReturnType<typeof decodeInvoice>): Bolt11Invoice => {
  if (!result.ok) throw new Error(`expected a valid invoice, got: ${result.error}`);
  return result;
};

describe('BOLT #11 decoding, without the spec', () => {
  it('rejects anything that is not an invoice', () => {
    expect(decodeInvoice('')).toMatchObject({ ok: false });
    expect(decodeInvoice('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toMatchObject({ ok: false });
  });

  it('catches a single mistyped character with the checksum', () => {
    const good =
      'lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27kyke0lp53ut353s06fv3qfegext0eh0ymjpf39tuven09sam30g4vgpfna3rh';
    expect(decodeInvoice(good).ok).toBe(true);
    // Flip one character in the middle of the data part.
    const broken = good.slice(0, 60) + (good[60] === 'q' ? 'p' : 'q') + good.slice(61);
    expect(decodeInvoice(broken)).toMatchObject({ ok: false });
  });

  it('formats millisatoshis without floating point', () => {
    expect(formatMsat(null)).toContain('any amount');
    expect(formatMsat(250_000_000n)).toBe('250,000 sats');
    expect(formatMsat(1_500n)).toBe('1.500 sats');
  });
});

describe.skipIf(!boltsAvailable)("BOLT #11: the specification's own example invoices", () => {
  let cached: string[] | undefined;
  const examples = () => (cached ??= loadExampleInvoices());

  it('found the worked examples in the pinned specification', () => {
    expect(examples().length).toBeGreaterThanOrEqual(8);
  });

  it('has not drifted from the examples the browser decodes', () => {
    // The finale offers a transcribed handful; this keeps them honest.
    for (const example of BOLT11_EXAMPLES) {
      expect(examples(), `"${example.label}" is no longer in the pinned spec`).toContain(
        example.invoice
      );
    }
  });

  it('decodes every published example', () => {
    for (const invoice of examples()) {
      const result = decodeInvoice(invoice);
      expect(result.ok, `${invoice.slice(0, 30)}… → ${result.ok ? '' : result.error}`).toBe(true);
    }
  });

  it('finds a payment hash in every one', () => {
    for (const invoice of examples()) {
      const decoded = ok(decodeInvoice(invoice));
      const hash = decoded.fields.find((f) => f.tag === 'p');
      expect(hash, `${invoice.slice(0, 30)}… has no payment_hash`).toBeTruthy();
      expect(hash?.value).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("reads the spec's stated payment_secret out of the invoices that carry one", () => {
    // "All invoices contain a payment_secret=1111…1111 unless otherwise noted."
    const withSecret = examples()
      .map((i) => ok(decodeInvoice(i)))
      .map((d) => d.fields.find((f) => f.tag === 's'))
      .filter((f): f is NonNullable<typeof f> => !!f);
    expect(withSecret.length).toBeGreaterThan(5);
    for (const field of withSecret) {
      expect(field.value).toBe('11'.repeat(32));
    }
  });

  it('reads the donation invoice: any amount, with the documented hash and description', () => {
    const donation = examples().find((i) => i.startsWith('lnbc1p'));
    const decoded = ok(decodeInvoice(donation as string));
    expect(decoded.amountMsat).toBeNull();
    expect(decoded.network).toBe('Bitcoin mainnet');
    expect(decoded.fields.find((f) => f.tag === 'p')?.value).toBe(
      '0001020304050607080900010203040506070809000102030405060708090102'
    );
    expect(decoded.fields.find((f) => f.tag === 'd')?.value).toBe(
      'Please consider supporting this project'
    );
  });

  it('reads the cup-of-coffee invoice: 0.0025 BTC, expiring in one minute', () => {
    const coffee = examples().find((i) => i.includes('dq5xysxxatsyp3k7enxv4js'));
    const decoded = ok(decodeInvoice(coffee as string));
    expect(decoded.hrp).toBe('lnbc2500u');
    // 0.0025 BTC = 250,000 sats = 250,000,000 msat.
    expect(decoded.amountMsat).toBe(250_000_000n);
    expect(formatMsat(decoded.amountMsat)).toBe('250,000 sats');
    expect(decoded.fields.find((f) => f.tag === 'd')?.value).toBe('1 cup coffee');
    expect(decoded.fields.find((f) => f.tag === 'x')?.value).toBe('60');
  });

  it('reads a non-ASCII description without mangling it', () => {
    const nonsense = examples().find((i) => i.includes('dpquwpc4curk03c9wlrswe78q4eyqc7d8d0'));
    const decoded = ok(decodeInvoice(nonsense as string));
    expect(decoded.fields.find((f) => f.tag === 'd')?.value).toBe('ナンセンス 1杯');
  });

  it('separates the 520-bit signature from the payload', () => {
    for (const invoice of examples()) {
      const decoded = ok(decodeInvoice(invoice));
      expect(decoded.signature).toMatch(/^[0-9a-f]{128}$/);
      expect(decoded.recoveryId).toBeGreaterThanOrEqual(0);
      expect(decoded.recoveryId).toBeLessThanOrEqual(3);
    }
  });
});
