import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ForkYourself } from './fork/fork-yourself';
import { RewriteCost } from './rewrite/rewrite-cost';
import { SignetTracker } from './signet/signet-tracker';
const finale = { title: 'Fixture', takeaway: 'Fixture', runnerId: 'fixture' };
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('bounds matching and changed schedules to the subsidy rule and actual block disagreement', () => {
  render(<ForkYourself finale={finale} />);
  fireEvent.click(screen.getByRole('button', { name: /Run your chain/ }));
  expect(
    screen.getByText(/does not establish full block validity/),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Starting reward'), {
    target: { value: '100' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Run your chain/ }));
  expect(screen.getByText(/first block/)).toHaveTextContent(
    'need not invalidate the first block',
  );
});
it('does not certify impossibility or historical energy from confirmation depth', () => {
  render(<RewriteCost finale={finale} />);
  fireEvent.click(screen.getByRole('button', { name: '1 confirmation' }));
  expect(screen.getByText(/Even minority hashpower/)).toBeInTheDocument();
  expect(screen.getByText(/not exact attempts or joules/)).toBeInTheDocument();
});
it('reports a provider404 as provider ignorance with source and request time', async () => {
  const fetcher = vi.fn().mockResolvedValue({ status: 404 });
  vi.stubGlobal('fetch', fetcher);
  render(<SignetTracker finale={finale} />);
  fireEvent.change(screen.getByPlaceholderText('paste your txid…'), {
    target: { value: 'ab'.repeat(32) },
  });
  fireEvent.click(screen.getByRole('button', { name: /Track my transaction/ }));
  expect(
    await screen.findByText(/provider does not know that txid/),
  ).toHaveTextContent('does not prove network-wide absence');
  expect(screen.getByText(/Provider: mempool.space\/signet/)).toHaveTextContent(
    'requested at',
  );
  expect(fetcher).toHaveBeenCalledTimes(1);
});
