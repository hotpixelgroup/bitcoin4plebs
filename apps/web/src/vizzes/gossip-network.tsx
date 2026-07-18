import { useEffect, useState } from 'react';
import { VizFigure } from './viz-figure';

/**
 * A deterministic little peer-to-peer network: you on the left, two rings
 * of peers, each connected to a few neighbors. Broadcast a valid payment
 * and watch it ripple outward — every node verifying before relaying.
 * Broadcast a rule-breaker and watch it die at the first honest hop.
 */

interface Node {
  x: number;
  y: number;
}

const NODES: Node[] = (() => {
  const nodes: Node[] = [{ x: 42, y: 112 }]; // node 0: you
  const cx = 300;
  const cy = 112;
  for (let i = 0; i < 9; i++) {
    const angle = (Math.PI * 2 * i) / 9 + 0.35;
    nodes.push({ x: cx + Math.cos(angle) * 92, y: cy + Math.sin(angle) * 62 });
  }
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    nodes.push({ x: cx + Math.cos(angle) * 205, y: cy + Math.sin(angle) * 96 });
  }
  return nodes.map((n) => ({ x: Math.round(n.x), y: Math.round(n.y) }));
})();

const EDGES: Array<[number, number]> = (() => {
  const edges: Array<[number, number]> = [];
  const dist = (a: number, b: number) =>
    (NODES[a].x - NODES[b].x) ** 2 + (NODES[a].y - NODES[b].y) ** 2;
  // Everyone links to their 3 nearest peers — no hub, no server.
  for (let a = 0; a < NODES.length; a++) {
    const nearest = NODES.map((_, b) => b)
      .filter((b) => b !== a)
      .sort((b, c) => dist(a, b) - dist(a, c))
      .slice(0, 3);
    for (const b of nearest) {
      if (!edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
        edges.push([a, b]);
      }
    }
  }
  return edges;
})();

/** Hop distance of every node from you (breadth-first over the peer links). */
const HOPS: number[] = (() => {
  const hops = NODES.map(() => Infinity);
  hops[0] = 0;
  const queue = [0];
  while (queue.length) {
    const a = queue.shift() as number;
    for (const [x, y] of EDGES) {
      const b = x === a ? y : y === a ? x : -1;
      if (b !== -1 && hops[b] === Infinity) {
        hops[b] = hops[a] + 1;
        queue.push(b);
      }
    }
  }
  return hops;
})();

const MAX_HOP = Math.max(...HOPS);

type Mode = 'idle' | 'valid' | 'invalid';

export function GossipNetwork() {
  const [mode, setMode] = useState<Mode>('idle');
  const [wave, setWave] = useState(-1);

  useEffect(() => {
    if (mode === 'idle') return;
    setWave(0);
    const limit = mode === 'valid' ? MAX_HOP : 1;
    const timer = setInterval(() => {
      setWave((w) => {
        if (w >= limit) {
          clearInterval(timer);
          return w;
        }
        return w + 1;
      });
    }, 550);
    return () => clearInterval(timer);
  }, [mode]);

  const nodeState = (i: number): string => {
    if (mode === 'idle' || HOPS[i] > wave) return '';
    if (i === 0) return 'net-you-active';
    if (mode === 'invalid') return HOPS[i] === 1 ? 'net-reject' : '';
    return 'net-verified';
  };

  const done = mode !== 'idle' && wave >= (mode === 'valid' ? MAX_HOP : 1);

  return (
    <VizFigure
      title="The gossip network"
      caption="No server, no center — just neighbors telling neighbors, and every single node auditing before it relays."
    >
      <div className="net-controls">
        <button className="runbtn net-btn" onClick={() => setMode('valid')} disabled={mode === 'valid' && !done}>
          ▶ Broadcast a valid payment
        </button>
        <button className="preset" onClick={() => setMode('invalid')}>
          ☠ Broadcast a rule-breaker
        </button>
        {mode !== 'idle' && (
          <button className="preset" onClick={() => setMode('idle')}>
            reset
          </button>
        )}
      </div>
      <svg className="net-svg" viewBox="0 0 560 224" role="img" aria-label="Peer-to-peer gossip animation">
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            className={`net-edge ${
              mode !== 'idle' && Math.max(HOPS[a], HOPS[b]) <= wave && (mode === 'valid' || Math.max(HOPS[a], HOPS[b]) <= 1)
                ? mode === 'valid'
                  ? 'net-edge-live'
                  : 'net-edge-dead'
                : ''
            }`}
          />
        ))}
        {NODES.map((node, i) => (
          <g key={i} className={`net-node ${i === 0 ? 'net-you' : ''} ${nodeState(i)}`}>
            <circle cx={node.x} cy={node.y} r={i === 0 ? 11 : 8} />
            {i === 0 && (
              <text x={node.x} y={node.y + 26} className="net-label">
                you
              </text>
            )}
            {mode !== 'idle' && HOPS[i] <= wave && i !== 0 && (mode === 'valid' || HOPS[i] === 1) && (
              <text x={node.x} y={node.y + 3.5} className="net-mark">
                {mode === 'valid' ? '✓' : '✗'}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="viz-readout">
        {mode === 'idle' &&
          'Your node knows a few peers, who know a few peers. There is nowhere to "submit" a transaction — press a button and watch how anything travels.'}
        {mode === 'valid' &&
          (done
            ? 'Seconds, and the whole network carries your payment — but look at what each hop did: verified first (✓), relayed second. Nothing was trusted anywhere along the way; your transaction was re-audited at every single machine it touched.'
            : 'Rippling outward — each node runs the full AcceptToMemoryPool gauntlet (✓) BEFORE telling its own peers…')}
        {mode === 'invalid' &&
          (done
            ? "Dead at hop one. Your neighbors checked it (the same checks from Quests #1 and #3), rejected it, and told no one. That's the immune system: a lie doesn't get argued with or reported — beyond its author, it simply never exists."
            : 'Your neighbors are checking it…')}
      </p>
    </VizFigure>
  );
}
