import { useState } from 'react';
import { VizFigure } from './viz-figure';

type Rating = 'strong' | 'medium' | 'weak';

interface Property {
  key: string;
  name: string;
  question: string;
  gold: Rating;
  fiat: Rating;
  bitcoin: Rating;
  detail: { gold: string; fiat: string; bitcoin: string };
}

/**
 * The scorecard humanity has used implicitly for millennia. Ratings are
 * deliberately honest: Bitcoin is NOT strong everywhere (fungibility is
 * weaker than cash because the ledger is public, per Quest #15). The one
 * row it stands alone on is verifiability, which is what the reader has
 * been doing for sixteen quests.
 */
const PROPERTIES: Property[] = [
  {
    key: 'scarce',
    name: 'Scarcity',
    question: 'Can more be made at will?',
    gold: 'strong',
    fiat: 'weak',
    bitcoin: 'strong',
    detail: {
      gold: 'Hard to mine, but the supply still grows ~1.5% a year, and a big strike could change that.',
      fiat: 'Created at will by central banks. Supply is a policy choice, not a limit.',
      bitcoin: 'Capped at 21 million, enforced by every node. You verified the schedule yourself in Quest #1.',
    },
  },
  {
    key: 'durable',
    name: 'Durability',
    question: 'Does it survive time?',
    gold: 'strong',
    fiat: 'medium',
    bitcoin: 'strong',
    detail: {
      gold: 'Essentially eternal; it does not rust or rot. Its great strength.',
      fiat: 'Paper wears out; digital balances persist only as long as the institution does.',
      bitcoin: 'Data replicated across tens of thousands of machines. It persists as long as anyone keeps a copy.',
    },
  },
  {
    key: 'portable',
    name: 'Portability',
    question: 'Can you move it easily?',
    gold: 'weak',
    fiat: 'medium',
    bitcoin: 'strong',
    detail: {
      gold: 'Heavy, and moving meaningful amounts means guards, borders, and inspections.',
      fiat: 'Cash is easy locally; large or cross-border moves are slow, gated, and reversible.',
      bitcoin: 'Any amount, anywhere with a connection, in minutes, with no permission (Quest #7).',
    },
  },
  {
    key: 'divisible',
    name: 'Divisibility',
    question: 'Can you split it finely?',
    gold: 'weak',
    fiat: 'medium',
    bitcoin: 'strong',
    detail: {
      gold: 'You cannot shave exact change off a bar. Practical units are coarse.',
      fiat: 'Down to the cent, which is fine for daily life but no finer.',
      bitcoin: '100,000,000 satoshis per coin, spendable down to a single sat (Quest #1).',
    },
  },
  {
    key: 'fungible',
    name: 'Fungibility',
    question: 'Is every unit interchangeable?',
    gold: 'strong',
    fiat: 'strong',
    bitcoin: 'medium',
    detail: {
      gold: 'One ounce of pure gold is exactly as good as any other. No history attached.',
      fiat: 'A $20 bill spends like any other; serial numbers rarely matter in practice.',
      bitcoin: 'Weaker, and honestly so: the ledger is public (Quest #15), so a coin can carry a visible history that some may treat differently.',
    },
  },
  {
    key: 'verifiable',
    name: 'Verifiability',
    question: 'Can you check it is real, yourself?',
    gold: 'weak',
    fiat: 'weak',
    bitcoin: 'strong',
    detail: {
      gold: 'Telling real gold from a gilded fake needs an assay. Ordinary people simply trust.',
      fiat: 'Counterfeits exist; you trust the issuer and the note\'s security features.',
      bitcoin: 'The row nothing else scores strong on: you can check the whole supply and every rule yourself, which is this entire site.',
    },
  },
];

const RATING_MARK: Record<Rating, string> = { strong: '●●●', medium: '●●○', weak: '●○○' };
const RATING_LABEL: Record<Rating, string> = { strong: 'strong', medium: 'mixed', weak: 'weak' };

export function MoneyScorecard() {
  const [openKey, setOpenKey] = useState('verifiable');
  const open = PROPERTIES.find((p) => p.key === openKey) as Property;

  return (
    <VizFigure
      title="The scorecard money is judged on"
      caption="Tap any property. The point isn't that Bitcoin wins every row (it doesn't); it's the last row nothing else scores strong on."
    >
      <div className="sc-grid" role="table" aria-label="Money properties compared">
        <div className="sc-row sc-head" role="row">
          <span role="columnheader">property</span>
          <span role="columnheader">gold</span>
          <span role="columnheader">cash / bank</span>
          <span role="columnheader">bitcoin</span>
        </div>
        {PROPERTIES.map((p) => (
          <button
            key={p.key}
            className={`sc-row ${openKey === p.key ? 'sc-row-open' : ''}`}
            role="row"
            aria-expanded={openKey === p.key}
            onClick={() => setOpenKey(p.key)}
          >
            <span className="sc-prop" role="cell">
              {p.name}
            </span>
            <span className={`sc-cell sc-${p.gold}`} role="cell" title={RATING_LABEL[p.gold]}>
              {RATING_MARK[p.gold]}
            </span>
            <span className={`sc-cell sc-${p.fiat}`} role="cell" title={RATING_LABEL[p.fiat]}>
              {RATING_MARK[p.fiat]}
            </span>
            <span className={`sc-cell sc-${p.bitcoin}`} role="cell" title={RATING_LABEL[p.bitcoin]}>
              {RATING_MARK[p.bitcoin]}
            </span>
          </button>
        ))}
      </div>
      <div className="sc-detail" aria-live="polite">
        <div className="sc-detail-q">
          {open.name}: {open.question}
        </div>
        <div className="sc-detail-row">
          <span className={`sc-tag sc-${open.gold}`}>gold</span>
          <span>{open.detail.gold}</span>
        </div>
        <div className="sc-detail-row">
          <span className={`sc-tag sc-${open.fiat}`}>cash / bank</span>
          <span>{open.detail.fiat}</span>
        </div>
        <div className="sc-detail-row">
          <span className={`sc-tag sc-${open.bitcoin}`}>bitcoin</span>
          <span>{open.detail.bitcoin}</span>
        </div>
      </div>
    </VizFigure>
  );
}
