/**
 * The size of Bitcoin's private-key space: the order of the secp256k1
 * curve. Any 256-bit number below this is a valid private key.
 */
export const SECP256K1_ORDER =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

const SECONDS_PER_YEAR = 31_557_600n; // 365.25 days

/**
 * Expected years to find one specific key by brute force at a given guess
 * rate (on average you search half the space). Exact BigInt arithmetic.
 */
export function expectedYearsToCrack(guessesPerSecond: bigint): bigint {
  return SECP256K1_ORDER / 2n / guessesPerSecond / SECONDS_PER_YEAR;
}

/** Age of the universe, for scale: ~13.8 billion years. */
export const AGE_OF_UNIVERSE_YEARS = 13_800_000_000n;

/**
 * Format a huge BigInt as "d.dd × 10^n" for humans. Exact input,
 * approximate display.
 */
export function formatBigApprox(value: bigint): string {
  const s = value.toString();
  if (s.length <= 6) return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const exponent = s.length - 1;
  const mantissa = `${s[0]}.${s.slice(1, 3)}`;
  return `${mantissa} × 10^${exponent}`;
}
