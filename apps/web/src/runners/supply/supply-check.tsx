import { useState } from 'react';
import {
  btcToSats,
  formatHeight,
  getBlockSubsidy,
  satsToBtc,
  supplyThroughBlock,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/** Handy heights: the story so far, plus the release's own reviewed checkpoint. */
const PRESETS = [
  { label: 'Genesis (0)', height: 0 },
  { label: 'Last 50 BTC block (209,999)', height: 209_999 },
  { label: 'Reviewed checkpoint (938,343)', height: 938_343 },
  { label: 'Final subsidy block (6,929,999)', height: 6_929_999 },
];

/**
 * The supply-check runner: Quest #1's schedule computed to exact satoshis
 * at any height, side by side with the reader's own node's gettxoutsetinfo
 * measurement. Schedule minus measurement = the destroyed coins the node
 * itemizes — never a negative number, or Quest #1's check was a lie.
 */
export function SupplyCheck({ finale }: RunnerProps) {
  const [heightText, setHeightText] = useState('938343');
  const [reportedText, setReportedText] = useState('');

  const parsedHeight = Number.parseInt(heightText.replace(/,/g, ''), 10);
  const height = Number.isFinite(parsedHeight) && parsedHeight >= 0 ? parsedHeight : null;

  const scheduleSats = height !== null ? supplyThroughBlock(height) : null;
  const subsidySats = height !== null ? getBlockSubsidy(height) : null;
  const reportedSats = reportedText.trim() ? btcToSats(reportedText) : null;
  const delta =
    scheduleSats !== null && reportedSats !== null ? scheduleSats - reportedSats : null;

  return (
    <div className="cols">
      <div className="prose">
        <p>
          On a synced node, this is the whole ceremony — one command, answered from your own
          disk:
        </p>
        <pre className="cmd-card">{`$ bitcoin-cli gettxoutsetinfo
{
  "height":       ${height !== null ? height : '…'},
  "txouts":       …,
  "total_amount": ← paste this below
}`}</pre>
        <label className="height-input-label">
          Block height to audit:
          <input
            className="height-input"
            type="text"
            inputMode="numeric"
            value={heightText}
            onChange={(e) => setHeightText(e.target.value)}
          />
        </label>
        <div className="preset-row">
          {PRESETS.map((preset) => (
            <button
              key={preset.height}
              className={`preset ${height === preset.height ? 'preset-active' : ''}`}
              onClick={() => setHeightText(String(preset.height))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <label className="height-input-label">
          Your node's <code>total_amount</code> at that height (optional):
          <input
            className="height-input"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 19994825.30930052"
            value={reportedText}
            onChange={(e) => setReportedText(e.target.value)}
          />
        </label>
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">The audit</div>
          <div className="viz-sub">
            schedule: GetBlockSubsidy summed for blocks 0…{height !== null ? formatHeight(height) : '…'} ·
            exact integer arithmetic
          </div>
          {height === null ? (
            <Callout>Enter a block height (a whole number, 0 or above) to run the schedule.</Callout>
          ) : (
            <>
              <div className="hero-num">
                {satsToBtc(scheduleSats as bigint)} <span className="hero-unit">BTC</span>
              </div>
              <div className="hero-cap">
                = {(scheduleSats as bigint).toLocaleString('en-US')} satoshis the schedule
                permits to exist after block {formatHeight(height)} · block subsidy there:{' '}
                {satsToBtc(subsidySats as bigint)} BTC
              </div>
              <div className="guess-feed">
                <div className="stat-label">your node's measurement</div>
                {reportedText.trim() === '' ? (
                  <div className="guess-verdict">
                    No node yet? This number is the prediction to hold it to. When your sync
                    finishes, paste <code>total_amount</code> here and close the loop.
                  </div>
                ) : reportedSats === null ? (
                  <div className="guess-verdict">
                    That doesn't parse as a BTC amount — digits and up to 8 decimals, e.g.{' '}
                    <code>19994825.30930052</code>.
                  </div>
                ) : (
                  <>
                    <code className="guess-hex">{satsToBtc(reportedSats)} BTC</code>
                    {(delta as bigint) >= 0n ? (
                      <div className="guess-verdict mine-won">
                        ✓ {satsToBtc(delta as bigint)} BTC <em>under</em> the schedule — coins
                        destroyed or never claimed (Satoshi's frozen 50 BTC among them). Your
                        node itemizes them as <code>total_unspendable_amount</code>. No hidden
                        inflation: measurement ≤ schedule, exactly as Quest #1's check
                        guarantees.
                      </div>
                    ) : (
                      <div className="guess-verdict delta-bad">
                        ✗ {satsToBtc(-(delta as bigint))} BTC <em>over</em> the schedule —
                        that's impossible under the bad-cb-amount check every node runs. First
                        suspect: the height above doesn't match the height your node reported.
                        Make the two match and compare again.
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
