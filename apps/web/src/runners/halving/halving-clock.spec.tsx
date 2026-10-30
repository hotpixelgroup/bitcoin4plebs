import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { HalvingClock } from './halving-clock';
afterEach(cleanup);
const finale = { title: 'Halving', takeaway: 'Fixture', runnerId: 'halving-clock' };

const at = (label: RegExp) => {
  const { container } = render(
    <MemoryRouter>
      <HalvingClock finale={finale} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: label }));
  return container.textContent ?? '';
};

it('counts the block itself in "total supply", like the supply check does', () => {
  const genesis = at(/^Genesis$/);
  expect(genesis).toMatch(/total supply through this block50 BTC/);
  cleanup();
  const last = at(/The last satoshi/);
  expect(last).toMatch(/20,999,999\.9769 BTC/);
  expect(last).toMatch(/100\.00%/);
});

it('dates genesis and the first halving from real block timestamps', () => {
  expect(at(/^Genesis$/)).toMatch(/Jan 3, 2009/);
  cleanup();
  expect(at(/First halving/)).toMatch(/Nov 28, 2012/);
});
