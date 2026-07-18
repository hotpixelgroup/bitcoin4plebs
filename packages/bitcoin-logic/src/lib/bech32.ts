/**
 * Bech32 / Bech32m address machinery, translated faithfully from
 * src/bech32.cpp and src/key_io.cpp at the pinned commit. Exact integer
 * arithmetic; validated against the official BIP-173 / BIP-350 test
 * vectors in bech32.spec.ts.
 */

/** The Bech32 and Bech32m character set for encoding — bech32.cpp:23. */
export const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

export type Bech32Encoding = 'bech32' | 'bech32m';

/** Final checksum constant per encoding — bech32.cpp:122 (EncodingConstant). */
const ENCODING_CONSTANT: Record<Bech32Encoding, number> = {
  bech32: 1,
  bech32m: 0x2bc830a3,
};

/**
 * The BCH-code checksum at the heart of every bc1 address — a line-for-line
 * translation of PolyMod (bech32.cpp:130), including its five magic
 * constants. The developers' comment there proves the resulting code
 * detects up to 4 character errors in any address-sized string.
 */
export function polyMod(values: number[]): number {
  let c = 1;
  for (const v of values) {
    const c0 = c >>> 25;
    c = ((c & 0x1ffffff) << 5) ^ v;
    if (c0 & 1) c ^= 0x3b6a57b2;
    if (c0 & 2) c ^= 0x26508e6d;
    if (c0 & 4) c ^= 0x1ea119fa;
    if (c0 & 8) c ^= 0x3d4233dd;
    if (c0 & 16) c ^= 0x2a1462b3;
  }
  return c >>> 0;
}

/** Expand the human-readable part into checksum coefficients (bech32.cpp ExpandHRP). */
function expandHrp(hrp: string): number[] {
  const hi = [...hrp].map((ch) => ch.charCodeAt(0) >> 5);
  const lo = [...hrp].map((ch) => ch.charCodeAt(0) & 31);
  return [...hi, 0, ...lo];
}

/** Which encoding (if either) makes this hrp + data checksum-valid. */
export function verifyChecksum(hrp: string, values: number[]): Bech32Encoding | null {
  const residue = polyMod([...expandHrp(hrp), ...values]);
  if (residue === ENCODING_CONSTANT.bech32) return 'bech32';
  if (residue === ENCODING_CONSTANT.bech32m) return 'bech32m';
  return null;
}

export interface Bech32Decoded {
  ok: true;
  hrp: string;
  /** 5-bit payload values, checksum stripped. */
  payload: number[];
  encoding: Bech32Encoding;
}

export interface Bech32Error {
  ok: false;
  error: string;
  /** Index into the (lowercased) input of the offending character, when known. */
  errorAt?: number;
}

/** Split, charset-map, and checksum-verify a bech32/bech32m string. */
export function decodeBech32(input: string): Bech32Decoded | Bech32Error {
  if (input.length > 90) return { ok: false, error: 'Too long: bech32 strings max out at 90 characters.' };
  const hasLower = /[a-z]/.test(input);
  const hasUpper = /[A-Z]/.test(input);
  if (hasLower && hasUpper) {
    return { ok: false, error: 'Mixed case — an address must be all-lower or all-upper, never both.' };
  }
  const str = input.toLowerCase();
  const sep = str.lastIndexOf('1');
  if (sep === -1) return { ok: false, error: 'No separator: every bech32 address contains a "1" between prefix and data.' };
  if (sep === 0) return { ok: false, error: 'Empty human-readable part before the "1" separator.' };
  const hrp = str.slice(0, sep);
  const dataPart = str.slice(sep + 1);
  if (dataPart.length < 6) return { ok: false, error: 'Data section too short to even hold the 6-character checksum.' };
  const values: number[] = [];
  for (let i = 0; i < dataPart.length; i++) {
    const idx = BECH32_CHARSET.indexOf(dataPart[i]);
    if (idx === -1) {
      return {
        ok: false,
        error: `Character "${dataPart[i]}" is not in the 32-letter bech32 alphabet.`,
        errorAt: sep + 1 + i,
      };
    }
    values.push(idx);
  }
  const encoding = verifyChecksum(hrp, values);
  if (!encoding) {
    return { ok: false, error: 'Checksum failed — at least one character of this address is wrong.' };
  }
  return { ok: true, hrp, payload: values.slice(0, -6), encoding };
}

/** Regroup bits (bech32.cpp ConvertBits). Returns null when non-pad output would drop set bits. */
export function convertBits(data: number[], from: number, to: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  const maxv = (1 << to) - 1;
  for (const value of data) {
    if (value < 0 || value >> from) return null;
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits) out.push((acc << (to - bits)) & maxv);
  } else if (bits >= from || (acc << (to - bits)) & maxv) {
    return null;
  }
  return out;
}

export interface SegwitAddress {
  ok: true;
  hrp: string;
  /** Witness version, 0-16 — the first 5-bit symbol (key_io.cpp:143). */
  version: number;
  /** Witness program bytes as hex. */
  programHex: string;
  programLength: number;
  encoding: Bech32Encoding;
}

/**
 * Decode a segwit address into its witness version + program, enforcing the
 * same rules as key_io.cpp's DecodeDestination: version range, program
 * length, and the BIP-350 rule that v0 must be bech32 and v1+ bech32m.
 */
export function decodeSegwitAddress(input: string): SegwitAddress | Bech32Error {
  const dec = decodeBech32(input);
  if (!dec.ok) return dec;
  if (dec.payload.length === 0) return { ok: false, error: 'Empty data section after the checksum.' };
  const version = dec.payload[0];
  if (version > 16) return { ok: false, error: `Invalid witness version ${version} — only 0 through 16 exist.` };
  if (version === 0 && dec.encoding !== 'bech32') {
    return { ok: false, error: 'Version 0 witness address must use Bech32 checksum (key_io.cpp:145).' };
  }
  if (version >= 1 && dec.encoding !== 'bech32m') {
    return { ok: false, error: 'Version 1+ witness address must use Bech32m checksum.' };
  }
  const program = convertBits(dec.payload.slice(1), 5, 8, false);
  if (program === null) return { ok: false, error: 'Invalid padding in the data section.' };
  if (program.length < 2 || program.length > 40) {
    return { ok: false, error: `Invalid program length (${program.length} bytes).` };
  }
  if (version === 0 && program.length !== 20 && program.length !== 32) {
    return { ok: false, error: `Version 0 programs must be 20 or 32 bytes, not ${program.length}.` };
  }
  return {
    ok: true,
    hrp: dec.hrp,
    version,
    programHex: program.map((b) => b.toString(16).padStart(2, '0')).join(''),
    programLength: program.length,
    encoding: dec.encoding,
  };
}

/** Encode 5-bit values under an hrp with the checksum appended (bech32.cpp Encode). */
export function encodeBech32(hrp: string, values: number[], encoding: Bech32Encoding): string {
  const toCheck = [...expandHrp(hrp), ...values, 0, 0, 0, 0, 0, 0];
  const mod = polyMod(toCheck) ^ ENCODING_CONSTANT[encoding];
  let out = hrp + '1';
  for (const v of values) out += BECH32_CHARSET[v];
  for (let i = 0; i < 6; i++) out += BECH32_CHARSET[(mod >>> (5 * (5 - i))) & 31];
  return out;
}

/** Build a segwit address from version + program, choosing the encoding the way key_io.cpp does. */
export function encodeSegwitAddress(hrp: string, version: number, program: number[]): string {
  const data = [version, ...(convertBits(program, 8, 5, true) ?? [])];
  return encodeBech32(hrp, data, version === 0 ? 'bech32' : 'bech32m');
}

/**
 * The scriptPubKey this address spells — Quest #3's lock: an OP_n version
 * opcode, a push length, and the program bytes. Matches the expected
 * outputs of the BIP-173/350 test-vector tables.
 */
export function witnessScriptPubKeyHex(version: number, programHex: string): string {
  const opcode = version === 0 ? 0 : 0x50 + version;
  const length = programHex.length / 2;
  return [opcode, length].map((b) => b.toString(16).padStart(2, '0')).join('') + programHex;
}
