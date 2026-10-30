import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { SupplyCheck } from './supply-check';
afterEach(cleanup);
const finale = { title: 'Supply', takeaway: 'Fixture', runnerId: 'supply-check' };

it('offers example amounts that sit under the schedule at the default height', () => {
  const { container } = render(
    <MemoryRouter>
      <SupplyCheck finale={finale} />
    </MemoryRouter>,
  );
  const input = screen.getByLabelText(/total_amount/) as HTMLInputElement;
  const example = /e\.g\. ([\d.]+)/.exec(input.placeholder)?.[1];
  expect(example).toBeTruthy();
  fireEvent.change(input, { target: { value: example } });
  expect(container.querySelector('.delta-bad')).toBeNull();
  expect(container.querySelector('.mine-won')).not.toBeNull();
  // The parse-error hint must show the same safe example.
  fireEvent.change(input, { target: { value: 'nope' } });
  expect(container.textContent).toContain(example as string);
});
