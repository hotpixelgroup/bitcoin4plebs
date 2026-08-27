import { lazy, type ComponentType } from 'react';

/**
 * The inline-figure registry, on demand for the same reason as the
 * runners: a quest page needs its own figures and none of the others.
 */

const vizzes: Record<string, ComponentType> = {
  'channel-footprint': lazy(() =>
    import('./channel-footprint').then((m) => ({ default: m.ChannelFootprint }))
  ),
  'revocation-ladder': lazy(() =>
    import('./revocation-ladder').then((m) => ({ default: m.RevocationLadder }))
  ),
  'htlc-chain': lazy(() =>
    import('./htlc-chain').then((m) => ({ default: m.HtlcChain }))
  ),
  'invoice-anatomy': lazy(() =>
    import('./invoice-anatomy').then((m) => ({ default: m.InvoiceAnatomy }))
  ),
  'liquidity-seesaw': lazy(() =>
    import('./liquidity-seesaw').then((m) => ({ default: m.LiquiditySeesaw }))
  ),
  'fee-calculator': lazy(() =>
    import('./fee-calculator').then((m) => ({ default: m.FeeCalculator }))
  ),
  'route-race': lazy(() =>
    import('./route-race').then((m) => ({ default: m.RouteRace }))
  ),
  'onion-peel': lazy(() =>
    import('./onion-peel').then((m) => ({ default: m.OnionPeel }))
  ),
  'bitshift-halving': lazy(() =>
    import('./bitshift-halving').then((m) => ({ default: m.BitshiftHalving }))
  ),
  'utxo-flow': lazy(() =>
    import('./utxo-flow').then((m) => ({ default: m.UtxoFlow }))
  ),
  'fiftyone-race': lazy(() =>
    import('./fiftyone-race').then((m) => ({ default: m.FiftyoneRace }))
  ),
  'activation-timeline': lazy(() =>
    import('./activation-timeline').then((m) => ({ default: m.ActivationTimeline }))
  ),
  'avalanche-grid': lazy(() =>
    import('./avalanche-grid').then((m) => ({ default: m.AvalancheGrid }))
  ),
  'difficulty-thermostat': lazy(() =>
    import('./difficulty-thermostat').then((m) => ({ default: m.DifficultyThermostat }))
  ),
  'gossip-network': lazy(() =>
    import('./gossip-network').then((m) => ({ default: m.GossipNetwork }))
  ),
  'tamper-cascade': lazy(() =>
    import('./tamper-cascade').then((m) => ({ default: m.TamperCascade }))
  ),
  'merkle-lightning': lazy(() =>
    import('./merkle-lightning').then((m) => ({ default: m.MerkleLightning }))
  ),
  'address-pipeline': lazy(() =>
    import('./address-pipeline').then((m) => ({ default: m.AddressPipeline }))
  ),
  'shared-ledger': lazy(() =>
    import('./shared-ledger').then((m) => ({ default: m.SharedLedger }))
  ),
  'incentive-machine': lazy(() =>
    import('./incentive-machine').then((m) => ({ default: m.IncentiveMachine }))
  ),
  'money-scorecard': lazy(() =>
    import('./money-scorecard').then((m) => ({ default: m.MoneyScorecard }))
  ),
  'energy-to-security': lazy(() =>
    import('./energy-to-security').then((m) => ({ default: m.EnergyToSecurity }))
  ),
};

export function getViz(id: string): ComponentType | undefined {
  return vizzes[id];
}
