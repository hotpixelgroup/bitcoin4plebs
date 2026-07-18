import { useEffect, useState } from 'react';
import { doubleSha256Hex } from '@bitcoin4plebs/bitcoin-logic';
import { VizFigure } from './viz-figure';

const LEAVES = ['tx 1', 'tx 2', 'tx 3', 'tx 4', 'tx 5', 'tx 6', 'tx 7', 'tx 8'];

/** Full tree as levels: [8 leaf hashes, 4, 2, 1 root]. Real double SHA-256. */
async function buildTree(texts: string[]): Promise<string[][]> {
  let level = await Promise.all(texts.map((t) => doubleSha256Hex(t)));
  const levels = [level];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(await doubleSha256Hex(level[i] + level[i + 1]));
    }
    levels.push(next);
    level = next;
  }
  return levels;
}

const X = (level: number, i: number): number => 40 + 40 * 2 ** level + i * 80 * 2 ** level;
const Y = (level: number): number => 212 - level * 59;

type Mode = 'tamper' | 'proof';

/**
 * Merkle lightning: eight transactions hashed pairwise up to one root,
 * which is how an 80-byte header owns a whole block. Corrupt any leaf and the
 * damage climbs its exact path; or flip to proof mode and see the three
 * sibling hashes that prove a transaction's inclusion.
 */
export function MerkleLightning() {
  const [corrupted, setCorrupted] = useState<Set<number>>(new Set());
  const [pristine, setPristine] = useState<string[][] | null>(null);
  const [tree, setTree] = useState<string[][] | null>(null);
  const [mode, setMode] = useState<Mode>('tamper');
  const [proofLeaf, setProofLeaf] = useState(2);

  useEffect(() => {
    buildTree(LEAVES).then((t) => {
      setPristine(t);
      setTree(t);
    });
  }, []);

  useEffect(() => {
    if (!pristine) return;
    const texts = LEAVES.map((t, i) => (corrupted.has(i) ? `${t} (1 byte flipped)` : t));
    buildTree(texts).then(setTree);
  }, [corrupted, pristine]);

  if (!tree || !pristine) {
    return (
      <VizFigure title="Merkle lightning" caption="Hashing eight transactions into a tree…">
        <p className="viz-readout">Building the tree with real double SHA-256…</p>
      </VizFigure>
    );
  }

  const changed = (level: number, i: number) => tree[level][i] !== pristine[level][i];
  const proofSiblings: Array<[number, number]> = [0, 1, 2].map((level) => [
    level,
    (proofLeaf >> level) ^ 1,
  ]);
  const proofPath: Array<[number, number]> = [0, 1, 2, 3].map((level) => [level, proofLeaf >> level]);
  const inProof = (level: number, i: number) =>
    mode === 'proof' && proofSiblings.some(([l, s]) => l === level && s === i);
  const onPath = (level: number, i: number) =>
    mode === 'proof' && proofPath.some(([l, p]) => l === level && p === i);

  const clickLeaf = (i: number) => {
    if (mode === 'proof') {
      setProofLeaf(i);
      return;
    }
    setCorrupted((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <VizFigure
      title="Merkle lightning"
      caption="Eight transactions, hashed in pairs, up to one root: the single line the block header commits to."
    >
      <div className="preset-row">
        <button
          className={`preset ${mode === 'tamper' ? 'preset-active' : ''}`}
          onClick={() => setMode('tamper')}
        >
          ⚡ tamper mode: click a transaction to corrupt it
        </button>
        <button
          className={`preset ${mode === 'proof' ? 'preset-active' : ''}`}
          onClick={() => setMode('proof')}
        >
          🔍 proof mode: click a transaction to prove it's included
        </button>
      </div>
      <svg className="merkle-svg" viewBox="0 0 640 260" role="img" aria-label="Merkle tree">
        {[0, 1, 2].map((level) =>
          tree[level].map((_, i) => (
            <line
              key={`${level}-${i}`}
              x1={X(level, i)}
              y1={Y(level) - 11}
              x2={X(level + 1, i >> 1)}
              y2={Y(level + 1) + 11}
              className={`merkle-edge ${changed(level, i) ? 'merkle-hot' : ''} ${
                onPath(level, i) ? 'merkle-path' : ''
              }`}
            />
          ))
        )}
        {tree.map((level, l) =>
          level.map((hash, i) => (
            <g
              key={`${l}-${i}`}
              className={`merkle-node ${changed(l, i) ? 'merkle-changed' : ''} ${
                inProof(l, i) ? 'merkle-sibling' : ''
              } ${onPath(l, i) ? 'merkle-onpath' : ''} ${l === 0 ? 'merkle-leaf' : ''} ${
                l === 3 ? 'merkle-root' : ''
              }`}
              onClick={l === 0 ? () => clickLeaf(i) : undefined}
            >
              <rect x={X(l, i) - 33} y={Y(l) - 11} width={66} height={22} rx={6} />
              <text x={X(l, i)} y={Y(l) + 4}>
                {hash.slice(0, 6)}
              </text>
              {l === 0 && (
                <text x={X(l, i)} y={Y(l) + 34} className="merkle-label">
                  {LEAVES[i]}
                  {corrupted.has(i) ? ' ⚡' : ''}
                </text>
              )}
              {l === 3 && (
                <text x={X(l, i)} y={Y(l) - 20} className="merkle-label">
                  merkle root: this goes in the 80-byte header
                </text>
              )}
            </g>
          ))
        )}
      </svg>
      <p className="viz-readout">
        {mode === 'tamper'
          ? corrupted.size === 0
            ? 'Click any transaction to flip one byte of it. All hashes here are computed live, so watch exactly which ones notice.'
            : `The corruption climbs its exact path to the root, so the root in the header changes, so the block's hash changes, so its proof-of-work dies (Quest #7's cascade). One flipped byte anywhere in a block is unhideable, and this tree is why.`
          : `To prove ${LEAVES[proofLeaf]} is inside this block, you don't need the other seven transactions; you need just the 3 highlighted sibling hashes: hash your transaction, combine upward, and land on the root. Eight transactions need 3 hashes; a real block's thousands need only ~12. That's how a phone can check inclusion against an 80-byte header.`}
      </p>
    </VizFigure>
  );
}
