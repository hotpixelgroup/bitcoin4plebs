import type { ComponentType } from 'react';
import { ActivationTimeline } from './activation-timeline';
import { AddressPipeline } from './address-pipeline';
import { AvalancheGrid } from './avalanche-grid';
import { BitshiftHalving } from './bitshift-halving';
import { DifficultyThermostat } from './difficulty-thermostat';
import { FiftyoneRace } from './fiftyone-race';
import { GossipNetwork } from './gossip-network';
import { MerkleLightning } from './merkle-lightning';
import { TamperCascade } from './tamper-cascade';
import { UtxoFlow } from './utxo-flow';

/**
 * The inline-figure registry: quest stops reference visualizations by id
 * (Stop.viz), keeping quest content pure serializable data — the exact
 * pattern the finale runner registry uses.
 */
const vizzes: Record<string, ComponentType> = {
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
};

export function getViz(id: string): ComponentType | undefined {
  return vizzes[id];
}
