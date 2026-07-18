import { useEffect, useState } from 'react';
import { doubleSha256Hex } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

/** Hex digest → 256 booleans. */
function bitsOf(hex: string): boolean[] {
  const bits: boolean[] = [];
  for (const ch of hex) {
    const v = parseInt(ch, 16);
    for (let i = 3; i >= 0; i--) bits.push(((v >> i) & 1) === 1);
  }
  return bits;
}

/**
 * The avalanche: type anything, watch all 256 bits of its double SHA-256
 * reshuffle. The point a reader must feel in their fingers: one keystroke
 * flips ~half the bits, with no pattern, so a hash can only be rerolled,
 * never steered. That's the whole reason mining is a lottery.
 */
export function AvalancheGrid() {
  const [text, setText] = useState('satoshi');
  const [bits, setBits] = useState<boolean[]>([]);
  const [prevBits, setPrevBits] = useState<boolean[]>([]);
  const [flipped, setFlipped] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const digest = await doubleSha256Hex(text);
      if (cancelled) return;
      const next = bitsOf(digest);
      setBits((current) => {
        setPrevBits(current);
        setFlipped(current.length ? next.filter((b, i) => b !== current[i]).length : null);
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <VizFigure
      title="The avalanche"
      caption="Every square is one bit of this text's double SHA-256. Change a single letter and count the carnage."
    >
      <div className="avalanche">
        <label className="height-input-label">
          Hash this (try changing one letter):
          <input
            className="height-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <div className="bit-grid" aria-hidden="true">
          {bits.map((on, i) => (
            <span
              key={i}
              className={`bit ${on ? 'bit-on' : ''} ${
                prevBits.length && prevBits[i] !== on ? 'bit-flip' : ''
              }`}
            />
          ))}
        </div>
        <p className="viz-readout">
          {flipped === null
            ? '256 bits, waiting for your first edit.'
            : flipped === 0
              ? 'Same text, same 256 bits: hashing is perfectly repeatable.'
              : `Your last edit flipped ${flipped} of 256 bits (orange = changed). No pattern, no steering, just a fresh lottery ticket every time. Mining is pressing this button until the top rows come up all-dark by pure luck.`}
        </p>
      </div>
    </VizFigure>
  );
}
