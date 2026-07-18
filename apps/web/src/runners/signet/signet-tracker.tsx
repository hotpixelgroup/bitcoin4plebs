import { useState } from 'react';
import { RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/** A real, long-confirmed signet payment for readers without a txid yet. */
const SAMPLE_TXID = '3d20d2f731a47489d593408e65164df458c34299b6e1d09fcfb454f640f21d30';
const API = 'https://mempool.space/signet/api';

interface TrackResult {
  txid: string;
  confirmed: boolean;
  blockHeight?: number;
  confirmations?: number;
  feeSats?: number;
  vsize?: number;
  outputs?: number;
  totalOut?: number;
}

/**
 * The signet tracker: follow the reader's OWN transaction through
 * concepts they have already verified. Asks a public signet node
 * (mempool.space) and says so honestly; running your own node (Quest #9)
 * is the trust-free version of this exact lookup.
 */
export function SignetTracker({ finale }: RunnerProps) {
  const [txid, setTxid] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'notfound' | 'error'>('idle');
  const [result, setResult] = useState<TrackResult | null>(null);

  const track = async (id: string) => {
    const clean = id.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(clean)) {
      setState('error');
      setResult(null);
      return;
    }
    setState('loading');
    setResult(null);
    try {
      const txRes = await fetch(`${API}/tx/${clean}`);
      if (txRes.status === 404) {
        setState('notfound');
        return;
      }
      if (!txRes.ok) throw new Error(String(txRes.status));
      const tx = (await txRes.json()) as {
        fee: number;
        weight: number;
        status: { confirmed: boolean; block_height?: number };
        vout: Array<{ value: number }>;
      };
      let confirmations: number | undefined;
      if (tx.status.confirmed && tx.status.block_height) {
        const tipRes = await fetch(`${API}/blocks/tip/height`);
        if (tipRes.ok) {
          const tip = Number(await tipRes.text());
          confirmations = tip - tx.status.block_height + 1;
        }
      }
      setResult({
        txid: clean,
        confirmed: tx.status.confirmed,
        blockHeight: tx.status.block_height,
        confirmations,
        feeSats: tx.fee,
        vsize: Math.ceil(tx.weight / 4),
        outputs: tx.vout.length,
        totalOut: tx.vout.reduce((s, o) => s + o.value, 0),
      });
      setState('done');
    } catch {
      setState('error');
    }
  };

  const feerate =
    result?.feeSats !== undefined && result.vsize ? (result.feeSats / result.vsize).toFixed(1) : null;

  return (
    <div className="cols">
      <div className="prose">
        <label className="height-input-label">
          Your transaction ID (64 hex characters, from your wallet):
          <input
            className="height-input addr-input"
            type="text"
            spellCheck={false}
            placeholder="paste your txid…"
            value={txid}
            onChange={(e) => setTxid(e.target.value)}
          />
        </label>
        <div className="preset-row">
          <button className="runbtn net-btn" onClick={() => track(txid)} disabled={state === 'loading'}>
            {state === 'loading' ? 'Asking the network…' : '▶ Track my transaction'}
          </button>
          <button
            className="preset"
            onClick={() => {
              setTxid(SAMPLE_TXID);
              track(SAMPLE_TXID);
            }}
          >
            use a sample payment
          </button>
        </div>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">Your payment, in curriculum terms</div>
          <div className="viz-sub">live signet data · asked of mempool.space's node</div>
          {state === 'idle' && (
            <p className="viz-readout">
              Paste the txid your wallet showed after sending, or press the sample button to
              follow a payment that is already buried.
            </p>
          )}
          {state === 'error' && (
            <p className="viz-readout tracker-bad">
              That doesn't look like a valid txid (64 hex characters), or the network request
              failed. Check for stray spaces and try again.
            </p>
          )}
          {state === 'notfound' && (
            <p className="viz-readout">
              No signet node has seen that txid. Double-check you copied it from a wallet set to
              <strong> signet</strong> (not mainnet or another testnet), and that the send
              actually went out.
            </p>
          )}
          {state === 'done' && result && (
            <>
              <div className="field-rows">
                <div className="field-row">
                  <span className="field-label">status</span>
                  <span className="field-hex">
                    {result.confirmed ? (
                      <span className="chain-ok">
                        ✓ mined into block {result.blockHeight?.toLocaleString('en-US')}
                      </span>
                    ) : (
                      <span><span aria-hidden="true">⏳</span> in the waiting room (the mempool, Quest #7)</span>
                    )}
                  </span>
                </div>
                {result.confirmed && result.confirmations !== undefined && (
                  <div className="field-row">
                    <span className="field-label">buried under</span>
                    <span className="field-hex">
                      {result.confirmations.toLocaleString('en-US')} confirmation
                      {result.confirmations === 1 ? '' : 's'}{' '}
                      <span className="field-src">
                        ← each one is a block of proof-of-work on top (Quest #7)
                      </span>
                    </span>
                  </div>
                )}
                <div className="field-row">
                  <span className="field-label">boxes made</span>
                  <span className="field-hex">
                    {result.outputs}{' '}
                    <span className="field-src">← new locked outputs, Quest #3's boxes</span>
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">your bid</span>
                  <span className="field-hex">
                    {result.feeSats?.toLocaleString('en-US')} sats
                    {feerate && ` (${feerate} sat/vB)`}{' '}
                    <span className="field-src">← the fee auction from Quest #7</span>
                  </span>
                </div>
              </div>
              <p className="viz-readout">
                {result.confirmed
                  ? `This is the whole curriculum in one artifact: your wallet destroyed old boxes and made ${result.outputs} new one${result.outputs === 1 ? '' : 's'}, proved ownership with a signature, bid ${feerate} sat/vB in the auction, and a miner's winning lottery ticket sealed it into block ${result.blockHeight?.toLocaleString('en-US')}. Every machine on the signet network re-checked all of it. Yours now, forever.`
                  : 'Your payment passed every node\'s AcceptToMemoryPool gauntlet and is gossiping across the network, waiting for the auction to reach your bid. Refresh in a minute or two; signet blocks arrive about every ten minutes.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
