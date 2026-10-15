import type { Route } from '@bitcoin4plebs/lightning-logic';
export type RouteFixture = 'ready' | 'low-liquidity' | 'offline';
/** Deterministic, single-part fixture; these balances are not gossip data. */
export function attemptRoute(route: Route, fixture: RouteFixture) {
  const blocked = route.hops.find((hop) => hop.from === 'B' && hop.to === 'C');
  if (blocked && fixture === 'offline')
    return {
      ok: false,
      deliveredMsat: 0,
      chargedMsat: 0,
      reason: 'B is offline. The proposed route cannot forward.',
    };
  if (blocked && fixture === 'low-liquidity' && blocked.amountMsat > 500_000)
    return {
      ok: false,
      deliveredMsat: 0,
      chargedMsat: 0,
      reason:
        'B→C has only 500 sats available in this direction. Advertised policy is not live liquidity.',
    };
  return {
    ok: true,
    deliveredMsat: route.hops.at(-1)?.amountMsat ?? 0,
    chargedMsat: route.totalSendMsat,
    reason:
      'Payment fulfilled. Recipient gets the invoice amount; sender covers forwarding fees on top.',
  };
}
