import { useEffect, useRef, useState } from 'react';
import { doubleSha256Hex, hashMeetsTarget, targetForZeroBits } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

/** Toy difficulty: ~1,000 attempts per block. Instant here, eternal at real difficulty. */
const ZERO_BITS = 10;
const TARGET = targetForZeroBits(ZERO_BITS);

interface Block {
  height: number;
  data: string;
  nonce: number;
  prevHash: string;
  hash: string;
}

const INITIAL_DATA = [
  'alice pays bob 2 BTC',
  'carol pays dan 5 BTC',
  'you pay pleb 1 BTC',
  'erin pays frank 3 BTC',
  'grace pays heidi 8 BTC',
];

function headerOf(block: Omit<Block, 'hash'>): string {
  return `${block.height}|${block.prevHash}|${block.data}|nonce:${block.nonce}`;
}

async function mineBlock(height: number, prevHash: string, data: string): Promise<Block> {
  for (let nonce = 0; ; nonce++) {
    const candidate = { height, data, nonce, prevHash };
    const hash = await doubleSha256Hex(headerOf(candidate));
    if (hashMeetsTarget(hash, TARGET)) return { ...candidate, hash };
  }
}

/**
 * The tamper cascade: a real hash-linked chain (genuine double SHA-256,
 * genuine proof-of-work at toy difficulty). Edit history anywhere and
 * watch every later block shatter; repairing means re-mining each one,
 * in order, while the real network would be pulling away from you.
 */
export function TamperCascade() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [mining, setMining] = useState<number | null>(null);
  const [lastWork, setLastWork] = useState<{ height: number; tries: number; ms: number } | null>(null);
  const [everTampered, setEverTampered] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    (async () => {
      const chain: Block[] = [];
      let prev = '0'.repeat(64);
      for (let h = 0; h < INITIAL_DATA.length; h++) {
        const block = await mineBlock(h, prev, INITIAL_DATA[h]);
        chain.push(block);
        prev = block.hash;
      }
      if (alive.current) setBlocks(chain);
    })();
    return () => {
      alive.current = false;
    };
  }, []);

  if (!blocks) {
    return (
      <VizFigure title="The tamper cascade" caption="Forging a real 5-block chain in your browser…">
        <p className="viz-readout">Mining 5 blocks with real proof-of-work…</p>
      </VizFigure>
    );
  }

  // A block is sealed only if its own proof-of-work holds AND it still points at its parent.
  const status = blocks.map((block, i) => {
    const prevOk = i === 0 ? block.prevHash === '0'.repeat(64) : block.prevHash === blocks[i - 1].hash;
    const powOk = hashMeetsTarget(block.hash, TARGET);
    return { prevOk, powOk, ok: prevOk && powOk };
  });
  const brokenCount = status.filter((s) => !s.ok).length;
  const firstBroken = status.findIndex((s) => !s.ok);

  const edit = async (index: number, data: string) => {
    setEverTampered(true);
    // The tamperer rewrites the data but keeps the old nonce, so the
    // block's recomputed hash no longer meets the target, and every later
    // block points at a hash that no longer exists.
    const next = blocks.slice();
    const edited = { ...next[index], data };
    edited.hash = await doubleSha256Hex(headerOf(edited));
    next[index] = edited;
    setBlocks(next);
  };

  const remine = async (index: number) => {
    setMining(index);
    const started = performance.now();
    const prev = index === 0 ? '0'.repeat(64) : blocks[index - 1].hash;
    const mined = await mineBlock(blocks[index].height, prev, blocks[index].data);
    if (!alive.current) return;
    setLastWork({
      height: mined.height,
      tries: mined.nonce + 1,
      ms: Math.round(performance.now() - started),
    });
    setBlocks((current) => {
      if (!current) return current;
      const next = current.slice();
      next[index] = mined;
      return next;
    });
    setMining(null);
  };

  return (
    <VizFigure
      title="The tamper cascade"
      caption="A real hash-linked chain. Rewrite any block's history, then try to cover your tracks."
    >
      <div className="chain-row">
        {blocks.map((block, i) => (
          <div key={block.height} className="chain-item">
            <div className={`chain-block ${status[i].ok ? '' : 'chain-broken'}`}>
              <div className="chain-block-head">
                <span>block {block.height}</span>
                <span className={status[i].ok ? 'chain-ok' : 'chain-bad'}>
                  {status[i].ok ? '✓ sealed' : '✗ invalid'}
                </span>
              </div>
              <input
                className="chain-data"
                value={block.data}
                onChange={(e) => edit(i, e.target.value)}
                aria-label={`Block ${block.height} contents`}
              />
              <div className="chain-hashes">
                <div>
                  <span className="chain-hash-label">parent</span>
                  <code className={status[i].prevOk ? '' : 'chain-bad'}>
                    {block.prevHash.slice(0, 12)}…
                  </code>
                </div>
                <div>
                  <span className="chain-hash-label">hash</span>
                  <code className={status[i].powOk ? '' : 'chain-bad'}>{block.hash.slice(0, 12)}…</code>
                </div>
              </div>
              {!status[i].ok && (
                <button
                  className="preset chain-remine"
                  disabled={mining !== null || i !== firstBroken}
                  onClick={() => remine(i)}
                >
                  {mining === i ? '⛏ mining…' : i === firstBroken ? '⛏ re-mine this block' : 'fix parent first'}
                </button>
              )}
            </div>
            {i < blocks.length - 1 && (
              <div className={`chain-arrow ${status[i + 1].prevOk ? '' : 'chain-bad'}`}>→</div>
            )}
          </div>
        ))}
      </div>
      <p className="viz-readout">
        {brokenCount > 0
          ? `One edit, ${brokenCount} invalid block${brokenCount > 1 ? 's' : ''}: your rewritten block fails its own proof-of-work, and every later block points at a parent hash that no longer exists. To cover your tracks you must re-mine them ALL, oldest first.`
          : everTampered && lastWork
            ? `Chain repaired: block ${lastWork.height} took ${lastWork.tries.toLocaleString('en-US')} attempts (${lastWork.ms} ms) at this toy difficulty. At real difficulty each block costs the ENTIRE NETWORK ~10 minutes, and while you re-mined your ${blocks.length}, honest nodes added more on top and moved the finish line. That race is what "immutable" actually means.`
            : 'Every block\'s hash is computed from its contents AND its parent\'s hash (real double SHA-256, live). Change one letter of history in any block and watch what happens downstream.'}
      </p>
    </VizFigure>
  );
}
