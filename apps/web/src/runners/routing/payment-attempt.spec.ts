import { expect, it } from 'vitest';
import {
  BOLT7_EXAMPLE_GRAPH,
  findRoutes,
  hopFeeMsat,
} from '@bitcoin4plebs/lightning-logic';
import { attemptRoute } from './payment-attempt';
it('fails hidden-liquidity/offline fixtures and retries without deducting from the invoice', () => {
  const routes = findRoutes(BOLT7_EXAMPLE_GRAPH, 'A', 'C', 1_000_000);
  const throughB = routes.find((r) => r.hops.some((h) => h.from === 'B'));
  const throughD = routes.find((r) => r.hops.some((h) => h.from === 'D'));
  if (!throughB || !throughD) throw new Error('Expected both fixture routes');
  for (const fixture of ['low-liquidity', 'offline'] as const) {
    expect(attemptRoute(throughB, fixture)).toMatchObject({
      ok: false,
      deliveredMsat: 0,
      chargedMsat: 0,
    });
    expect(attemptRoute(throughD, fixture)).toMatchObject({
      ok: true,
      deliveredMsat: 1_000_000,
      chargedMsat: throughD.totalSendMsat,
    });
  }
  expect(attemptRoute(throughB, 'ready').chargedMsat).toBe(
    1_000_000 + throughB.totalFeeMsat,
  );
  expect(
    hopFeeMsat(
      {
        from: 'B',
        to: 'C',
        feeBaseMsat: 200,
        feeProportionalMillionths: 2000,
        cltvExpiryDelta: 20,
      },
      4_999_999,
    ),
  ).toBe(10_199);
});
