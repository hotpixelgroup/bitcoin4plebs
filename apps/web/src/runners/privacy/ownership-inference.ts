export interface ToyTx {
  id: string;
  label: string;
  inputs: string[];
  outputs: Array<{ addr: string; sats: number; change?: boolean }>;
}

const KNOWN = 'S1';
interface HeuristicStep {
  text: string;
  found: string[];
}

/**
 * The two real heuristics, run breadth-first from the known address:
 * common-input ownership (inputs spent together share an owner) and
 * fresh-change detection (a uniquely smaller public output of a cluster spend
 * belongs to the cluster).
 */
export function runHeuristics(ledger: ToyTx[]): {
  cluster: Set<string>;
  steps: HeuristicStep[];
} {
  const cluster = new Set([KNOWN]);
  const steps: HeuristicStep[] = [
    {
      text: `Ground truth to start: ${KNOWN} is taped in the shop window.`,
      found: [KNOWN],
    },
  ];
  let grew = true;
  while (grew) {
    grew = false;
    for (const tx of ledger) {
      if (tx.inputs.some((a) => cluster.has(a))) {
        const newInputs = tx.inputs.filter((a) => !cluster.has(a));
        if (newInputs.length > 0) {
          newInputs.forEach((a) => cluster.add(a));
          steps.push({
            text: `${tx.id} spends ${tx.inputs.join(' + ')} together. They may share an owner (common-input hypothesis; collaborative spends can violate it), so ${newInputs.join(', ')} joins the cluster.`,
            found: newInputs,
          });
          grew = true;
        }
        const sorted = [...tx.outputs].sort((a, b) => a.sats - b.sats);
        const candidate =
          sorted.length > 1 && sorted[0].sats < sorted[1].sats
            ? sorted[0]
            : undefined;
        const change =
          candidate && !cluster.has(candidate.addr) ? candidate : undefined;
        if (change) {
          cluster.add(change.addr);
          steps.push({
            text: `${tx.id} is a cluster spend, and its ${change.sats.toLocaleString('en-US')}-sat output to never-seen ${change.addr} is the smaller output, so this deliberately weak heuristic guesses it is change. It may instead be a payment. ${change.addr} joins.`,
            found: [change.addr],
          });
          grew = true;
        }
      }
    }
  }
  return { cluster, steps };
}
