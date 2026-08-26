/**
 * BOLT #7: how a payment finds its way, and what it costs.
 *
 * Two ideas, and both are simpler than they sound.
 *
 * A node ANNOUNCES its terms — what it charges to forward, and how much
 * timelock it insists on — in a `channel_update`. Nobody sets these
 * centrally; every node picks its own and gossips them, which makes the
 * fee "market" the sum of thousands of independent decisions rather than
 * a schedule anyone publishes.
 *
 * A sender then CHOOSES a route by adding those advertised costs up. The
 * fee formula is fixed by the spec; what varies is what each node puts
 * into it. That is the whole of Lightning's fee system.
 */

/** One direction of one channel, as its owner advertises it. */
export interface ChannelPolicy {
  /** Who charges this — the node forwarding out of this channel. */
  from: string;
  to: string;
  /** Flat charge per forward, in millisatoshis. */
  feeBaseMsat: number;
  /** Proportional charge, in millionths of the amount forwarded. */
  feeProportionalMillionths: number;
  /** Extra timelock this hop insists on, in blocks. */
  cltvExpiryDelta: number;
  /** Smallest HTLC this hop will accept, in millisatoshis. */
  htlcMinimumMsat?: number;
  /** Largest HTLC this hop will accept — its liquidity ceiling. */
  htlcMaximumMsat?: number;
}

/**
 * The fee one hop charges to forward an amount, exactly as BOLT #7 states
 * it:
 *
 *   fee_base_msat + ( amount_to_forward * fee_proportional_millionths / 1000000 )
 *
 * Integer arithmetic throughout — the division truncates, which is why
 * the specification's own worked example lands on 10,199 and not 10,200.
 */
export function hopFeeMsat(policy: ChannelPolicy, amountToForwardMsat: number): number {
  return (
    policy.feeBaseMsat +
    Math.floor((amountToForwardMsat * policy.feeProportionalMillionths) / 1_000_000)
  );
}

export interface RouteHop {
  from: string;
  to: string;
  /** What flows through this channel. */
  amountMsat: number;
  /**
   * What the node at the START of this channel charges to forward out of
   * it. Zero for the first channel: that node is the sender, and a sender
   * does not charge itself.
   */
  feeMsat: number;
  /** Timelock this hop adds, for the same reason and with the same zero. */
  cltvExpiryDelta: number;
}

export interface Route {
  hops: RouteHop[];
  /** What the sender must part with, including every fee on the way. */
  totalSendMsat: number;
  /** Fees only. */
  totalFeeMsat: number;
  /** Total timelock the sender must commit to, in blocks. */
  totalCltvDelta: number;
}

/**
 * Work a route's costs out from the destination backwards.
 *
 * Backwards is forced, not stylistic: a hop charges on the amount it
 * forwards, and that depends on what every later hop needs. The only
 * fixed number is the one at the end — what the payee must receive.
 *
 * The subtle part, and the thing most explanations get wrong: a node
 * charges using the policy of the channel it forwards OUT of, not the one
 * the payment arrived on. In A->B->C, the fee B takes is the one B
 * advertised on B->C. BOLT #7 spells this out in its worked example, and
 * routing.spec.ts checks our arithmetic against the number it prints.
 *
 * The consequence is that the FIRST channel is free — the sender is the
 * one forwarding out of it, and it does not charge itself.
 */
export function buildRoute(
  path: readonly ChannelPolicy[],
  finalAmountMsat: number,
  finalCltvDelta = 0
): Route {
  const amounts = new Array<number>(path.length);
  const fees = new Array<number>(path.length).fill(0);

  // What the last channel carries is simply what the payee receives.
  amounts[path.length - 1] = finalAmountMsat;
  for (let k = path.length - 2; k >= 0; k--) {
    fees[k + 1] = hopFeeMsat(path[k + 1], amounts[k + 1]);
    amounts[k] = amounts[k + 1] + fees[k + 1];
  }

  const hops: RouteHop[] = path.map((policy, k) => ({
    from: policy.from,
    to: policy.to,
    amountMsat: amounts[k],
    feeMsat: fees[k],
    cltvExpiryDelta: k === 0 ? 0 : policy.cltvExpiryDelta,
  }));

  const totalSendMsat = amounts[0];
  return {
    hops,
    totalSendMsat,
    totalFeeMsat: totalSendMsat - finalAmountMsat,
    totalCltvDelta:
      finalCltvDelta + path.slice(1).reduce((sum, p) => sum + p.cltvExpiryDelta, 0),
  };
}

/** Can this hop carry the amount at all? Limits are advertised, not guessed. */
export function hopCanCarry(policy: ChannelPolicy, amountMsat: number): boolean {
  if (policy.htlcMinimumMsat !== undefined && amountMsat < policy.htlcMinimumMsat) return false;
  if (policy.htlcMaximumMsat !== undefined && amountMsat > policy.htlcMaximumMsat) return false;
  return true;
}

/**
 * Find the cheapest route by total fee.
 *
 * Deliberately an exhaustive search over simple paths rather than a
 * Dijkstra: real pathfinding is Dijkstra-ish but the cost of an edge
 * depends on the amount flowing through it, which depends on the hops
 * after it — so the tidy textbook version does not quite apply, and
 * implementations all approximate. On the handful of nodes a reader
 * will explore, exhaustive is exact and easy to check by hand.
 */
export function findCheapestRoute(
  graph: readonly ChannelPolicy[],
  source: string,
  destination: string,
  finalAmountMsat: number,
  options: { maxHops?: number; finalCltvDelta?: number } = {}
): Route | null {
  const maxHops = options.maxHops ?? 6;
  let best: Route | null = null;

  const walk = (at: string, path: ChannelPolicy[], visited: Set<string>) => {
    if (path.length > maxHops) return;
    if (at === destination && path.length > 0) {
      const route = buildRoute(path, finalAmountMsat, options.finalCltvDelta ?? 0);
      // Check every hop can actually carry what it is being asked to.
      const carries = route.hops.every((hop, i) => hopCanCarry(path[i], hop.amountMsat));
      if (carries && (!best || route.totalFeeMsat < best.totalFeeMsat)) best = route;
      return;
    }
    for (const edge of graph) {
      if (edge.from !== at || visited.has(edge.to)) continue;
      visited.add(edge.to);
      path.push(edge);
      walk(edge.to, path, visited);
      path.pop();
      visited.delete(edge.to);
    }
  };

  walk(source, [], new Set([source]));
  return best;
}

/** Every route from source to destination, cheapest first. */
export function findRoutes(
  graph: readonly ChannelPolicy[],
  source: string,
  destination: string,
  finalAmountMsat: number,
  options: { maxHops?: number; finalCltvDelta?: number } = {}
): Route[] {
  const maxHops = options.maxHops ?? 6;
  const found: Route[] = [];

  const walk = (at: string, path: ChannelPolicy[], visited: Set<string>) => {
    if (path.length > maxHops) return;
    if (at === destination && path.length > 0) {
      const route = buildRoute(path, finalAmountMsat, options.finalCltvDelta ?? 0);
      if (route.hops.every((hop, i) => hopCanCarry(path[i], hop.amountMsat))) found.push(route);
      return;
    }
    for (const edge of graph) {
      if (edge.from !== at || visited.has(edge.to)) continue;
      visited.add(edge.to);
      path.push(edge);
      walk(edge.to, path, visited);
      path.pop();
      visited.delete(edge.to);
    }
  };

  walk(source, [], new Set([source]));
  return found.sort((a, b) => a.totalFeeMsat - b.totalFeeMsat);
}

/**
 * The four-node network BOLT #7 uses for its own worked example, with the
 * eight `channel_update` messages it says the network will see.
 * routing.spec.ts checks these against the pinned specification.
 */
export const BOLT7_EXAMPLE_GRAPH: readonly ChannelPolicy[] = [
  { from: 'A', to: 'B', feeBaseMsat: 100, feeProportionalMillionths: 1000, cltvExpiryDelta: 10 },
  { from: 'A', to: 'D', feeBaseMsat: 100, feeProportionalMillionths: 1000, cltvExpiryDelta: 10 },
  { from: 'B', to: 'A', feeBaseMsat: 200, feeProportionalMillionths: 2000, cltvExpiryDelta: 20 },
  { from: 'D', to: 'A', feeBaseMsat: 400, feeProportionalMillionths: 4000, cltvExpiryDelta: 40 },
  { from: 'B', to: 'C', feeBaseMsat: 200, feeProportionalMillionths: 2000, cltvExpiryDelta: 20 },
  { from: 'D', to: 'C', feeBaseMsat: 400, feeProportionalMillionths: 4000, cltvExpiryDelta: 40 },
  { from: 'C', to: 'B', feeBaseMsat: 300, feeProportionalMillionths: 3000, cltvExpiryDelta: 30 },
  { from: 'C', to: 'D', feeBaseMsat: 300, feeProportionalMillionths: 3000, cltvExpiryDelta: 30 },
];
