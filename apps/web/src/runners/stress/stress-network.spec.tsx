import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { StressNetwork } from './stress-network';
afterEach(cleanup);
const finale = { title: 'Stress', takeaway: 'Fixture', runnerId: 'stress-network' };

it('illustrates -datacarriersize with an OP_RETURN payload, which is what it limits', () => {
  const { container } = render(
    <MemoryRouter>
      <StressNetwork finale={finale} />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('button', { name: /you filter what you dislike/ }));
  for (let i = 0; i < 6; i++) {
    const next = container.querySelector('.runbtn');
    if (next) fireEvent.click(next);
  }
  const text = container.textContent ?? '';
  expect(text).toMatch(/datacarriersize 83/);
  expect(text).toMatch(/OP_RETURN/);
  expect(text).not.toMatch(/inscription/i);
});
