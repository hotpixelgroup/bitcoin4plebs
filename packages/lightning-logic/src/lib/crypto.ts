/**
 * The two hash primitives BOLT #4 needs, over the browser's own WebCrypto
 * (the same choice Quest #8's proof-of-work and Quest #14's seed studio
 * make). These are the parts we are content to let the platform provide:
 * SHA-256 is the one piece of machinery every Bitcoin quest already taught
 * you to check against a published test vector.
 */

const subtle = () => globalThis.crypto.subtle;

/** SHA-256, the hash the whole system is built out of. */
export async function sha256(bytes: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  const digest = await subtle().digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
  return new Uint8Array(digest);
}

/**
 * HMAC-SHA256: a hash keyed by a secret, so only someone holding the key
 * can produce or check the tag. Lightning uses it twice over — once to
 * derive per-hop keys, once to seal each layer of the onion.
 */
export async function hmacSha256(
  key: Uint8Array,
  message: Uint8Array
): Promise<Uint8Array<ArrayBuffer>> {
  const imported = await subtle().importKey(
    'raw',
    key as Uint8Array<ArrayBuffer>,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await subtle().sign('HMAC', imported, message as Uint8Array<ArrayBuffer>);
  return new Uint8Array(signature);
}

/** Join byte arrays end to end. */
export function concatBytes(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** ASCII string to bytes — BOLT #4's key types are literally "rho", "mu", "um", "pad". */
export function asciiBytes(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(text, (c) => c.charCodeAt(0));
}
