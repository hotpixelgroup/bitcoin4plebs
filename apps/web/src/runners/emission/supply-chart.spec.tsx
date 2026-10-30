import { render } from '@testing-library/react';
import {
  computeEras,
  estimateHeightAtTime,
  supplyThroughBlock,
  totalSupply,
} from '@bitcoin4plebs/bitcoin-logic';
import { SupplyChart } from './supply-chart';

describe('SupplyChart "you are here" marker', () => {
  it('derives its height and minted share from the live estimate, not a fixed old height', () => {
    const eras = computeEras();
    const { container } = render(
      <SupplyChart eras={eras} revealed={eras.length} done />,
    );
    const label =
      container.querySelector('.chart-today text')?.textContent ?? '';
    const today = estimateHeightAtTime(Date.now());
    const pct = Number((supplyThroughBlock(today) * 100n) / totalSupply());
    expect(label).toBe(`you are here (${pct}% already minted)`);
    // Same axis maths as the chart: 62px left margin, 800 - 16px right, 7,000,000-block axis.
    const cx = Number(
      container.querySelector('.chart-today circle')?.getAttribute('cx'),
    );
    expect(cx).toBeCloseTo(62 + (today / 7_000_000) * (800 - 16 - 62), 6);
  });
});
