import { useState } from 'react';
import {
  GENESIS_BITS,
  GENESIS_COINBASE_SCRIPTSIG_HEX,
  GENESIS_HASH,
  GENESIS_MERKLE_ROOT,
  GENESIS_NONCE,
  GENESIS_TIME,
  GENESIS_VERSION,
  buildGenesisHeaderHex,
  decodeCoinbaseMessage,
  decodeScriptPushes,
  doubleSha256Hex,
  hexToBytes,
  reverseHexBytes,
  uint32ToLeHex,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

interface HashResult {
  header: string;
  rawDigest: string;
  display: string;
}

/** The six header fields, each shown with its chainparams value and its serialized bytes. */
const FIELDS = [
  { label: 'nVersion', source: '1', hex: uint32ToLeHex(GENESIS_VERSION) },
  { label: 'hashPrevBlock', source: 'SetNull() — no parent', hex: '00'.repeat(32) },
  { label: 'hashMerkleRoot', source: '4a5e1e…eda33b, flipped', hex: reverseHexBytes(GENESIS_MERKLE_ROOT) },
  { label: 'nTime', source: '1231006505', hex: uint32ToLeHex(GENESIS_TIME) },
  { label: 'nBits', source: '0x1d00ffff', hex: uint32ToLeHex(GENESIS_BITS) },
  { label: 'nNonce', source: '2083236893', hex: uint32ToLeHex(GENESIS_NONCE) },
];

/**
 * The genesis-hash runner: rebuild block zero's 80-byte header from the
 * four chainparams.cpp numbers, double SHA-256 it with WebCrypto, and
 * compare against the hash every node asserts at startup. Second act:
 * decode the Times headline straight out of the coinbase bytes.
 */
export function GenesisHash({ finale }: RunnerProps) {
  const [result, setResult] = useState<HashResult | null>(null);
  const [decoded, setDecoded] = useState(false);

  const run = async () => {
    const header = buildGenesisHeaderHex();
    const rawDigest = await doubleSha256Hex(hexToBytes(header));
    setResult({ header, rawDigest, display: reverseHexBytes(rawDigest) });
  };

  const matched = result?.display === GENESIS_HASH;
  const pushes = decodeScriptPushes(GENESIS_COINBASE_SCRIPTSIG_HEX);
  const headline = decodeCoinbaseMessage(GENESIS_COINBASE_SCRIPTSIG_HEX);

  return (
    <div className="cols">
      <div className="prose">
        <p>
          Act one: the header. The six fields from Stop 2 are laid out on the right, each
          serialized to <strong>little-endian</strong> bytes — Bitcoin writes its numbers
          "backwards," least significant byte first. Concatenate them and exactly 80 bytes
          fall out.
        </p>
        <button className="runbtn" onClick={run}>
          {result ? '▶ Hash it again' : '▶ Assemble & hash the header'}
        </button>
        {matched && (
          <Callout>
            <strong>✓ Match.</strong> Your machine assembled 80 bytes from four numbers printed
            in <code>chainparams.cpp</code>, ran SHA-256 twice, flipped the byte order — and
            landed on the exact hash asserted at line 160. Seventeen years, hundreds of Core
            releases, and not one byte of block zero has drifted. You didn't look that up;
            you <em>computed</em> it.
          </Callout>
        )}
        <p>
          Act two: the message. Stop 4's raw coinbase bytes end with a 69-byte push. Decode it
          as plain ASCII:
        </p>
        <button className="runbtn" onClick={() => setDecoded(true)} disabled={decoded}>
          {decoded ? '✓ Headline decoded' : '▶ Decode the headline from the coinbase'}
        </button>
        {decoded && (
          <Callout>
            <strong>“{headline}”</strong> — The Times, 3 January 2009. Straight out of the
            bytes, no archive required. Your future node will keep these 69 bytes, and the
            proof they carry, for as long as it runs.
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
          <div className="viz-title">Block zero, reassembled in this tab</div>
          <div className="viz-sub">
            fields from chainparams.cpp:158 · serialization per CBlockHeader
          </div>
          <div className="field-rows">
            {FIELDS.map((field) => (
              <div className="field-row" key={field.label}>
                <span className="field-label">{field.label}</span>
                <span className="field-hex">
                  {field.hex} <span className="field-src">← {field.source}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="guess-feed">
            <div className="stat-label">the 80-byte header (160 hex characters)</div>
            <code className="guess-hex mine-target">
              {result ? result.header : 'press ▶ to concatenate the six fields'}
            </code>
            <div className="stat-label">SHA-256(SHA-256(header)) — raw digest</div>
            <code className="guess-hex mine-target">
              {result ? result.rawDigest : '…'}
            </code>
            <div className="stat-label">byte order flipped — display form</div>
            <code className={`guess-hex ${matched ? 'mine-winner' : ''}`}>
              {result ? result.display : '…'}
            </code>
            {matched && (
              <div className="guess-verdict mine-won">
                ✓ equals the assert at chainparams.cpp:160 — the most famous hash on Earth,
                recomputed locally
              </div>
            )}
          </div>
          {decoded && (
            <div className="guess-feed">
              <div className="stat-label">coinbase scriptSig — three pushes</div>
              <div className="field-rows">
                <div className="field-row">
                  <span className="field-label">push 1</span>
                  <span className="field-hex">
                    {pushes[0]} <span className="field-src">← 0x1d00ffff, the difficulty bits</span>
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">push 2</span>
                  <span className="field-hex">
                    {pushes[1]} <span className="field-src">← the number 4</span>
                  </span>
                </div>
                <div className="field-row">
                  <span className="field-label">push 3</span>
                  <span className="field-hex">{pushes[2]}</span>
                </div>
              </div>
              <div className="stat-label">push 3, read as ASCII</div>
              <code className="guess-hex mine-winner">{headline}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
