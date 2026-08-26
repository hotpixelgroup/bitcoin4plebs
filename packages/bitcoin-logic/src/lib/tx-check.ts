import { MAX_MONEY } from './constants.js';

/**
 * Faithful TypeScript translation of the historic-bug checks in
 * `CheckTransaction`, src/consensus/tx_check.cpp:11-60 (pinned commit).
 * Error strings are IDENTICAL to Bitcoin Core's so what you see here is
 * what a real node would say.
 */

/** An input: which previous output ("outpoint") it spends. */
export interface TxInput {
  /** Transaction id of the output being spent. */
  txid: string;
  /** Output index within that transaction. */
  vout: number;
}

/** An output: how many satoshis it locks. */
export interface TxOutput {
  value: bigint;
}

export interface SimpleTx {
  vin: TxInput[];
  vout: TxOutput[];
}

export type TxCheckResult = { ok: true } | { ok: false; error: string };

/** `MoneyRange` — src/consensus/amount.h:27. */
export function moneyRange(value: bigint): boolean {
  return value >= 0n && value <= MAX_MONEY;
}

/**
 * The parts of CheckTransaction that killed two famous bugs:
 * the 2010 value-overflow inflation (CVE-2010-5139) and the 2018
 * duplicate-input inflation (CVE-2018-17144).
 */
export function checkTransaction(tx: SimpleTx): TxCheckResult {
  if (tx.vin.length === 0) return { ok: false, error: 'bad-txns-vin-empty' };
  if (tx.vout.length === 0) return { ok: false, error: 'bad-txns-vout-empty' };

  // Check for negative or overflow output values (see CVE-2010-5139)
  let nValueOut = 0n;
  for (const txout of tx.vout) {
    if (txout.value < 0n) return { ok: false, error: 'bad-txns-vout-negative' };
    if (txout.value > MAX_MONEY) return { ok: false, error: 'bad-txns-vout-toolarge' };
    nValueOut += txout.value;
    if (!moneyRange(nValueOut)) return { ok: false, error: 'bad-txns-txouttotal-toolarge' };
  }

  // Check for duplicate inputs (see CVE-2018-17144)
  const vInOutPoints = new Set<string>();
  for (const txin of tx.vin) {
    const outpoint = `${txin.txid}:${txin.vout}`;
    if (vInOutPoints.has(outpoint)) return { ok: false, error: 'bad-txns-inputs-duplicate' };
    vInOutPoints.add(outpoint);
  }

  return { ok: true };
}
