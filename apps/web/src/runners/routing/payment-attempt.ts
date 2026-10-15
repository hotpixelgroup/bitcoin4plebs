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

/** Private equal-capacity fixtures in msat; excludes fees/reserves from capacity limits.
 * Reserve every hop first; failed attempts release all reservations, fulfilled ones
 * transfer exactly each hop's amount, preserving each channel's two-sided total. */
export function routeBalanceTrace(route: Route, fixture: RouteFixture) {
  const result = attemptRoute(route, fixture);
  const failureIndex = result.ok
    ? Infinity
    : route.hops.findIndex((h) =>
        fixture === 'offline' ? h.to === 'B' : h.from === 'B' && h.to === 'C',
      );
  return route.hops.map((hop, index) => {
    const before =
      hop.from === 'B' && hop.to === 'C' && fixture === 'low-liquidity'
        ? 500_000
        : 100_000_000;
    const capacity = 200_000_000;
    const reserved = index < failureIndex ? hop.amountMsat : 0;
    return {
      from: hop.from,
      to: hop.to,
      before,
      reverseBefore: capacity - before,
      reserved,
      after: result.ok ? before - hop.amountMsat : before,
      reverseAfter: result.ok
        ? capacity - before + hop.amountMsat
        : capacity - before,
      released: !result.ok,
      delivered: result.ok,
    };
  });
}
