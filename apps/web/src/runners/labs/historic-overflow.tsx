import { useState } from 'react';
import {
  doubleSha256Hex,
  hexToBytes,
  reverseHexBytes,
} from '@bitcoin4plebs/bitcoin-logic';
// Reconstructed from the developer's original block dump, not its rounded JSON numbers.
// https://bitcointalk.org/index.php?topic=822.0 (2010-08-15). Matched by txid below.
export const OVERFLOW_RAW =
  '0100000001395d705a36b122c01c9be97f8c69994c03bb8a0531990411ce7ac78f34e87f23000000008b483045022100db8ccad098467a80bdb9ae16fca82aa4214a66c1ee24b62b696073e7e4f6879302205ad02d53231be18c5d6a77ffdb39476a5b5da4be70f0acc6794b181f4e38027ca841046b5d97aeed2979207f4ca7d9e75cdebf9ebb2a47d0b715370645f6845edfa7adfb0627ad7bda601ad2d129ebf037c5750841e9ba64ab199c4cb8280a95335d96ffffffff02e05ef8ffffffff7f1976a91490e8d5ba1c2a301824b18d383dead728b13ea7b788ace05ef8ffffffff7f1976a9142c72c4b5e0cbf9b6435f2cec9df8668c5075121588ac00000000';
export const OVERFLOW_TXID =
  '1d5e512a9723cbef373b970eb52f1e9598ad67e7408077a82fdac194b65333c9';
export function overflowOutputs(raw: string) {
  const bytes = hexToBytes(raw);
  let offset = 4;
  if (bytes[offset++] !== 1) throw new Error('Fixture has one input');
  offset += 36;
  const scriptLength = bytes[offset++];
  offset += scriptLength + 4;
  if (bytes[offset++] !== 2) throw new Error('Fixture has two outputs');
  const values: bigint[] = [];
  for (let i = 0; i < 2; i++) {
    let value = 0n;
    for (let j = 0; j < 8; j++)
      value |= BigInt(bytes[offset++]) << BigInt(8 * j);
    values.push(value);
    const size = bytes[offset++];
    offset += size;
  }
  if (offset + 4 !== bytes.length) throw new Error('Unexpected fixture length');
  return values;
}
export function HistoricOverflow() {
  const [prediction, setPrediction] = useState('negative');
  const [result, setResult] = useState('');
  return (
    <section
      className="prose lab-extension"
      aria-label="Historical overflow laboratory"
    >
      <h3>Reconstruct the actual 2010 overflow</h3>
      <p>
        The original developer report for discarded block 74,638 identifies this
        transaction. Decode its actual little-endian output bytes, rather than
        rounded JSON decimal amounts. Modern checks reject each enormous output
        individually.
      </p>
      <a href="https://bitcointalk.org/index.php?topic=822.0">
        Original developer report · 2010-08-15
      </a>
      <details>
        <summary>Serialized historic transaction (never submitted)</summary>
        <code>{OVERFLOW_RAW}</code>
      </details>
      <label>
        Predict the simulated signed 64-bit sum{' '}
        <select
          value={prediction}
          onChange={(e) => setPrediction(e.target.value)}
        >
          <option value="negative">Negative after wrapping</option>
          <option value="positive">Still the exact positive total</option>
        </select>
      </label>
      <button
        className="preset"
        onClick={async () => {
          const values = overflowOutputs(OVERFLOW_RAW);
          const sum = values.reduce((a, b) => a + b, 0n);
          const id = reverseHexBytes(
            await doubleSha256Hex(hexToBytes(OVERFLOW_RAW)),
          );
          setResult(
            `${prediction === 'negative' ? 'Prediction matched.' : 'Prediction differed.'} Outputs: ${values.join(' + ')} sats. Exact total ${sum}; signed-64-bit wrapping demonstration ${BigInt.asIntN(64, sum)}. Reconstructed txid ${id}; ${id === OVERFLOW_TXID ? 'matches original report' : 'MISMATCH'}. BigInt arithmetic does not overflow. This demonstrates historic failure, not a current valid transaction.`,
          );
        }}
      >
        Decode bytes and verify historic txid
      </button>
      <p role="status">{result}</p>
      <p>
        The wrapping calculation is an explicit educational emulation; signed
        overflow in C++ is undefined behavior. This narrow decoder handles this
        fixed legacy fixture, not arbitrary untrusted transactions or full
        validation.
      </p>
    </section>
  );
}
