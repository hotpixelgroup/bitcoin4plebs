import { useState } from 'react';
import {
  BOLT11_EXAMPLES,
  decodeInvoice,
  formatMsat,
  type Bolt11Invoice,
} from '@bitcoin4plebs/lightning-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

const short = (hex: string, keep = 18) =>
  hex.length > keep + 10 ? `${hex.slice(0, keep)}…${hex.slice(-8)}` : hex;

/**
 * The invoice decoder: take BOLT #11's own published examples apart field
 * by field, break one on purpose to watch the checksum catch it, or paste
 * a real invoice, everything runs locally, nothing is sent anywhere.
 */
export function InvoiceDecoder({ finale }: RunnerProps) {
  const [input, setInput] = useState(BOLT11_EXAMPLES[1].invoice);
  const result = decodeInvoice(input);
  const decoded: Bolt11Invoice | null = result.ok ? result : null;

  const breakIt = () => {
    // Flip one character in the middle of the data part.
    const i = Math.floor(input.length / 2);
    setInput(input.slice(0, i) + (input[i] === 'q' ? 'p' : 'q') + input.slice(i + 1));
  };

  return (
    <div className="cols">
      <div className="prose">
        <p>
          Pick one of the specification's own published examples, or paste any real invoice: it is decoded in this tab and never leaves your browser.
        </p>
        <div className="paths-chips" role="group" aria-label="Example invoices">
          {BOLT11_EXAMPLES.map((example) => (
            <button
              key={example.label}
              className={`preset ${input === example.invoice ? 'preset-active' : ''}`}
              onClick={() => setInput(example.invoice)}
            >
              {example.label}
            </button>
          ))}
        </div>
        <label className="stat-label" htmlFor="invoice-input">
          the invoice
        </label>
        <textarea
          id="invoice-input"
          className="seed-input"
          rows={4}
          spellCheck={false}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="runbtn" onClick={breakIt}>
          ▶ Break one character on purpose
        </button>
        {!result.ok && (
          <Callout>
            <strong>Rejected: {result.error}</strong> This is the checksum earning its keep. A
            single wrong character (a bad copy-paste, a chat client mangling a link, a typo) is
            caught here, before any money moves, rather than becoming a mystery later.
          </Callout>
        )}
        {decoded && (
          <Callout>
            <strong>
              {formatMsat(decoded.amountMsat)}
              {decoded.fields.find((f) => f.tag === 'd')
                ? ` for “${decoded.fields.find((f) => f.tag === 'd')?.value}”`
                : ''}
              .
            </strong>{' '}
            {decoded.length} characters of bech32, carrying {decoded.fields.length} tagged
            fields and a 520-bit signature over all of them. Nothing here was looked up: every
            value on the right was read out of the string itself.
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
          <div className="viz-title">The invoice, taken apart</div>
          <div className="viz-sub">fields per BOLT #11 §Tagged Fields</div>
          {decoded ? (
            <>
              <div className="field-rows">
                <div className="field-row">
                  <span className="field-label">prefix</span>
                  <span className="field-hex">
                    {decoded.hrp} <span className="field-src">← {decoded.network}</span>
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">amount</span>
                  <span className="field-hex">
                    {formatMsat(decoded.amountMsat)}
                    {decoded.amountSource && (
                      <span className="field-src"> ← written “{decoded.amountSource}”</span>
                    )}
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">timestamp</span>
                  <span className="field-hex">
                    {decoded.timestampIso} <span className="field-src">← {decoded.timestamp}</span>
                  </span>
                </div>
              </div>

              <div className="guess-feed">
                <div className="stat-label">
                  tagged fields, each one announces its own length, so unknown fields are
                  skipped rather than fatal
                </div>
                <div className="field-rows">
                  {decoded.fields.map((field, i) => (
                    <div className="field-row" key={`${field.tag}-${i}`}>
                      <span className="field-label">
                        {field.tag} · {field.name}
                      </span>
                      <span className="field-hex">
                        {short(field.value)}
                        <span className="field-src"> ← {field.note}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="guess-feed">
                <div className="stat-label">signature (512 bits) + recovery id</div>
                <code className="guess-hex mine-target">{short(decoded.signature, 40)}</code>
                <div className="guess-verdict">
                  recovery id {decoded.recoveryId}, enough to recover the payee's public key
                  from the signature, which is why most invoices omit it
                </div>
              </div>
            </>
          ) : (
            <div className="guess-feed">
              <div className="stat-label">nothing decoded</div>
              <code className="guess-hex">{result.ok ? '…' : result.error}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
