import { COIN } from './constants.js';

/**
 * Exact BigInt satoshis → human BTC string (no floating point, ever).
 *
 * @param sats  amount in satoshis
 * @param maxDecimals  optionally truncate the fractional part (e.g. 4 → "20,999,999.9769")
 */
export function satsToBtc(sats: bigint, maxDecimals?: number): string {
  const negative = sats < 0n;
  const abs = negative ? -sats : sats;
  const whole = abs / COIN;
  let frac = (abs % COIN).toString().padStart(8, '0');
  if (maxDecimals !== undefined) frac = frac.slice(0, maxDecimals);
  frac = frac.replace(/0+$/, '');
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${wholeStr}${frac ? '.' + frac : ''}`;
}

/** Format a block height with thousands separators. */
export function formatHeight(height: number): string {
  return height.toLocaleString('en-US');
}

/**
 * Parse a human BTC amount (e.g. "19,994,825.30930052") into exact
 * satoshis. Accepts commas and up to 8 decimal places; returns null when
 * the text isn't a valid amount. No floating point, ever.
 */
export function btcToSats(text: string): bigint | null {
  const cleaned = text.trim().replace(/,/g, '');
  const match = /^(\d+)(?:\.(\d{0,8}))?$/.exec(cleaned);
  if (!match) return null;
  const whole = BigInt(match[1]);
  const frac = BigInt((match[2] ?? '').padEnd(8, '0') || '0');
  return whole * COIN + frac;
}
