import { describe, expect, it } from 'vitest';
import {
  buildGenesisHeaderHex,
  GENESIS_HASH,
  GENESIS_MERKLE_ROOT,
  GENESIS_NONCE,
  GENESIS_BITS,
  doubleSha256Hex,
  hexToBytes,
  reverseHexBytes,
} from '@bitcoin4plebs/bitcoin-logic';
import {
  chainInitial,
  chainStep,
  chainView,
  feeTrace,
  initialPool,
  selectBlock,
  replacePayment,
  merchantRace,
  inferOwnership,
  privacyCases,
  recover,
  reservationInitial,
  reservationStep,
  reconcileSnapshot,
} from './models';
import { headerHash, practiceHeader } from './serialized';
import {
  OVERFLOW_RAW,
  OVERFLOW_TXID,
  overflowOutputs,
} from './historic-overflow';
import {
  BOLT7_EXAMPLE_GRAPH,
  findRoutes,
} from '@bitcoin4plebs/lightning-logic';
import { routeBalanceTrace } from '../routing/payment-attempt';

describe('package fee trace', () => {
  it('selects ancestors before children, combined package beats individual bids, and excludes missing parents', () => {
    const child = { id: 'child', parent: 'parent', fee: 3000, size: 100 };
    expect(selectBlock([...initialPool, child]).map((t) => t.id)).toEqual([
      'parent',
      'child',
      'payment',
    ]);
    expect(selectBlock([child])).toEqual([]);
    expect(selectBlock([...initialPool, child], 250).map((t) => t.id)).toEqual(
      ['payment', 'parent'].slice(0, 1),
    );
  });
  it('uses identical arrivals for forecast and replay, preserves parent dependency across blocks', () => {
    const trace = feeTrace(initialPool);
    expect(trace[0].mined.map((t) => t.id)).toEqual([
      'arrival-1',
      'competitor',
    ]);
    expect(trace[1].mined.map((t) => t.id)).toEqual([
      'arrival-2',
      'payment',
      'parent',
    ]);
    expect(trace[1].after).toEqual([]);
    expect(feeTrace(initialPool)).toEqual(trace);
  });
  it('rejects cheap replacements and new unconfirmed inputs; pays descendants and incremental bandwidth', () => {
    expect(replacePayment(initialPool, 449).ok).toBe(false);
    expect(replacePayment(initialPool, 450).ok).toBe(true);
    expect(replacePayment(initialPool, 1000, true).ok).toBe(false);
    const withChild = [
      ...initialPool,
      { id: 'descendant', parent: 'payment', size: 100, fee: 1000 },
    ];
    expect(replacePayment(withChild, 1400).ok).toBe(false);
    const replaced = replacePayment(withChild, 1450);
    expect(replaced.ok).toBe(true);
    expect(replaced.pool.some((t) => t.id === 'descendant')).toBe(false);
  });
});
describe('branch propagation and secret mining', () => {
  it('retains equal-work tips and rolls back UTXOs only when the valid higher-work branch is delivered', () => {
    let s = chainStep(chainStep(chainInitial(), 'bo'), 'carol');
    s = chainStep(s, 'propagate');
    expect(s.tips[0]).not.toBe(s.tips[1]);
    expect(chainView(s, s.tips[0]).owner).toBe('Bo');
    s = chainStep(s, 'extend');
    expect(chainView(s, s.tips[0]).owner).toBe('Bo');
    s = chainStep(s, 'invalid');
    expect(chainView(s, s.tips[0]).owner).toBe('Bo');
    s = chainStep(s, 'propagate');
    expect(s.tips[0]).toBe(s.tips[1]);
    expect(chainView(s, s.tips[0]).owner).toBe('Carol');
    expect(chainStep(s, 'propagate').tips).toEqual(s.tips);
  });
  it('counts private blocks during the wait and requires strict lead, without calling cutoffs impossible', () => {
    expect(merchantRace(0, 3, 42)).toMatchObject({
      atDelivery: { honest: 3, secret: 0 },
      outcome: 'unresolved',
    });
    expect(merchantRace(1, 3, 42)).toMatchObject({ outcome: 'unresolved' }); // merchant never delivers
    const r = merchantRace(0.3, 3, 42);
    expect(r).toEqual(merchantRace(0.3, 3, 42));
    expect(r.atDelivery.secret).toBeGreaterThan(0);
    const wins = Array.from({ length: 100 }, (_, seed) =>
      merchantRace(0.3, 3, seed),
    ).filter((r) => r.outcome === 'replacement');
    expect(wins.length).toBeGreaterThan(0);
    for (const r of wins) expect(r.secret).toBeGreaterThan(r.honest);
  });
});
describe('privacy and recovery counterexamples', () => {
  it('never passes private truth to inference; collaborative fixtures expose false positives and equal-output ambiguity', () => {
    expect([...inferOwnership(privacyCases.payjoin.tx, true, true)]).toEqual([
      'S1',
      'receiver-input',
      'receiver-output',
    ]);
    expect(privacyCases.payjoin.truth).not.toContain('receiver-input');
    expect([...inferOwnership(privacyCases.equal.tx, false, true)]).toEqual([
      'S1',
    ]);
    expect([...inferOwnership(privacyCases.payjoin.tx, false, false)]).toEqual([
      'S1',
    ]);
  });
  const kit = {
    seed: true,
    passphrase: true,
    descriptor: true,
    cosigners: 2,
    currentState: true,
    staticBackup: true,
    peerOnline: false,
    tower: true,
  };
  it('distinguishes wrong-wallet passphrase, public discovery and signing threshold', () => {
    expect(recover('single', { ...kit, passphrase: false })).toMatch(
      /different wallet/,
    );
    expect(recover('multisig', { ...kit, cosigners: 0 })).toMatch(
      /two available private/,
    );
    expect(recover('multisig', kit)).toMatch(/Fixture wallet/);
    expect(recover('multisig', { ...kit, seed: false, cosigners: 2 })).toMatch(
      /Two other signers/,
    );
    expect(recover('single', { ...kit, seed: false })).toMatch(/watch-only/);
    expect(recover('single', { ...kit, descriptor: false })).toMatch(
      /Discovery incomplete/,
    );
  });
  it('does not use a watchtower as a channel backup; static recovery requires a cooperative peer', () => {
    expect(recover('lightning', { ...kit, currentState: false })).toMatch(
      /blocked/,
    );
    expect(
      recover('lightning', { ...kit, currentState: false, peerOnline: true }),
    ).toMatch(/does not restore/);
    expect(recover('lightning', kit)).toMatch(/second copy/);
    expect(
      recover('lightning', {
        ...kit,
        currentState: false,
        staticBackup: false,
        peerOnline: true,
      }),
    ).toMatch(/no current database or static/);
    expect(recover('lightning', { ...kit, passphrase: false })).toMatch(
      /aezeed, not BIP39/,
    );
  });
});
describe('funding reservations and route balances', () => {
  it('rejects offers before readiness or below reserve and consumes locked value once', () => {
    let s = reservationInitial();
    expect(reservationStep(s, 'offer')).toBe(s);
    s = reservationStep(reservationStep(s, 'sign'), 'ready');
    expect(reservationStep(s, 'offer', 79001)).toBe(s);
    s = reservationStep(s, 'offer', 79000);
    expect(s.ana + s.bo + s.locked).toBe(100000);
    expect(s.ana).toBe(1000);
    const settled = reservationStep(s, 'settle');
    expect(settled.bo).toBe(99000);
    expect(reservationStep(settled, 'fail')).toBe(settled);
    const failed = reservationStep(s, 'fail');
    expect(failed.ana).toBe(80000);
    expect(failed.locked).toBe(0);
  });
  it('conserves every channel on success and restores every balance on failure', () => {
    const route = findRoutes(BOLT7_EXAMPLE_GRAPH, 'A', 'C', 1000000).find((r) =>
      r.hops.some((h) => h.from === 'B'),
    );
    if (!route) throw new Error('fixture');
    for (const fixture of ['ready', 'offline', 'low-liquidity'] as const) {
      const trace = routeBalanceTrace(route, fixture);
      for (const h of trace) {
        expect(h.after + h.reverseAfter).toBe(h.before + h.reverseBefore);
        if (fixture !== 'ready') expect(h.after).toBe(h.before);
      }
      const last = trace.at(-1);
      if (!last) throw new Error('Expected route hop');
      if (fixture === 'ready') {
        expect(trace[0].before - trace[0].after).toBe(route.totalSendMsat);
        expect(last.reverseAfter - last.reverseBefore).toBe(1000000);
      } else expect(last.reserved).toBe(0);
    }
  });
});
describe('RPC evidence and serialized bytes', () => {
  const hash = '01'.repeat(32);
  const json = JSON.stringify({
    height: 1,
    bestblock: hash,
    total_amount: '50.00000001',
  });
  it('rejects mismatched identity, malformed precision and oversupply; optional data remains unknown', () => {
    expect(reconcileSnapshot(json, '2', hash).ok).toBe(false);
    expect(reconcileSnapshot(json, '1', '02'.repeat(32)).ok).toBe(false);
    expect(reconcileSnapshot(json, '1', hash)).toMatchObject({
      ok: true,
      total: 5000000001n,
      unspendable: null,
    });
    expect(
      reconcileSnapshot(json.replace('50.00000001', '100.00000001'), '1', hash)
        .ok,
    ).toBe(false);
    expect(
      reconcileSnapshot(json.replace('50.00000001', '50.000000001'), '1', hash)
        .ok,
    ).toBe(false);
    expect(reconcileSnapshot('{', '1', hash).ok).toBe(false);
  });
  it('preserves exact numeric JSON BTC decimals before binary floating point parsing', () => {
    const j = `{"height":1000000,"bestblock":"${hash}","total_amount":19994825.30930052}`;
    expect(reconcileSnapshot(j, '1000000', hash)).toMatchObject({
      ok: true,
      total: 1999482530930052n,
      unspendable: null,
    });
  });
  it('serializes the known genesis vector and hashes raw 80 bytes in the correct order', async () => {
    const hex = practiceHeader(
      GENESIS_MERKLE_ROOT,
      GENESIS_NONCE,
      GENESIS_BITS,
    );
    expect(hex).toBe(buildGenesisHeaderHex());
    expect(hex.length).toBe(160);
    expect(await headerHash(hex)).toBe(GENESIS_HASH);
    expect(practiceHeader(GENESIS_MERKLE_ROOT, 1).slice(-8)).toBe('01000000');
    expect(() => practiceHeader('no', 1)).toThrow();
  });
  it('reconstructs the actual historical overflow txid and exact output values from bytes', async () => {
    expect(
      reverseHexBytes(await doubleSha256Hex(hexToBytes(OVERFLOW_RAW))),
    ).toBe(OVERFLOW_TXID);
    const values = overflowOutputs(OVERFLOW_RAW);
    expect(values).toEqual([9223372036854275808n, 9223372036854275808n]);
    expect(BigInt.asIntN(64, values[0] + values[1])).toBe(-1000000n);
  });
});
it('requires optional coinstats excluded-amount accounting to reconcile rather than accepting contradictory metadata', () => {
  const bestblock = 'ab'.repeat(32);
  const json = JSON.stringify({
    height: 1,
    bestblock,
    total_amount: '50.00000000',
    total_unspendable_amount: '50.00000000',
  });
  expect(reconcileSnapshot(json, '1', bestblock).ok).toBe(true);
  expect(
    reconcileSnapshot(
      json.replace(
        '"total_unspendable_amount":"50.00000000"',
        '"total_unspendable_amount":"49.99999999"',
      ),
      '1',
      bestblock,
    ).ok,
  ).toBe(false);
});
it('mines a child in a later block after its parent has already confirmed', () => {
  const child = { id: 'child', parent: 'parent', fee: 0, size: 100 };
  const trace = feeTrace([...initialPool, child]);
  expect(trace[1].mined.map((t) => t.id)).toContain('parent');
  expect(trace[1].after.map((t) => t.id)).toEqual(['child']);
  expect(trace[2].mined.map((t) => t.id)).toEqual(['child']);
  expect(trace[2].after).toEqual([]);
});
