import { useState } from 'react';
import {
  BECH32_CHARSET,
  decodeSegwitAddress,
  witnessScriptPubKeyHex,
} from '@bitcoin4plebs/bitcoin-logic';
import { RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/** Textbook addresses from the BIP-173/350 specifications; nobody's wallet. */
const PRESETS = [
  { label: 'The textbook bc1q (v0)', address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' },
  { label: 'Taproot bc1p (v1)', address: 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0' },
  { label: 'Testnet tb1 (wrong network)', address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7' },
];

interface Typo {
  index: number;
  original: string;
  replacement: string;
}

/** What the witness program means in Quest #3 terms, by version + size. */
function programMeaning(version: number, length: number): string {
  if (version === 0 && length === 20) return 'the 20-byte hash of a public key: Quest #3\'s lock';
  if (version === 0 && length === 32) return 'the 32-byte hash of a script: a lock made of conditions';
  if (version === 1 && length === 32) return 'a 32-byte taproot public key (2021\'s upgrade, Quest #4)';
  return `${length} bytes of witness program`;
}

/**
 * The address-xray runner: decode any bech32 address into prefix, version,
 * program, and checksum with the real algorithm, then plant a typo on
 * command and watch the checksum from bech32.cpp catch it.
 */
export function AddressXray({ finale }: RunnerProps) {
  const [input, setInput] = useState(PRESETS[0].address);
  const [typo, setTypo] = useState<Typo | null>(null);

  const shown = typo ? input.slice(0, typo.index) + typo.replacement + input.slice(typo.index + 1) : input;
  const dec = decodeSegwitAddress(shown);
  const lower = shown.toLowerCase();
  const sep = lower.lastIndexOf('1');

  const breakIt = () => {
    const base = input.toLowerCase();
    const start = base.lastIndexOf('1') + 1;
    if (start <= 0 || start >= base.length) return;
    const index = start + Math.floor(Math.random() * (base.length - start));
    const original = base[index];
    let replacement = original;
    while (replacement === original) {
      replacement = BECH32_CHARSET[Math.floor(Math.random() * BECH32_CHARSET.length)];
    }
    setTypo({ index, original, replacement });
  };

  const setAddress = (value: string) => {
    setInput(value);
    setTypo(null);
  };

  return (
    <div className="cols">
      <div className="prose">
        <label className="height-input-label">
          Address to x-ray:
          <input
            className="height-input addr-input"
            type="text"
            spellCheck={false}
            value={input}
            onChange={(e) => setAddress(e.target.value.trim())}
          />
        </label>
        <div className="preset-row">
          {PRESETS.map((preset) => (
            <button
              key={preset.address}
              className={`preset ${input === preset.address ? 'preset-active' : ''}`}
              onClick={() => setAddress(preset.address)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <button className="runbtn" onClick={typo ? () => setTypo(null) : breakIt}>
          {typo ? '↺ Repair the address' : '▶ Plant a random typo'}
        </button>
        {typo && (
          <p className="finale-note addr-typo-note">
            Changed character {typo.index + 1} from <code>{typo.original}</code> to{' '}
            <code>{typo.replacement}</code>: one letter, like a shaky copy-paste.
          </p>
        )}
        {finale.note && (
          <p className="finale-note">
            <RichText text={finale.note} />
          </p>
        )}
      </div>
      <div>
        <div className="viz-root">
          <div className="viz-title">The x-ray</div>
          <div className="viz-sub">real bech32/bech32m decode · checksum per bech32.cpp:130</div>
          <code className="guess-hex addr-display">
            {sep > 0 ? (
              <>
                <span className="addr-hrp">{shown.slice(0, sep)}</span>
                <span className="addr-sep">{shown[sep]}</span>
                {[...shown.slice(sep + 1)].map((ch, i) => {
                  const abs = sep + 1 + i;
                  const isTypo = typo?.index === abs;
                  const isChecksum = abs >= shown.length - 6;
                  return (
                    <span
                      key={abs}
                      className={isTypo ? 'addr-typo' : isChecksum ? 'addr-check' : 'addr-data'}
                    >
                      {ch}
                    </span>
                  );
                })}
              </>
            ) : (
              shown || '…'
            )}
          </code>
          <div className="addr-legend">
            <span className="addr-hrp">prefix</span> · <span className="addr-sep">separator</span> ·{' '}
            <span className="addr-data">data</span> · <span className="addr-check">checksum</span>
            {typo && (
              <>
                {' '}
                · <span className="addr-typo">typo</span>
              </>
            )}
          </div>
          {dec.ok ? (
            <div className="field-rows">
              <div className="field-row">
                <span className="field-label">prefix</span>
                <span className="field-hex">
                  {dec.hrp}{' '}
                  <span className="field-src">
                    ←{' '}
                    {dec.hrp === 'bc'
                      ? 'mainnet (chainparams.cpp:182)'
                      : dec.hrp === 'tb'
                        ? 'testnet, so a mainnet wallet says "expected bc, got tb"'
                        : 'not a Bitcoin mainnet prefix'}
                  </span>
                </span>
              </div>
              <div className="field-row">
                <span className="field-label">version</span>
                <span className="field-hex">
                  {dec.version}{' '}
                  <span className="field-src">← spelled “{lower[sep + 1]}” in the 32-letter alphabet</span>
                </span>
              </div>
              <div className="field-row">
                <span className="field-label">program</span>
                <span className="field-hex">{dec.programHex}</span>
              </div>
              <div className="field-row">
                <span className="field-label">meaning</span>
                <span className="field-hex">
                  <span className="field-src">{programMeaning(dec.version, dec.programLength)}</span>
                </span>
              </div>
              <div className="field-row">
                <span className="field-label">checksum</span>
                <span className="field-hex">
                  {lower.slice(-6)} <span className="field-src">← {dec.encoding} · PolyMod landed exactly on target</span>
                </span>
              </div>
              <div className="field-row">
                <span className="field-label">the lock</span>
                <span className="field-hex">{witnessScriptPubKeyHex(dec.version, dec.programHex)}</span>
              </div>
            </div>
          ) : (
            <div className="field-rows">
              <div className="field-row">
                <span className="field-label">verdict</span>
                <span className="field-hex addr-invalid">✗ {dec.error}</span>
              </div>
            </div>
          )}
          <div className={`guess-verdict ${dec.ok ? 'mine-won' : 'delta-bad'}`}>
            {dec.ok
              ? '✓ checksum passes; any wallet that understands this address type would accept it'
              : '✗ rejected. No wallet will build a lock from this string, and no coins can be lost to it'}
          </div>
        </div>
      </div>
    </div>
  );
}
