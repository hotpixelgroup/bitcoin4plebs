/**
 * secp256k1, the curve Bitcoin and Lightning both stand on, written out
 * in exact BigInt arithmetic with no dependencies.
 *
 * Why hand-rolled? Because this site's promise is that you can read every
 * line that touches your understanding. A curve library would be a box you
 * have to trust. This is ~100 lines of school algebra you can check.
 *
 * Don't trust it either: the sphinx test in this package reproduces the
 * Lightning specification's own onion test vector byte for byte, and that
 * vector only comes out right if everything below is exactly correct.
 *
 * This is deliberately the SIMPLE formulation (affine coordinates, a
 * modular inverse per step) rather than the fast one. It is fast enough
 * for a browser building a five-hop onion, and it is readable.
 */

/** The prime the field is built on: 2^256 - 2^32 - 977. */
export const P = 2n ** 256n - 2n ** 32n - 977n;

/** The order of the group — how many distinct private keys exist. */
export const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/** A point on the curve. `null` elsewhere means the point at infinity. */
export interface Point {
  x: bigint;
  y: bigint;
}

/** The generator point G, the agreed-upon starting place for everyone. */
export const G: Point = {
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
};

/** Always-positive remainder — JavaScript's % keeps the sign, which breaks the math. */
export function mod(a: bigint, m: bigint = P): bigint {
  return ((a % m) + m) % m;
}

/** Modular inverse by the extended Euclidean algorithm: the "division" this field has. */
export function inverse(a: bigint, m: bigint = P): bigint {
  let [lm, hm, low, high] = [1n, 0n, mod(a, m), m];
  while (low > 1n) {
    const r = high / low;
    [lm, hm] = [hm - lm * r, lm];
    [low, high] = [high - low * r, low];
  }
  return mod(lm, m);
}

function powMod(base: bigint, exponent: bigint, m: bigint): bigint {
  let result = 1n;
  let b = mod(base, m);
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return result;
}

/**
 * Add two points. Geometrically: draw the line through them, find the
 * third place it crosses the curve, and mirror it over the x-axis.
 */
export function add(p: Point | null, q: Point | null): Point | null {
  if (!p) return q;
  if (!q) return p;
  // A point plus its mirror image cancels out to infinity.
  if (p.x === q.x && mod(p.y + q.y) === 0n) return null;
  const slope =
    p.x === q.x && p.y === q.y
      ? mod(3n * p.x * p.x * inverse(2n * p.y)) // tangent, for doubling
      : mod((q.y - p.y) * inverse(q.x - p.x)); // chord, for two distinct points
  const x = mod(slope * slope - p.x - q.x);
  return { x, y: mod(slope * (p.x - x) - p.y) };
}

/**
 * Multiply a point by a scalar: double-and-add, the same trick as long
 * multiplication. This is the one-way street all of Bitcoin rests on —
 * easy forwards, hopeless backwards (that is Quest #3's guess-the-key).
 */
export function multiply(p: Point, k: bigint): Point | null {
  let result: Point | null = null;
  let addend: Point | null = p;
  let n = mod(k, N);
  while (n > 0n) {
    if (n & 1n) result = add(result, addend);
    addend = add(addend, addend);
    n >>= 1n;
  }
  return result;
}

/** The public key for a private key: just k·G. */
export function publicKey(privateKey: bigint): Point {
  const point = multiply(G, privateKey);
  if (!point) throw new Error('private key is zero');
  return point;
}

/**
 * Compressed serialization: 33 bytes as `02`/`03` plus x. The prefix says
 * which of the two possible y values it is, so y need never be written down.
 */
export function compress(p: Point): string {
  return ((p.y & 1n) === 0n ? '02' : '03') + p.x.toString(16).padStart(64, '0');
}

/** Recover the full point from its 33-byte compressed form. */
export function decompress(hex: string): Point {
  const prefix = hex.slice(0, 2);
  if (prefix !== '02' && prefix !== '03') throw new Error(`not a compressed point: ${prefix}`);
  const x = BigInt('0x' + hex.slice(2));
  // y = sqrt(x^3 + 7). For this prime, the square root is a single exponentiation.
  let y = powMod(mod(x ** 3n + 7n), (P + 1n) / 4n, P);
  if (((y & 1n) === 1n) !== (prefix === '03')) y = mod(-y);
  return { x, y };
}
