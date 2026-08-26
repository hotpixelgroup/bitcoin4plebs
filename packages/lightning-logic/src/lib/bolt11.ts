import { convertBits, decodeBech32 } from '@bitcoin4plebs/bitcoin-logic';

/**
 * BOLT #11: the `lnbc…` invoice.
 *
 * An invoice is not a payment and not an address. It is a *request*: here
 * is what I want, here is the hash of a secret only I know, here is how to
 * find me, and here is my signature over all of it. Everything a payer
 * needs, in one string you can read out loud over a phone.
 *
 * The encoding is bech32 — the same checksummed alphabet Bitcoin addresses
 * use — with the 90-character address limit lifted. So the decoder below
 * reuses this project's own bech32 implementation, the one the Bitcoin
 * site's address quest already taught you to break on purpose.
 */

/** Multipliers on the amount in the human-readable part, in BTC. */
const MULTIPLIERS: Record<string, { num: bigint; den: bigint; name: string }> = {
  m: { num: 1n, den: 1_000n, name: 'milli (10⁻³)' },
  u: { num: 1n, den: 1_000_000n, name: 'micro (10⁻⁶)' },
  n: { num: 1n, den: 1_000_000_000n, name: 'nano (10⁻⁹)' },
  p: { num: 1n, den: 1_000_000_000_000n, name: 'pico (10⁻¹²)' },
};

/** Known network prefixes, after the leading `ln`. */
const NETWORKS: Record<string, string> = {
  bc: 'Bitcoin mainnet',
  tb: 'testnet',
  bcrt: 'regtest',
  tbs: 'signet',
  sb: 'simnet',
};

/** One tagged field, decoded as far as its type allows. */
export interface TaggedField {
  /** The bech32 letter the spec names the field by, e.g. 'p'. */
  tag: string;
  /** Human name, e.g. 'payment_hash'. */
  name: string;
  /** Length in 5-bit groups, as encoded. */
  groups: number;
  /** Rendered value: hex for hashes, text for descriptions, a number for times. */
  value: string;
  /** What this field is for, in one line. */
  note: string;
}

export interface Bolt11Invoice {
  ok: true;
  /** The whole human-readable part, e.g. 'lnbc2500u'. */
  hrp: string;
  network: string;
  networkPrefix: string;
  /** Amount in millisatoshis, or null for an open-ended ("any amount") invoice. */
  amountMsat: bigint | null;
  /** How the amount was written, e.g. '2500u'. */
  amountSource: string | null;
  /** Seconds since the Unix epoch. */
  timestamp: number;
  timestampIso: string;
  fields: TaggedField[];
  /** 512-bit signature plus its 1-byte recovery id, hex. */
  signature: string;
  recoveryId: number;
  /** Total characters, for the "this is a long string" point. */
  length: number;
}

export interface Bolt11Error {
  ok: false;
  error: string;
}

const FIELD_META: Record<string, { name: string; note: string }> = {
  p: { name: 'payment_hash', note: 'The hash of a secret only the payee knows. Paying it means learning the secret.' },
  s: { name: 'payment_secret', note: "Proves the payer reached the real invoice, not a probe by a node on the route." },
  d: { name: 'description', note: 'What the payment is for, in plain text. Committed to by the signature.' },
  h: { name: 'description_hash', note: 'A hash of a longer description, when the text is too big to carry inline.' },
  n: { name: 'payee_node_id', note: "The payee's node id. Usually omitted — it is recoverable from the signature." },
  x: { name: 'expiry', note: 'Seconds after the timestamp until this invoice stops being payable.' },
  c: { name: 'min_final_cltv_expiry_delta', note: 'How much timelock the final hop demands before it will accept the payment.' },
  f: { name: 'fallback_address', note: 'An on-chain address to use if the Lightning payment cannot be made.' },
  r: { name: 'routing_hints', note: 'Private channels the payer would otherwise never learn about from gossip.' },
  '9': { name: 'features', note: 'Which optional protocol features the payee requires or supports.' },
  m: { name: 'metadata', note: 'Opaque bytes the payer must echo back to the payee in the final hop.' },
};

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

/** Read a big-endian integer out of 5-bit groups. */
function readInt(groups: number[]): number {
  return groups.reduce((acc, v) => acc * 32 + v, 0);
}

function groupsToHex(groups: number[], bits: number): string {
  const bytes = convertBits(groups, 5, 8, true);
  if (!bytes) return '';
  return bytes
    .slice(0, Math.ceil(bits / 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function groupsToText(groups: number[]): string {
  const bytes = convertBits(groups, 5, 8, false);
  if (!bytes) return '';
  return new TextDecoder().decode(Uint8Array.from(bytes));
}

/** Split `lnbc2500u` into its network prefix and its amount. */
function parseHrp(hrp: string): { network: string; prefix: string; amountMsat: bigint | null; amountSource: string | null } | null {
  if (!hrp.startsWith('ln')) return null;
  const rest = hrp.slice(2);
  // The prefix is the longest known network that this HRP starts with.
  const prefix = Object.keys(NETWORKS)
    .filter((p) => rest.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  if (!prefix) return null;

  const amountSource = rest.slice(prefix.length);
  if (!amountSource) {
    return { network: NETWORKS[prefix], prefix, amountMsat: null, amountSource: null };
  }
  const match = /^(\d+)([munp]?)$/.exec(amountSource);
  if (!match) return null;
  const digits = BigInt(match[1]);
  const multiplier = match[2];
  // 1 BTC = 100_000_000_000 msat.
  const MSAT_PER_BTC = 100_000_000_000n;
  const amountMsat = multiplier
    ? (digits * MSAT_PER_BTC * MULTIPLIERS[multiplier].num) / MULTIPLIERS[multiplier].den
    : digits * MSAT_PER_BTC;
  return { network: NETWORKS[prefix], prefix, amountMsat, amountSource };
}

/**
 * Decode an `lnbc…` invoice into its parts. Checksum-verified: a single
 * mistyped character is caught before anything else is believed.
 */
export function decodeInvoice(input: string): Bolt11Invoice | Bolt11Error {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Nothing to decode.' };
  if (!/^ln/i.test(trimmed)) {
    return { ok: false, error: 'A Lightning invoice starts with "ln" — this does not.' };
  }

  // Invoices are bech32 with no length ceiling (BOLT #11 §Encoding Overview).
  const decoded = decodeBech32(trimmed, { maxLength: Number.MAX_SAFE_INTEGER });
  if (!decoded.ok) return { ok: false, error: decoded.error };

  const hrpParts = parseHrp(decoded.hrp);
  if (!hrpParts) {
    return { ok: false, error: `Unrecognised human-readable part: "${decoded.hrp}".` };
  }

  const payload = decoded.payload;
  // 7 groups of timestamp, then fields, then 104 groups of signature.
  if (payload.length < 7 + 104) {
    return { ok: false, error: 'Too short to contain a timestamp and a signature.' };
  }
  const timestamp = readInt(payload.slice(0, 7));
  const signatureGroups = payload.slice(payload.length - 104);
  let cursor = 7;
  const end = payload.length - 104;

  const fields: TaggedField[] = [];
  while (cursor < end) {
    if (cursor + 3 > end) break;
    const tag = CHARSET[payload[cursor]];
    const groups = readInt(payload.slice(cursor + 1, cursor + 3));
    const dataStart = cursor + 3;
    const dataEnd = dataStart + groups;
    if (dataEnd > end) {
      return { ok: false, error: `Field "${tag}" claims ${groups} groups, past the end of the invoice.` };
    }
    const data = payload.slice(dataStart, dataEnd);
    const meta = FIELD_META[tag] ?? { name: `unknown (${tag})`, note: 'A field this decoder does not know — invoices are extensible by design.' };

    let value: string;
    if (tag === 'd') value = groupsToText(data);
    else if (tag === 'x' || tag === 'c') value = String(readInt(data));
    else if (tag === 'p' || tag === 's' || tag === 'h') value = groupsToHex(data, 256);
    else if (tag === 'n') value = groupsToHex(data, 264);
    else value = groupsToHex(data, groups * 5);

    fields.push({ tag, name: meta.name, groups, value, note: meta.note });
    cursor = dataEnd;
  }

  const signatureHex = groupsToHex(signatureGroups, 520);
  return {
    ok: true,
    hrp: decoded.hrp,
    network: hrpParts.network,
    networkPrefix: hrpParts.prefix,
    amountMsat: hrpParts.amountMsat,
    amountSource: hrpParts.amountSource,
    timestamp,
    timestampIso: new Date(timestamp * 1000).toISOString().replace('.000Z', 'Z'),
    fields,
    signature: signatureHex.slice(0, 128),
    recoveryId: parseInt(signatureHex.slice(128, 130), 16),
    length: trimmed.length,
  };
}

/** Format millisatoshis the way a wallet would, without floating point. */
export function formatMsat(msat: bigint | null): string {
  if (msat === null) return 'any amount (the payer chooses)';
  if (msat % 1000n === 0n) return `${(msat / 1000n).toLocaleString('en-US')} sats`;
  return `${(msat / 1000n).toLocaleString('en-US')}.${String(msat % 1000n).padStart(3, '0')} sats`;
}
/**
 * Four of BOLT #11's own published example invoices, transcribed so the
 * browser has something real to decode without a network fetch.
 *
 * bolt11.spec.ts re-reads the Examples section out of the PINNED
 * specification and fails if any character here has drifted, so what a
 * reader decodes on the page is provably the specification's own.
 */
export const BOLT11_EXAMPLES: readonly { label: string; note: string; invoice: string }[] = [
  {
    label: 'Any amount',
    note: 'An open-ended donation: no amount, so the payer decides.',
    invoice:
      'lnbc1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpl2pkx2ctnv5sxxmmwwd5kgetjypeh2ursdae8g6twvus8g6rfwvs8qun0dfjkxaq9qrsgq357wnc5r2ueh7ck6q93dj32dlqnls087fxdwk8qakdyafkq3yap9us6v52vjjsrvywa6rt52cm9r9zqt8r2t7mlcwspyetp5h2tztugp9lfyql',
  },
  {
    label: 'A cup of coffee',
    note: 'A fixed 0.0025 BTC, described in plain text, expiring in one minute.',
    invoice:
      'lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27kyke0lp53ut353s06fv3qfegext0eh0ymjpf39tuven09sam30g4vgpfna3rh',
  },
  {
    label: 'A non-ASCII description',
    note: 'The same amount with a non-ASCII description — UTF-8, straight through.',
    invoice:
      'lnbc2500u1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdpquwpc4curk03c9wlrswe78q4eyqc7d8d0xqzpu9qrsgqhtjpauu9ur7fw2thcl4y9vfvh4m9wlfyz2gem29g5ghe2aak2pm3ps8fdhtceqsaagty2vph7utlgj48u0ged6a337aewvraedendscp573dxr',
  },
  {
    label: 'A hashed description',
    note: 'A description too long to carry inline, so only its hash is committed to.',
    invoice:
      'lnbc20m1pvjluezsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygspp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqhp58yjmdan79s6qqdhdzgynm4zwqd5d7xmw5fk98klysy043l2ahrqs9qrsgq7ea976txfraylvgzuxs8kgcw23ezlrszfnh8r6qtfpr6cxga50aj6txm9rxrydzd06dfeawfk6swupvz4erwnyutnjq7x39ymw6j38gp7ynn44',
  },
];
