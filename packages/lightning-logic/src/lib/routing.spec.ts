import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BOLT7_EXAMPLE_GRAPH,
  buildRoute,
  findCheapestRoute,
  findRoutes,
  hopFeeMsat,
  type ChannelPolicy,
} from './routing.js';

/**
 * BOLT #7 works its own routing example through in prose: a four-node
 * network, eight channel_update messages with stated fees, and the
 * arithmetic carried out to a number. That number is a test vector, and
 * this file reads it out of the pinned specification rather than trusting
 * a copy of it here.
 */

const BOLTS_SRC = process.env['BOLTS_SRC'];
const boltsAvailable = !!BOLTS_SRC && existsSync(BOLTS_SRC);

const spec = () => readFileSync(join(BOLTS_SRC as string, '07-routing-gossip.md'), 'utf8');

describe('BOLT #7 fee arithmetic', () => {
  it('charges base plus proportional, truncating the division', () => {
    const policy: ChannelPolicy = {
      from: 'B',
      to: 'C',
      feeBaseMsat: 200,
      feeProportionalMillionths: 2000,
      cltvExpiryDelta: 20,
    };
    // 200 + floor(4999999 * 2000 / 1000000) = 200 + 9999 = 10199
    expect(hopFeeMsat(policy, 4_999_999)).toBe(10_199);
    // The truncation matters: rounding up would give 10200.
    expect(hopFeeMsat(policy, 4_999_999)).not.toBe(10_200);
  });

  it('charges nothing proportional when the rate is zero', () => {
    const free: ChannelPolicy = {
      from: 'X',
      to: 'Y',
      feeBaseMsat: 0,
      feeProportionalMillionths: 0,
      cltvExpiryDelta: 40,
    };
    expect(hopFeeMsat(free, 1_000_000)).toBe(0);
  });
});

describe('route construction', () => {
  it('never charges the first channel, because the sender does not charge itself', () => {
    const route = buildRoute(
      [BOLT7_EXAMPLE_GRAPH[0], BOLT7_EXAMPLE_GRAPH[4]], // A->B, B->C
      1_000_000
    );
    expect(route.hops[0].feeMsat).toBe(0);
    // ...and the fee that IS charged uses the channel B forwards out of.
    expect(route.hops[1].feeMsat).toBe(hopFeeMsat(BOLT7_EXAMPLE_GRAPH[4], 1_000_000));
  });

  it('builds from the destination backwards, so fees compound outward', () => {
    // A->B->C: B charges on what it forwards to C.
    const route = buildRoute([BOLT7_EXAMPLE_GRAPH[0], BOLT7_EXAMPLE_GRAPH[4]], 4_999_999);
    expect(route.totalFeeMsat).toBe(10_199);
    expect(route.totalSendMsat).toBe(4_999_999 + 10_199);
    // And the timelock the sender commits to is B->C's delta.
    expect(route.totalCltvDelta).toBe(20);
  });

  it('respects advertised htlc limits when choosing', () => {
    const graph: ChannelPolicy[] = [
      { from: 'S', to: 'M', feeBaseMsat: 0, feeProportionalMillionths: 0, cltvExpiryDelta: 10, htlcMaximumMsat: 1_000 },
      { from: 'M', to: 'T', feeBaseMsat: 0, feeProportionalMillionths: 0, cltvExpiryDelta: 10 },
      { from: 'S', to: 'N', feeBaseMsat: 5_000, feeProportionalMillionths: 0, cltvExpiryDelta: 10 },
      { from: 'N', to: 'T', feeBaseMsat: 0, feeProportionalMillionths: 0, cltvExpiryDelta: 10 },
    ];
    // The free route cannot carry 50,000 msat; the expensive one must win.
    const route = findCheapestRoute(graph, 'S', 'T', 50_000);
    expect(route?.hops.map((h) => h.to)).toEqual(['N', 'T']);
  });

  it('prefers the cheapest route, which need not be the shortest', () => {
    const routes = findRoutes(BOLT7_EXAMPLE_GRAPH, 'A', 'C', 1_000_000);
    expect(routes.length).toBeGreaterThan(1);
    // Sorted cheapest-first, and A->B->C beats A->D->C (B charges less than D).
    expect(routes[0].hops.map((h) => h.to)).toEqual(['B', 'C']);
    expect(routes[0].totalFeeMsat).toBeLessThan(routes[1].totalFeeMsat);
  });
});

describe.skipIf(!boltsAvailable)("BOLT #7's own worked example, read from the spec", () => {
  it('states the fee formula we implemented', () => {
    expect(spec()).toContain(
      'fee_base_msat + ( amount_to_forward * fee_proportional_millionths / 1000000 )'
    );
  });

  it('states the worked answer our arithmetic produces', () => {
    // The spec does the sum itself. If it ever changes, this fails loudly.
    expect(spec()).toContain('200 + ( 4999999 * 2000 / 1000000 ) = 10199');
    const policy = BOLT7_EXAMPLE_GRAPH.find((p) => p.from === 'B' && p.to === 'C');
    expect(hopFeeMsat(policy as ChannelPolicy, 4_999_999)).toBe(10_199);
  });

  it('has not drifted from the eight channel_updates the spec lists', () => {
    const doc = spec();
    for (const p of BOLT7_EXAMPLE_GRAPH) {
      const line = `${p.from}->${p.to}: \`cltv_expiry_delta\` = ${p.cltvExpiryDelta}, \`fee_base_msat\` = ${p.feeBaseMsat}, \`fee_proportional_millionths\` = ${p.feeProportionalMillionths}`;
      expect(doc, `spec no longer lists ${p.from}->${p.to} with these terms`).toContain(line);
    }
  });
});
