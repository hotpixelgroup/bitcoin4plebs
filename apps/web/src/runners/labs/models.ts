import { supplyThroughBlock } from '@bitcoin4plebs/bitcoin-logic';
/** Small deterministic teaching models. No consensus, wallet or relay implementation. */
export interface FeeTx {
  id: string;
  fee: number;
  size: number;
  parent?: string;
}
export const initialPool: FeeTx[] = [
  { id: 'parent', fee: 100, size: 200 },
  { id: 'payment', fee: 300, size: 150 },
  { id: 'competitor', fee: 1800, size: 300 },
];
export const arrivals: FeeTx[][] = [
  [{ id: 'arrival-1', fee: 1600, size: 200 }],
  [{ id: 'arrival-2', fee: 900, size: 150 }],
  [],
  [],
];
/** Ancestors before children; maximize ancestor-package feerate greedily, tiny 500-vB blocks. */
export function selectBlock(pool: FeeTx[], capacity = 500): FeeTx[] {
  const selected: FeeTx[] = [];
  const available = new Map(pool.map((tx) => [tx.id, tx]));
  const packageFor = (tx: FeeTx, seen = new Set<string>()): FeeTx[] | null => {
    if (selected.some((t) => t.id === tx.id)) return [];
    if (seen.has(tx.id)) return null;
    seen.add(tx.id);
    if (!tx.parent) return [tx];
    if (selected.some((t) => t.id === tx.parent)) return [tx];
    const parent = available.get(tx.parent);
    if (!parent) return null;
    const ancestors = packageFor(parent, seen);
    return ancestors ? [...ancestors, tx] : null;
  };
  while (available.size) {
    const remainingCapacity = capacity;
    const candidates = [...available.values()]
      .map((tx) => packageFor(tx))
      .filter((p): p is FeeTx[] => !!p && p.length > 0)
      .filter((p) => p.reduce((s, t) => s + t.size, 0) <= remainingCapacity)
      .sort(
        (a, b) =>
          b.reduce((s, t) => s + t.fee, 0) / b.reduce((s, t) => s + t.size, 0) -
            a.reduce((s, t) => s + t.fee, 0) /
              a.reduce((s, t) => s + t.size, 0) ||
          (a.at(-1)?.id ?? '').localeCompare(b.at(-1)?.id ?? ''),
      );
    const best = candidates[0];
    if (!best) break;
    for (const tx of best) {
      selected.push(tx);
      available.delete(tx.id);
      capacity -= tx.size;
    }
  }
  return selected;
}
export function feeTrace(pool: FeeTx[], blocks = 4) {
  let waiting = [...pool];
  return Array.from({ length: blocks }, (_, i) => {
    waiting = [...waiting, ...(arrivals[i] ?? [])];
    const before = [...waiting];
    const mined = selectBlock(before);
    waiting = waiting.filter((tx) => !mined.some((t) => t.id === tx.id));
    return { before, mined, after: [...waiting] };
  });
}
/** Historical Core 28-era policy fixture, not the newer pinned cluster-mempool rules: no new unconfirmed inputs, <=100 evictions,
 * greater absolute fee including descendants, incremental relay bandwidth and direct-conflict feerate.
 * Omits v3/TRUC, package relay, script/standardness and all other admission rules. */
export function replacePayment(
  pool: FeeTx[],
  fee: number,
  newUnconfirmed = false,
): { pool: FeeTx[]; reason: string; ok: boolean } {
  const old = pool.find((t) => t.id === 'payment');
  const reject = (reason: string) => ({ pool, reason, ok: false });
  if (!old) return reject('No unconfirmed payment to replace.');
  const evicted = new Set(['payment']);
  for (let i = 0; i < pool.length; i++)
    for (const tx of pool)
      if (tx.parent && evicted.has(tx.parent)) evicted.add(tx.id);
  const oldFee = pool
    .filter((t) => evicted.has(t.id))
    .reduce((s, t) => s + t.fee, 0);
  if (!Number.isSafeInteger(fee) || fee < 0)
    return reject('Fee must be whole nonnegative sats.');
  if (newUnconfirmed)
    return reject('Rejected: new unconfirmed input in this policy fixture.');
  if (evicted.size > 100) return reject('Rejected: too many evictions.');
  if (
    fee <= oldFee ||
    fee - oldFee < old.size ||
    fee / old.size <= old.fee / old.size
  )
    return reject(
      `Rejected: pay more than ${oldFee} sats total, cover ${old.size} sats incremental relay (assumed 1 sat/vB), and beat the direct conflict feerate.`,
    );
  return {
    ok: true,
    pool: [...pool.filter((t) => !evicted.has(t.id)), { ...old, fee }],
    reason: `Replacement admitted locally; ${evicted.size} transaction(s) evicted. No confirmation guarantee.`,
  };
}
export interface Branch {
  id: string;
  parent: string | null;
  work: number;
  recipient?: 'Bo' | 'Carol';
  valid: boolean;
}
export interface ChainState {
  blocks: Branch[];
  tips: [string, string];
  log: string;
}
export const chainInitial = (): ChainState => ({
  blocks: [{ id: 'G', parent: null, work: 0, valid: true }],
  tips: ['G', 'G'],
  log: 'Both nodes start with the same one-coin UTXO.',
});
export function chainView(s: ChainState, tip: string) {
  let block = s.blocks.find((b) => b.id === tip);
  let work = 0;
  let owner = 'Ana';
  let valid = true;
  const path: string[] = [];
  while (block) {
    path.unshift(block.id);
    work += block.work;
    valid &&= block.valid;
    if (block.recipient && owner === 'Ana') owner = block.recipient;
    const parentId = block.parent;
    block = s.blocks.find((b) => b.id === parentId);
  }
  // Recipient must come from the earliest spend after G, not the tip traversal order.
  owner =
    path
      .map((id) => s.blocks.find((b) => b.id === id)?.recipient)
      .find(Boolean) ?? 'Ana';
  return { work, owner, valid, path };
}
export function chainStep(
  s: ChainState,
  action: 'bo' | 'carol' | 'extend' | 'invalid' | 'propagate',
): ChainState {
  if (action === 'propagate') {
    const views = s.tips.map((t) => chainView(s, t));
    const best =
      views[1].valid && views[1].work > views[0].work ? s.tips[1] : s.tips[0];
    const tips = s.tips.map((t, i) => {
      const candidate = chainView(s, best);
      return candidate.valid && candidate.work > views[i].work ? best : t;
    }) as [string, string];
    const oldView = views[0];
    const newView = chainView(s, tips[0]);
    const changed = tips[0] !== s.tips[0];
    const replacedSpend =
      oldView.owner !== 'Ana' && oldView.owner !== newView.owner;
    return {
      ...s,
      tips,
      log: changed
        ? replacedSpend
          ? `Node A disconnects ${oldView.owner}’s branch: undo ${oldView.owner}’s output, restore Ana’s input, then apply ${newView.owner}’s spend. The disconnected conflict cannot return to the mempool because its input is spent on the new chain.`
          : `Node A learns a valid higher-work tip and replays the active UTXO view. Current owner ${newView.owner}; no conflicting old payment was reversed.`
        : 'Equal work retains each node’s current tip. Invalid branches are never adopted, regardless of work.',
    };
  }
  const id = `${action}-${s.blocks.length}`;
  const parent = action === 'bo' || action === 'carol' ? 'G' : s.tips[1];
  const block: Branch = {
    id,
    parent,
    work: action === 'invalid' ? 100 : 1,
    valid: action !== 'invalid',
    ...(action === 'bo'
      ? { recipient: 'Bo' as const }
      : action === 'carol'
        ? { recipient: 'Carol' as const }
        : {}),
  };
  if (
    (action === 'bo' || action === 'carol') &&
    s.blocks.some((b) => b.recipient === block.recipient)
  )
    return s;
  const tips: [string, string] = [...s.tips];
  if (action !== 'invalid') tips[action === 'bo' ? 0 : 1] = id;
  return {
    blocks: [...s.blocks, block],
    tips,
    log:
      action === 'invalid'
        ? 'Rejected the fabricated high-work invalid block. Neither active UTXO set changes.'
        : `Node ${action === 'bo' ? 'A' : 'B'} learned ${id}. Withheld blocks do not affect a peer until delivered.`,
  };
}
export function merchantRace(
  share: number,
  confirmations: number,
  seed: number,
  limit = 400,
) {
  if (share < 0 || share > 1 || confirmations < 1)
    throw new RangeError('race inputs');
  let rng = seed >>> 0;
  let honest = 0;
  let secret = 0;
  const next = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng / 2 ** 32;
  };
  let steps = 0;
  while (honest < confirmations && steps++ < limit)
    next() < share ? secret++ : honest++;
  const atDelivery = { honest, secret };
  if (honest < confirmations)
    return { ...atDelivery, atDelivery, outcome: 'unresolved' as const };
  while (steps++ < limit && secret <= honest)
    next() < share ? secret++ : honest++;
  return {
    honest,
    secret,
    atDelivery,
    outcome:
      secret > honest ? ('replacement' as const) : ('unresolved' as const),
  };
}
export interface PublicTx {
  inputs: string[];
  outputs: { address: string; sats: number }[];
}
export function inferOwnership(
  tx: PublicTx,
  common: boolean,
  smaller: boolean,
) {
  const guessed = new Set<string>(['S1']);
  if (!tx.inputs.includes('S1')) return guessed;
  if (common) tx.inputs.forEach((a) => guessed.add(a));
  const sorted = [...tx.outputs].sort((a, b) => a.sats - b.sats);
  if (smaller && sorted.length > 1 && sorted[0].sats < sorted[1].sats)
    guessed.add(sorted[0].address);
  return guessed;
}
export const privacyCases = {
  ordinary: {
    tx: {
      inputs: ['S1', 'S2'],
      outputs: [
        { address: 'payment', sats: 10000 },
        { address: 'change', sats: 2000 },
      ],
    },
    truth: ['S1', 'S2', 'change'],
    explanation:
      'Ordinary single-owner fixture: both hypotheses happen to match these owners.',
  },
  payjoin: {
    tx: {
      inputs: ['S1', 'receiver-input'],
      outputs: [
        { address: 'receiver-output', sats: 2000 },
        { address: 'sender-change', sats: 10000 },
      ],
    },
    truth: ['S1', 'sender-change'],
    explanation:
      'Collaborative PayJoin-shaped fixture: the receiver contributed an input. Both the common-input and smaller-output guesses misattribute receiver addresses.',
  },
  equal: {
    tx: {
      inputs: ['S1', 'other-owner'],
      outputs: [
        { address: 'equal-A', sats: 5000 },
        { address: 'equal-B', sats: 5000 },
      ],
    },
    truth: ['S1', 'equal-B'],
    explanation:
      'Collaborative equal-output fixture: equal amounts cannot identify change; co-inputs still need not share an owner. This is a graph example, not a full CoinJoin transaction.',
  },
};
export interface RecoveryKit {
  seed: boolean;
  passphrase: boolean;
  descriptor: boolean;
  cosigners: number;
  currentState: boolean;
  staticBackup: boolean;
  peerOnline: boolean;
  tower: boolean;
}
export function recover(
  kind: 'single' | 'multisig' | 'lightning',
  k: RecoveryKit,
) {
  if (kind === 'multisig') {
    if (!k.descriptor)
      return 'Discovery incomplete: preserve all public cosigner data, origins, derivation and the 2-of-3 script policy. A seed alone does not describe this wallet.';
    const available = k.cosigners + (k.seed && k.passphrase ? 1 : 0);
    if (available < 2)
      return 'Watch-only discovery succeeds, but 2-of-3 signing needs two available private cosigners. This signer plus the other available signers do not reach the threshold.';
    return 'Fixture wallet discovered and signing threshold available. Two other signers can meet 2-of-3 even if this signer’s seed is lost; public descriptors alone cannot sign.';
  }
  if (!k.seed)
    return 'Cannot sign: seed absent. A descriptor alone can be watch-only.';
  if (!k.passphrase)
    return kind === 'lightning'
      ? 'Recovery material mismatch: use the exact wallet implementation’s seed and recovery passphrase. LND uses aezeed, not BIP39; no universal Lightning seed format exists.'
      : 'Valid but different wallet: wrong BIP39 passphrase has no wrong-password checksum. Expected funds are absent.';
  if (kind === 'lightning' && !k.currentState && !k.staticBackup)
    return 'Channel recovery blocked: no current database or static channel backup. A seed and a reachable peer do not by themselves supply this fixture’s channel recovery data.';
  if (!k.descriptor && kind !== 'lightning')
    return 'Discovery incomplete: preserve script type, derivation, origin and range; multisig needs all public cosigner data and policy. Seed alone is not a universal backup.';
  if (kind === 'lightning' && !k.currentState)
    return k.peerOnline
      ? 'Static channel backup + cooperative peer: request peer force-close and recover settled base outputs on-chain after applicable delays/fees; pending HTLC recovery is not assured by an SCB. It does not restore the latest off-chain state.'
      : 'Channel recovery blocked in this fixture: stale/static backup and unavailable peer. A watchtower cannot reconstruct the current state or guarantee recovery.';
  return kind === 'lightning'
    ? 'Current channel state available. Restore safely without running a second copy or broadcasting stale commitments. Watchtowers only cover configured breach-remedy cases; they are not wallet backups.'
    : 'Fixture wallet discovered and signing threshold available. Real recovery also needs verified software, scanning history and a safe environment; no keys are entered here.';
}
export interface Reservation {
  phase: 'proposed' | 'signed' | 'ready' | 'pending' | 'settled' | 'failed';
  ana: number;
  bo: number;
  locked: number;
}
export const reservationInitial = (): Reservation => ({
  phase: 'proposed',
  ana: 80000,
  bo: 20000,
  locked: 0,
});
export function reservationStep(
  s: Reservation,
  action: 'sign' | 'ready' | 'offer' | 'settle' | 'fail',
  amount = 5000,
): Reservation {
  if (action === 'sign' && s.phase === 'proposed')
    return { ...s, phase: 'signed' };
  if (action === 'ready' && s.phase === 'signed')
    return { ...s, phase: 'ready' };
  if (
    action === 'offer' &&
    s.phase === 'ready' &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount <= s.ana - 1000
  )
    return { ...s, phase: 'pending', ana: s.ana - amount, locked: amount };
  if (s.phase === 'pending' && action === 'settle')
    return { ...s, phase: 'settled', bo: s.bo + s.locked, locked: 0 };
  if (s.phase === 'pending' && action === 'fail')
    return { ...s, phase: 'failed', ana: s.ana + s.locked, locked: 0 };
  return s;
}
export function reconcileSnapshot(
  json: string,
  height: string,
  bestblock: string,
) {
  const btc = (value: unknown) => {
    const text = String(value);
    if (!/^\d+(\.\d{1,8})?$/.test(text))
      throw new Error(
        'Amounts must be nonnegative BTC with at most 8 decimals.',
      );
    const [w, f = ''] = text.split('.');
    return BigInt(w) * 100000000n + BigInt(f.padEnd(8, '0'));
  };
  try {
    // Preserve decimal tokens before JSON.parse can round them into a different satoshi.
    const data = JSON.parse(
      json.replace(
        /("(?:total_amount|total_unspendable_amount|total_prevout_spent_amount|total_coinbase_amount|total_new_outputs_ex_coinbase_amount)"\s*:\s*)(\d+(?:\.\d+)?)(?=\s*[,}])/g,
        '$1"$2"',
      ),
    );
    if (
      !/^\d+$/.test(height) ||
      !Number.isSafeInteger(data.height) ||
      data.height < 0 ||
      data.height !== Number(height)
    )
      throw new Error('Height mismatch or invalid height.');
    if (
      !/^[a-f0-9]{64}$/i.test(bestblock) ||
      data.bestblock?.toLowerCase() !== bestblock.toLowerCase()
    )
      throw new Error('Bestblock mismatch or missing block identity.');
    const total = btc(data.total_amount);
    const schedule = supplyThroughBlock(data.height);
    if (total > schedule)
      throw new Error(
        'UTXO total exceeds the scheduled ceiling: investigate identity, parsing and node validation.',
      );
    const unspendable =
      data.total_unspendable_amount === undefined
        ? null
        : btc(data.total_unspendable_amount);
    if (unspendable !== null && total + unspendable !== schedule)
      throw new Error(
        'Optional excluded-amount accounting does not reconcile with the scheduled ceiling in this snapshot. Investigate unclaimed subsidy, source and index semantics.',
      );
    return {
      ok: true,
      total,
      unspendable,
      message: `Matched snapshot identity. UTXO total ${total} sats; scheduled ceiling ${schedule} sats; gap ${schedule - total} sats; ${unspendable === null ? 'optional coinstats accounting absent' : `reported cumulative excluded amount ${unspendable} sats (not a measure of lost keys)`}. This is reconciliation evidence, not certification of validation, recoverable supply or absence of hidden inflation.`,
    };
  } catch (error) {
    return {
      ok: false,
      total: null,
      unspendable: null,
      message: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}
