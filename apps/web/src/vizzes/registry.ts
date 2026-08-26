import type { ComponentType } from 'react';
import { ActivationTimeline } from './activation-timeline';
import { AddressPipeline } from './address-pipeline';
import { AvalancheGrid } from './avalanche-grid';
import { ChannelFootprint } from './channel-footprint';
import { HtlcChain } from './htlc-chain';
import { OnionPeel } from './onion-peel';
import { RevocationLadder } from './revocation-ladder';
import { BitshiftHalving } from './bitshift-halving';
import { DifficultyThermostat } from './difficulty-thermostat';
import { EnergyToSecurity } from './energy-to-security';
import { FiftyoneRace } from './fiftyone-race';
import { GossipNetwork } from './gossip-network';
import { IncentiveMachine } from './incentive-machine';
import { MerkleLightning } from './merkle-lightning';
import { MoneyScorecard } from './money-scorecard';
import { SharedLedger } from './shared-ledger';
import { TamperCascade } from './tamper-cascade';
import { UtxoFlow } from './utxo-flow';

/**
 * The inline-figure registry: quest stops reference visualizations by id
 * (Stop.viz), keeping quest content pure serializable data — the exact
 * pattern the finale runner registry uses.
 */
const vizzes: Record<string, ComponentType> = {
  // lightning4plebs
  'channel-footprint': ChannelFootprint,
  'revocation-ladder': RevocationLadder,
  'htlc-chain': HtlcChain,
  'onion-peel': OnionPeel,
  'bitshift-halving': BitshiftHalving,
  'utxo-flow': UtxoFlow,
  'fiftyone-race': FiftyoneRace,
  'activation-timeline': ActivationTimeline,
  'avalanche-grid': AvalancheGrid,
  'difficulty-thermostat': DifficultyThermostat,
  'gossip-network': GossipNetwork,
  'tamper-cascade': TamperCascade,
  'merkle-lightning': MerkleLightning,
  'address-pipeline': AddressPipeline,
  'shared-ledger': SharedLedger,
  'incentive-machine': IncentiveMachine,
  'money-scorecard': MoneyScorecard,
  'energy-to-security': EnergyToSecurity,
};

export function getViz(id: string): ComponentType | undefined {
  return vizzes[id];
}
