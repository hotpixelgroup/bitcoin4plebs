import type { ComponentType } from 'react';
import type { Finale } from '@bitcoin4plebs/quests';
import { AddressXray } from './address/address-xray';
import { ChannelSimulator } from './lightning/channel-simulator';
import { ClusterDetective } from './privacy/cluster-detective';
import { DoubleSpend } from './doublespend/double-spend';
import { RewriteCost } from './rewrite/rewrite-cost';
import { EmissionRunner } from './emission/emission-runner';
import { FeeAuction } from './feemarket/fee-auction';
import { ForkYourself } from './fork/fork-yourself';
import { GenesisHash } from './genesis/genesis-hash';
import { HalvingClock } from './halving/halving-clock';
import { GuessTheKey } from './keyspace/guess-the-key';
import { MineABlock } from './mining/mine-a-block';
import { PolicyPicker } from './policy/policy-picker';
import { SeedStudio } from './seed/seed-studio';
import { SignetTracker } from './signet/signet-tracker';
import { StressNetwork } from './stress/stress-network';
import { SupplyCheck } from './supply/supply-check';
import { RunTheCheck } from './txcheck/run-the-check';

export interface RunnerProps {
  finale: Finale;
}

/**
 * Runner registry: quest data references interactive finales by id, which
 * keeps quests pure data (serializable, API-loadable). Each new kind of
 * "run it yourself" experience registers exactly one component here.
 */
const runners: Record<string, ComponentType<RunnerProps>> = {
  'emission-schedule': EmissionRunner,
  'halving-clock': HalvingClock,
  'guess-the-key': GuessTheKey,
  'fork-yourself': ForkYourself,
  'run-the-check': RunTheCheck,
  'mine-a-block': MineABlock,
  'fee-auction': FeeAuction,
  'genesis-hash': GenesisHash,
  'supply-check': SupplyCheck,
  'address-xray': AddressXray,
  'signet-tracker': SignetTracker,
  'stress-network': StressNetwork,
  'policy-picker': PolicyPicker,
  'seed-studio': SeedStudio,
  'cluster-detective': ClusterDetective,
  'channel-simulator': ChannelSimulator,
  'double-spend': DoubleSpend,
  'rewrite-cost': RewriteCost,
};

export function getRunner(id: string): ComponentType<RunnerProps> | undefined {
  return runners[id];
}
