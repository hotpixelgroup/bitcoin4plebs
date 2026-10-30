import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { FeeAuction } from './fee-auction';
afterEach(cleanup);

it("renders the quest's own finale note", () => {
  const { container } = render(
    <MemoryRouter>
      <FeeAuction finale={{ title: 'Fees', takeaway: 'Fixture', runnerId: 'fee-auction', note: 'A unique finale note.' }} />
    </MemoryRouter>,
  );
  expect(container.querySelector('.finale-note')).toHaveTextContent('A unique finale note.');
});
