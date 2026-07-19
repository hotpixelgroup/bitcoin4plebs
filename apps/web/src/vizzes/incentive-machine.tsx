import { useState } from 'react';
import { VizFigure } from './viz-figure';

type ActorId = 'users' | 'miners' | 'nodes' | 'builders';

interface Actor {
  id: ActorId;
  name: string;
  wants: string;
  power: string;
  checkedBy: string;
}

const ACTORS: Actor[] = [
  {
    id: 'users',
    name: 'Users & holders',
    wants: 'Cheap, final payments and money nobody can dilute.',
    power: 'They are the demand: their bids fund mining, and what they will accept as payment defines which chain is "bitcoin."',
    checkedBy: 'The auction. Nobody waits on their behalf; pay the going rate or wait for it to decay.',
  },
  {
    id: 'miners',
    name: 'Miners',
    wants: 'Fees plus the block subsidy, in coins the market will actually buy.',
    power: 'They choose which waiting transactions get into the next block, best bid first.',
    checkedBy: 'Full nodes orphan any block that cheats, and rival miners happily take any fee they refuse.',
  },
  {
    id: 'nodes',
    name: 'Full nodes',
    wants: 'Sound money: every rule checked, no trust extended to anyone.',
    power: 'The veto. Blocks they reject never become money, no matter how much hashpower mined them.',
    checkedBy: 'Nothing to cheat for: a node that loosens its own rules just quietly exits to a different coin (2017 proved which side wins).',
  },
  {
    id: 'builders',
    name: 'Wallet builders',
    wants: 'Users. Fee pain drives users away, so fee pain is their to-do list.',
    power: 'Efficiency: batching, SegWit, taproot, Lightning. Every fee crisis in history shipped one of these.',
    checkedBy: 'Users switch wallets in a minute. Serve them or vanish.',
  },
];

/**
 * The four-crowd incentive machine: tap each crowd to see what it wants,
 * what it controls, and who keeps it honest. The layout mirrors the loop:
 * bids flow to miners, blocks flow to nodes, accepted blocks become the
 * money users bid with, and fee pain recruits builders on the side.
 */
export function IncentiveMachine() {
  const [selected, setSelected] = useState<ActorId>('users');
  const actor = ACTORS.find((a) => a.id === selected) as Actor;

  return (
    <VizFigure
      title="The machine with no operator"
      caption="Tap each crowd. Every one of them is selfish; every one of them is checked by another."
    >
      <div className="im-loop" role="group" aria-label="The four crowds of the Bitcoin network">
        {ACTORS.map((a, i) => (
          <span key={a.id} className="im-hop">
            <button
              className={`im-actor ${selected === a.id ? 'im-actor-on' : ''}`}
              onClick={() => setSelected(a.id)}
              aria-pressed={selected === a.id}
            >
              {a.name}
            </button>
            {i < ACTORS.length - 1 && (
              <span className="im-edge" aria-hidden="true">
                {i === 0 ? '→ fee bids →' : i === 1 ? '→ candidate blocks →' : '→ fee pain →'}
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="im-return">
        <span aria-hidden="true">↻</span> and the blocks nodes accept become the very money users
        bid with · builders hand back cheaper vbytes
      </p>
      <div className="im-detail" aria-live="polite">
        <div className="im-detail-name">{actor.name}</div>
        <div className="im-detail-row">
          <span className="im-detail-label">wants</span>
          <span>{actor.wants}</span>
        </div>
        <div className="im-detail-row">
          <span className="im-detail-label">holds</span>
          <span>{actor.power}</span>
        </div>
        <div className="im-detail-row">
          <span className="im-detail-label">checked by</span>
          <span>{actor.checkedBy}</span>
        </div>
      </div>
      <div className="im-thermos">
        <span className="im-thermo">
          fee floor · a surge ratchets it up, then it halves every 12 h (txmempool.cpp)
        </span>
        <span className="im-thermo">
          retarget · hashpower comes and goes, the ten-minute pace holds (Quest #6)
        </span>
      </div>
    </VizFigure>
  );
}
