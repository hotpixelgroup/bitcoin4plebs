import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { RouteFinder } from './route-finder';
afterEach(cleanup);
const finale = {
  title: 'Routes',
  takeaway: 'Fixture',
  runnerId: 'route-finder',
};
for (const c of [
  { amount: 1, base: 3000, ppm: 2000, winner: 'D', fee: '0.404' },
  { amount: 50000, base: 3100, ppm: 2000, winner: 'B', fee: '103.100' },
])
  it(`narrates computed ${c.winner} winner at ${c.amount} sats rather than a control threshold`, () => {
    const { container } = render(<RouteFinder finale={finale} />);
    fireEvent.change(screen.getByLabelText(/A pays C/), {
      target: { value: c.amount },
    });
    fireEvent.change(screen.getByLabelText(/B→C fee_base_msat/), {
      target: { value: c.base },
    });
    fireEvent.change(screen.getByLabelText(/B→C fee_proportional/), {
      target: { value: c.ppm },
    });
    const callout = container.querySelector('.callout');
    expect(callout).toHaveTextContent(`A → ${c.winner} → C, costing ${c.fee}`);
    expect(callout).toHaveTextContent(
      `Via ${c.winner} is cheaper by computed total fee`,
    );
  });
it('identifies equal computed fees instead of pretending one route is cheaper', () => {
  const { container } = render(<RouteFinder finale={finale} />);
  fireEvent.change(screen.getByLabelText(/B→C fee_base_msat/), {
    target: { value: 400 },
  });
  fireEvent.change(screen.getByLabelText(/B→C fee_proportional/), {
    target: { value: 4000 },
  });
  expect(container.querySelector('.callout')).toHaveTextContent(
    'Equal-fee tie',
  );
  expect(container.querySelector('.callout')).toHaveTextContent(
    'both cost 4.400 sats',
  );
});
