import { useState } from 'react';
import { VizFigure } from './viz-figure';

/** The parts of an invoice, in the order they appear in the string. */
const PARTS = [
  {
    id: 'prefix',
    label: 'lnbc',
    kind: 'prefix',
    what: 'Which network',
    detail: 'ln for Lightning, bc for Bitcoin mainnet. A testnet invoice says lntb instead.',
  },
  {
    id: 'amount',
    label: '2500u',
    kind: 'amount',
    what: 'How much',
    detail: '2500 micro-bitcoin — 0.0025 BTC, or 250,000 sats. Leave it out entirely and the payer chooses.',
  },
  {
    id: 'sep',
    label: '1',
    kind: 'sep',
    what: 'The separator',
    detail: 'Everything before this is human-readable; everything after is the checksummed data part.',
  },
  {
    id: 'timestamp',
    label: 'pvjluez',
    kind: 'field',
    what: 'When it was made',
    detail: 'Seconds since 1970, in 35 bits. The expiry is counted from here.',
  },
  {
    id: 'payhash',
    label: 'pp5…',
    kind: 'hash',
    what: 'The payment hash',
    detail: 'The hash of a secret only the payee knows. Paying is what makes them reveal it — and that secret is your receipt.',
  },
  {
    id: 'desc',
    label: 'dq5…',
    kind: 'field',
    what: 'What it is for',
    detail: 'Plain UTF-8 text: "1 cup coffee". Committed to by the signature, so nobody can alter it in transit.',
  },
  {
    id: 'expiry',
    label: 'xqzpu',
    kind: 'field',
    what: 'How long it lasts',
    detail: 'Seconds until it stops being payable. One hour if the field is omitted.',
  },
  {
    id: 'sig',
    label: '9qrsgq…',
    kind: 'sig',
    what: 'The signature',
    detail: '512 bits over everything above, plus a recovery byte — which is how the payer learns the payee’s node id without it being written out.',
  },
];

/**
 * The invoice anatomy figure: tap any part of a real lnbc string and find
 * out what it is. The point is that the wall of characters is structured,
 * ordered and readable, not a hash of something.
 */
export function InvoiceAnatomy() {
  const [active, setActive] = useState<string>('payhash');
  const part = PARTS.find((p) => p.id === active) ?? PARTS[0];

  return (
    <VizFigure
      title="Anatomy of an invoice"
      caption="Tap any piece of this real invoice to find out what it is. It is a document, not a hash."
    >
      <div className="paths-chips" role="group" aria-label="Parts of the invoice">
        {PARTS.map((p) => (
          <button
            key={p.id}
            className={`preset ${p.id === active ? 'preset-active' : ''}`}
            aria-pressed={p.id === active}
            onClick={() => setActive(p.id)}
            style={{ fontFamily: 'var(--mono)' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="viz-readout">
        <div className="stat-label">{part.what}</div>
        <div className="stat">
          <span className="stat-value" style={{ fontFamily: 'var(--mono)', fontSize: 20 }}>
            {part.label}
          </span>
        </div>
        <span className="stat-unit">{part.detail}</span>
      </div>

      <p className="utxo-box-note">
        Read left to right and an invoice tells a small story: on this network, for this much,
        made at this moment, for this purpose, redeemable by whoever learns this secret, until
        this deadline — signed. The finale below decodes the whole thing for real.
      </p>
    </VizFigure>
  );
}
