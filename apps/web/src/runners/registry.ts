import { lazy, type ComponentType } from 'react';
import type { Finale } from '@bitcoin4plebs/quests/content';

export interface RunnerProps {
  finale: Finale;
}

/**
 * Runner registry. Each finale loads on demand rather than shipping with
 * the app: a reader opening one quest has no use for the other thirty
 * machines, and several of them carry real cryptography.
 */

const runners: Record<string, ComponentType<RunnerProps>> = {
  'emission-schedule': lazy(() =>
    import('./emission/emission-runner').then((m) => ({ default: m.EmissionRunner }))
  ),
  'halving-clock': lazy(() =>
    import('./halving/halving-clock').then((m) => ({ default: m.HalvingClock }))
  ),
  'guess-the-key': lazy(() =>
    import('./keyspace/guess-the-key').then((m) => ({ default: m.GuessTheKey }))
  ),
  'fork-yourself': lazy(() =>
    import('./fork/fork-yourself').then((m) => ({ default: m.ForkYourself }))
  ),
  'run-the-check': lazy(() =>
    import('./txcheck/run-the-check').then((m) => ({ default: m.RunTheCheck }))
  ),
  'mine-a-block': lazy(() =>
    import('./mining/mine-a-block').then((m) => ({ default: m.MineABlock }))
  ),
  'fee-auction': lazy(() =>
    import('./feemarket/fee-auction').then((m) => ({ default: m.FeeAuction }))
  ),
  'genesis-hash': lazy(() =>
    import('./genesis/genesis-hash').then((m) => ({ default: m.GenesisHash }))
  ),
  'supply-check': lazy(() =>
    import('./supply/supply-check').then((m) => ({ default: m.SupplyCheck }))
  ),
  'address-xray': lazy(() =>
    import('./address/address-xray').then((m) => ({ default: m.AddressXray }))
  ),
  'signet-tracker': lazy(() =>
    import('./signet/signet-tracker').then((m) => ({ default: m.SignetTracker }))
  ),
  'stress-network': lazy(() =>
    import('./stress/stress-network').then((m) => ({ default: m.StressNetwork }))
  ),
  'policy-picker': lazy(() =>
    import('./policy/policy-picker').then((m) => ({ default: m.PolicyPicker }))
  ),
  'seed-studio': lazy(() =>
    import('./seed/seed-studio').then((m) => ({ default: m.SeedStudio }))
  ),
  'cluster-detective': lazy(() =>
    import('./privacy/cluster-detective').then((m) => ({ default: m.ClusterDetective }))
  ),
  'channel-simulator': lazy(() =>
    import('./lightning/channel-simulator').then((m) => ({ default: m.ChannelSimulator }))
  ),
  'revocation-forge': lazy(() =>
    import('./revocation/revocation-forge').then((m) => ({ default: m.RevocationForge }))
  ),
  'invoice-decoder': lazy(() =>
    import('./invoice/invoice-decoder').then((m) => ({ default: m.InvoiceDecoder }))
  ),
  'htlc-relay': lazy(() =>
    import('./htlc/htlc-relay').then((m) => ({ default: m.HtlcRelay }))
  ),
  'onion-lab': lazy(() =>
    import('./onion/onion-lab').then((m) => ({ default: m.OnionLab }))
  ),
  'custody-check': lazy(() =>
    import('./custody/custody-check').then((m) => ({ default: m.CustodyCheck }))
  ),
  'route-finder': lazy(() =>
    import('./routing/route-finder').then((m) => ({ default: m.RouteFinder }))
  ),
  'double-spend': lazy(() =>
    import('./doublespend/double-spend').then((m) => ({ default: m.DoubleSpend }))
  ),
  'rewrite-cost': lazy(() =>
    import('./rewrite/rewrite-cost').then((m) => ({ default: m.RewriteCost }))
  ),
};

export function getRunner(id: string): ComponentType<RunnerProps> | undefined {
  return runners[id];
}
