import { useMemo, useState } from 'react';
import {
  blockConnected,
  DEFAULT_MAX_MEMPOOL_BYTES,
  getBlockSubsidy,
  getMinFee,
  initialFeeFloor,
  satsToBtc,
  trackPackageRemoved,
} from '@bitcoin4plebs/bitcoin-logic';
import { Callout, RichText } from '@bitcoin4plebs/ui';
import type { RunnerProps } from '../registry';

type ScenarioId = 'fad' | 'greedy' | 'majority' | 'filter';

interface Step {
  title: string;
  body: string;
  stats?: Array<{ label: string; value: string }>;
  tone?: 'good' | 'bad';
}

interface Scenario {
  id: ScenarioId;
  chip: string;
  heading: string;
  steps: Step[];
  lesson: string;
}

/** A fixed illustrative height in era 5 (reward 3.125 BTC), so numbers are stable. */
const SIM_HEIGHT = 958_650;
const HOUR = 3600;
const FULL = DEFAULT_MAX_MEMPOOL_BYTES;

const perVb = (feePerKvB: number) => {
  const v = feePerKvB / 1000;
  return v >= 1 ? v.toFixed(1) : v.toFixed(2);
};

/**
 * The data-fad scenario runs the site's 1:1 GetMinFee translation with a
 * simulated clock, so every floor number below is the real algorithm's
 * output, not a screenplay.
 */
function fadSteps(): Step[] {
  let floor = initialFeeFloor(0);
  const read = (t: number, usage: number) => {
    const r = getMinFee(floor, { nowSeconds: t, usageBytes: usage });
    floor = r.floor;
    return r.feePerKvB;
  };

  const steps: Step[] = [];
  steps.push({
    title: 'Tuesday, 9:00 · calm',
    body: 'The queue is light. **Ana** broadcasts a plain 2 sat/vB payment to Bo; it would confirm within a block or two.',
    stats: [
      { label: 'mempool floor', value: `${perVb(read(0, 0))} sat/vB` },
      { label: "Ana's bid", value: '2 sat/vB · relaying' },
    ],
  });

  floor = trackPackageRemoved(floor, 30_100);
  steps.push({
    title: '10:00 · a collectible mint goes viral',
    body: 'Six hours of demand arrives in one. The 300 MB queue overflows and starts **evicting** the cheapest packages; the last one evicted paid 30 sat/vB, so `trackPackageRemoved` ratchets the floor just above it. Bids under the floor are no longer even relayed. Ana has not been censored; she has been outbid.',
    tone: 'bad',
    stats: [
      { label: 'mempool floor', value: '30.1 sat/vB' },
      { label: "Ana's bid", value: '2 sat/vB · waiting, unrelayed' },
    ],
  });

  floor = blockConnected(floor);
  const at12h = read(12 * HOUR, FULL);
  steps.push({
    title: 'Wednesday morning · the half-life bites',
    body: 'Twelve simulated hours pass with the queue still full. `GetMinFee` has been decaying the floor the entire time, halving it every `ROLLING_FEE_HALFLIFE`. To keep the floor up, the fad must keep outbidding itself; calm is the default the code returns to.',
    stats: [{ label: 'mempool floor', value: `${perVb(at12h)} sat/vB` }],
  });

  const at24h = read(24 * HOUR, FULL / 5);
  steps.push({
    title: 'Thursday · the fad exhausts',
    body: 'Mints stop; blocks drain the queue below a quarter full, and the decay runs **four times faster** (lines 846 to 849). Ana’s patient 2 sat/vB transaction relays again and confirms during the drain.',
    tone: 'good',
    stats: [
      { label: 'mempool floor', value: `${perVb(at24h)} sat/vB` },
      { label: "Ana's bid", value: '2 sat/vB · confirmed' },
    ],
  });

  read(36 * HOUR, FULL / 10);
  const at48h = read(48 * HOUR, FULL / 10);
  steps.push({
    title: 'Saturday · zero',
    body: 'The floor falls under half the incremental relay fee and snaps to **zero**. Total cost of the crisis to a patient user: waiting. And fee crises leave gifts behind: 2017’s spike drove SegWit adoption and batching, 2023’s drove Lightning growth. Fee pain is the network hiring engineers.',
    tone: 'good',
    stats: [{ label: 'mempool floor', value: `${perVb(at48h)} sat/vB` }],
  });
  return steps;
}

function greedySteps(): Step[] {
  const honest = getBlockSubsidy(SIM_HEIGHT);
  const claimed = honest * 2n;
  return [
    {
      title: `Height ${SIM_HEIGHT.toLocaleString('en-US')} · the claim`,
      body: `A large pool decides the halvings were optional and writes itself a coinbase of **${satsToBtc(claimed)} BTC** instead of ${satsToBtc(honest)} plus fees.`,
      stats: [
        { label: 'allowed (subsidy)', value: `${satsToBtc(honest)} BTC + fees` },
        { label: 'claimed', value: `${satsToBtc(claimed)} BTC` },
      ],
    },
    {
      title: 'Seconds later · bad-cb-amount',
      body: 'Every node on Earth runs the five lines you read in stop 4: claimed exceeds `nFees + GetBlockSubsidy(...)`, so the block is **discarded before anyone hears about it twice**. The reward now exists on exactly zero computers. The electricity bill exists on exactly one.',
      tone: 'bad',
      stats: [
        { label: 'nodes accepting the block', value: '0' },
        { label: 'reward that exists', value: '0 BTC' },
      ],
    },
    {
      title: 'Stubbornness tax',
      body: `Try it four blocks in a row: that is 4 × ${satsToBtc(honest)} = **${satsToBtc(honest * 4n)} BTC** of honest revenue forfeited, plus four blocks of very real power, while an honest competitor mined those heights and kept everything.`,
      tone: 'bad',
      stats: [{ label: 'honest revenue forfeited', value: `${satsToBtc(honest * 4n)} BTC + fees` }],
    },
    {
      title: 'Why this never makes the news',
      body: 'Nobody polices this and nobody needs to. Cheating is not forbidden; it is **unprofitable**, which is a stronger deterrent, because it works on people with no respect for rules.',
      tone: 'good',
    },
  ];
}

function majoritySteps(): Step[] {
  return [
    {
      title: 'The fork',
      body: '80% of hashpower forks to "BigBlockCoin" with looser rules. No balance moves anywhere; there are simply two lists now, and every economic node you know stays on the old one.',
      stats: [
        { label: 'their hashpower', value: '80%' },
        { label: 'your chain keeps', value: '20%' },
      ],
    },
    {
      title: 'The physics bill arrives',
      body: 'Your chain slows to roughly 10 ÷ 0.2 = **50-minute blocks** until its next retarget, which is 2,016 blocks ≈ **70 days** away at that pace. Painful, survivable, temporary: the thermostat from Quest #6 eventually re-tunes to whatever hashpower remains.',
      tone: 'bad',
      stats: [
        { label: 'your block pace', value: '≈ 50 min' },
        { label: 'until retarget', value: '2,016 blocks ≈ 70 days' },
      ],
    },
    {
      title: 'The market bill arrives, for them',
      body: 'Their chain mints coins the economy will not recognize as bitcoin. Suppose the fork token trades at a tenth of the price (an assumption, and a generous one). A 3.125-coin reward in tenth-price tokens pays like **0.3 BTC**; mining the minority-but-real chain pays 3.125. Hashpower follows revenue home.',
      stats: [
        { label: 'reward, real chain', value: '3.125 BTC' },
        { label: 'reward, fork (at 1/10 price)', value: '≈ 0.31 BTC-equivalent' },
      ],
    },
    {
      title: '2017 already ran this experiment',
      body: 'SegWit2x had over 80% of hashpower publicly signed on and essentially zero economic nodes. It was canceled **before mining a single block**. Miners are employees on commission; economic nodes are the customers, and the customers define the product.',
      tone: 'good',
    },
  ];
}

function filterSteps(): Step[] {
  return [
    {
      title: 'You raise the drawbridge',
      body: 'You run a strict relay policy: `-datacarriersize 83`, the old default, the same spirit as Bitcoin Knots. A 40,000-vbyte inscription paying 25 sat/vB arrives at your node’s door.',
      stats: [{ label: 'your datacarriersize', value: '83 bytes' }],
    },
    {
      title: 'Your mempool stays clean. The network shrugs.',
      body: 'Your node refuses to relay it, exactly as configured. Eight of your ten peers relay it anyway, and one of them peers with a mining pool. Filters are per-node **taste**; the gossip network routes around any single palate.',
      stats: [
        { label: 'your mempool', value: 'clean' },
        { label: 'paths to a miner', value: 'plenty' },
      ],
    },
    {
      title: 'The block arrives',
      body: 'The next block includes the inscription. Your node checks **consensus** rules only: valid. The block enters your chain, inscription and all. Your filter changed your bandwidth and your queue; it did not change the ledger.',
      tone: 'bad',
      stats: [{ label: 'your node’s verdict on the block', value: 'accept' }],
    },
    {
      title: 'The escalation, and the next quest',
      body: 'Even if every node filtered by default, a determined payer can hand the transaction **straight to a pool**; one willing miner anywhere is enough. Policy expresses values; only consensus binds everyone. Moving this fight into consensus is exactly what [BIP-110 proposes](/quests/the-data-wars), and it deserves a whole quest.',
      tone: 'good',
    },
  ];
}

const SCENARIOS: Array<Omit<Scenario, 'steps'> & { build: () => Step[] }> = [
  {
    id: 'fad',
    chip: 'a data fad floods the queue',
    heading: 'Shock #1 · six hours of demand in one hour',
    build: fadSteps,
    lesson:
      'The auction absorbed it: eviction set a price, the half-life erased it, and a patient bidder was delayed, never refused.',
  },
  {
    id: 'greedy',
    chip: 'a miner prints extra coins',
    heading: 'Shock #2 · the halving is declared optional',
    build: greedySteps,
    lesson: 'The veto absorbed it: a block nobody accepts is a power bill with no product.',
  },
  {
    id: 'majority',
    chip: '80% of miners change the rules',
    heading: 'Shock #3 · the majority forks off',
    build: majoritySteps,
    lesson:
      'The market absorbed it: hashpower can leave, but it cannot take the customers with it.',
  },
  {
    id: 'filter',
    chip: 'you filter what you dislike',
    heading: 'Shock #4 · your node, your taste',
    build: filterSteps,
    lesson:
      'Nothing absorbed this one, and that is the honest lesson: policy is personal, only consensus is universal.',
  },
];

/**
 * The stress-the-network simulator: four shocks, each played out step by
 * step. The fee numbers come from the site's 1:1 GetMinFee translation
 * driven by a simulated clock; the reward numbers from GetBlockSubsidy.
 */
export function StressNetwork({ finale }: RunnerProps) {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('fad');
  const [revealed, setRevealed] = useState(1);
  const scenarios = useMemo(
    () => SCENARIOS.map((s) => ({ ...s, steps: s.build() })),
    []
  );
  const scenario = scenarios.find((s) => s.id === scenarioId) as Scenario;
  const done = revealed >= scenario.steps.length;

  return (
    <div className="stress">
      <div className="stress-chips" role="group" aria-label="Pick a shock to throw at the network">
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={`preset ${s.id === scenarioId ? 'preset-active' : ''}`}
            aria-pressed={s.id === scenarioId}
            onClick={() => {
              setScenarioId(s.id);
              setRevealed(1);
            }}
          >
            {s.chip}
          </button>
        ))}
      </div>

      <div className="viz-title">{scenario.heading}</div>
      <ol className="stress-steps">
        {scenario.steps.slice(0, revealed).map((step, i) => (
          <li key={i} className={`stress-step ${step.tone ? `stress-${step.tone}` : ''}`}>
            <div className="stress-step-title">{step.title}</div>
            <p className="stress-step-body">
              <RichText text={step.body} />
            </p>
            {step.stats && (
              <div className="stat-grid stress-stats">
                {step.stats.map((stat) => (
                  <div className="stat" key={stat.label}>
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      {!done ? (
        <button className="runbtn" onClick={() => setRevealed((r) => r + 1)}>
          next: what happens?
        </button>
      ) : (
        <Callout>
          <strong>What absorbed the shock?</strong> <RichText text={scenario.lesson} />
        </Callout>
      )}

      {finale.note && (
        <p className="finale-note">
          <RichText text={finale.note} />
        </p>
      )}
    </div>
  );
}
