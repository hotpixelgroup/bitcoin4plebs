import { useCallback, useState } from 'react';
import {
  BIP39_WORDLIST_EN,
  bytesToHex,
  entropyToMnemonic,
  mnemonicToSeed,
  validateMnemonic,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

/**
 * The seed studio: mint real BIP-39 practice phrases from the browser's
 * own entropy, derive the PBKDF2 seed, then break the checksum on
 * purpose. Everything runs locally via WebCrypto; nothing is stored or
 * sent, and the studio never accepts an existing phrase as input, which
 * is itself lesson one.
 */
export function SeedStudio({ finale }: RunnerProps) {
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [words, setWords] = useState<string[]>([]);
  const [original, setOriginal] = useState<string[]>([]);
  const [tampered, setTampered] = useState<number | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [seedHex, setSeedHex] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);

  const deriveSeed = useCallback(async (phrase: string[], pass: string) => {
    const seed = await mnemonicToSeed(phrase, pass);
    setSeedHex(bytesToHex(seed));
  }, []);

  const roll = useCallback(async () => {
    setBusy(true);
    const entropy = new Uint8Array(wordCount === 12 ? 16 : 32);
    crypto.getRandomValues(entropy);
    const phrase = await entropyToMnemonic(entropy);
    setWords(phrase);
    setOriginal(phrase);
    setTampered(null);
    setValid(true);
    await deriveSeed(phrase, passphrase);
    setBusy(false);
  }, [wordCount, passphrase, deriveSeed]);

  const breakOne = useCallback(async () => {
    if (original.length === 0) return;
    const index = Math.floor(Math.random() * original.length);
    let replacement = original[index];
    while (replacement === original[index]) {
      replacement = BIP39_WORDLIST_EN[Math.floor(Math.random() * BIP39_WORDLIST_EN.length)];
    }
    const broken = [...original];
    broken[index] = replacement;
    setWords(broken);
    setTampered(index);
    setValid(await validateMnemonic(broken));
    setSeedHex(null);
  }, [original]);

  const repair = useCallback(async () => {
    setWords(original);
    setTampered(null);
    setValid(true);
    await deriveSeed(original, passphrase);
  }, [original, passphrase, deriveSeed]);

  const onPassphrase = useCallback(
    async (value: string) => {
      setPassphrase(value);
      if (original.length > 0 && tampered === null) {
        await deriveSeed(original, value);
      }
    },
    [original, tampered, deriveSeed]
  );

  return (
    <div className="seed">
      <Callout>
        <strong>Practice phrases only.</strong>{' '}
        <RichText text="Everything below is generated fresh, locally, by your browser's cryptography, and goes nowhere. This studio will **never ask for an existing seed phrase**, and neither will anything honest. For real funds, generate on a dedicated offline device, not in any browser." />
      </Callout>

      <div className="seed-controls">
        <div className="stress-chips" role="group" aria-label="Phrase length">
          {([12, 24] as const).map((n) => (
            <button
              key={n}
              className={`preset ${wordCount === n ? 'preset-active' : ''}`}
              aria-pressed={wordCount === n}
              onClick={() => setWordCount(n)}
            >
              {n} words ({n === 12 ? '128' : '256'} bits)
            </button>
          ))}
        </div>
        <button className="runbtn" onClick={() => void roll()} disabled={busy}>
          {words.length === 0 ? 'flip the coins' : 'flip again'}
        </button>
      </div>

      {words.length > 0 && (
        <>
          <ol className="seed-grid" aria-label="Generated practice phrase">
            {words.map((word, i) => (
              <li key={i} className={`seed-word ${tampered === i ? 'seed-word-bad' : ''}`}>
                <span className="seed-word-num">{i + 1}</span>
                {word}
              </li>
            ))}
          </ol>

          <div
            className={`seed-check ${valid ? 'seed-check-ok' : 'seed-check-bad'}`}
            role="status"
            aria-live="polite"
          >
            {valid
              ? 'checksum ✓ · the final word agrees with all the others (SHA-256, as the BIP specifies)'
              : `checksum ✕ · word ${(tampered ?? 0) + 1} was changed, and the arithmetic refuses to add up. Honest software stops here.`}
          </div>

          <div className="seed-actions">
            {tampered === null ? (
              <button className="preset" onClick={() => void breakOne()}>
                break it: swap one word
              </button>
            ) : (
              <button className="preset" onClick={() => void repair()}>
                repair the phrase
              </button>
            )}
            <label className="seed-pass">
              optional passphrase (the 25th word)
              <input
                type="text"
                value={passphrase}
                onChange={(e) => void onPassphrase(e.target.value)}
                placeholder="empty is also a wallet"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </div>

          {seedHex && (
            <div className="seed-out">
              <div className="stat-label">
                the 64-byte seed (PBKDF2 · 2,048 rounds of HMAC-SHA512
                {passphrase ? ' · with your passphrase' : ''})
              </div>
              <code className="seed-hex">{seedHex}</code>
              <p className="seed-note">
                Every key this phrase will ever control derives from this number. Change the
                passphrase by one letter and watch it become a completely different number, which
                is a completely different wallet.
              </p>
            </div>
          )}
        </>
      )}

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
