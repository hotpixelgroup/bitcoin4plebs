import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { FeeAuction } from '../feemarket/fee-auction';
import {
  FundingLab,
  PrivacyLab,
  RecoveryLab,
  ReorgLab,
  SnapshotLab,
} from './extended-labs';
import { HistoricOverflow, OVERFLOW_TXID } from './historic-overflow';
import { runHeuristics } from '../privacy/ownership-inference';
afterEach(cleanup);
it('replays the unified queue and makes replacement failure observable', () => {
  render(
    <FeeAuction
      finale={{ title: 'Fees', takeaway: 'Fees', runnerId: 'fee-auction' }}
    />,
  );
  fireEvent.change(screen.getByLabelText(/Replacement \/ child fee/), {
    target: { value: '400' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Try RBF replacement' }));
  expect(screen.getByRole('status')).toHaveTextContent('Rejected');
  fireEvent.click(
    screen.getByRole('button', { name: 'Mine next trace block' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('arrival-1');
  expect(
    screen.getByRole('button', { name: 'Try RBF replacement' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Reset fee experiment' }));
  expect(
    screen.getByRole('button', { name: 'Try RBF replacement' }),
  ).toBeEnabled();
});
it('shows a collaborative ownership false positive and lets the reader remove the hypothesis', () => {
  render(<PrivacyLab />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Reveal independent fixture truth' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'False positives: receiver-input, receiver-output',
  );
  fireEvent.click(screen.getByLabelText('Apply common-input hypothesis'));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByLabelText('Guess uniquely smaller output is change'),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Reveal independent fixture truth' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('False positives: none');
});
it('requires channel readiness then locks and refunds a single reservation exactly once', () => {
  render(<FundingLab />);
  fireEvent.click(screen.getByRole('button', { name: 'Reserve HTLC' }));
  expect(screen.getByRole('status')).toHaveTextContent('Transition rejected');
  for (const name of [
    'Exchange funding + commitment signatures',
    'Confirm depth + both channel_ready',
    'Reserve HTLC',
  ])
    fireEvent.click(screen.getByRole('button', { name }));
  expect(screen.getByRole('status')).toHaveTextContent('HTLC locked 5000');
  fireEvent.click(
    screen.getByRole('button', { name: 'Fail and release reservation' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('Ana available 80000');
  fireEvent.click(
    screen.getByRole('button', { name: 'Fulfill reserved HTLC' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('Transition rejected');
});
it('reveals different-wallet and missing-cosigner recovery failures', () => {
  render(<RecoveryLab />);
  fireEvent.click(screen.getByLabelText(/Exact original/));
  fireEvent.click(
    screen.getByRole('button', { name: 'Attempt fixture recovery' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('different wallet');
  fireEvent.click(screen.getByRole('button', { name: 'Reset recovery cards' }));
  fireEvent.change(screen.getByLabelText('Recovery target'), {
    target: { value: 'multisig' },
  });
  fireEvent.click(screen.getByLabelText(/Correct descriptor/));
  fireEvent.click(
    screen.getByRole('button', { name: 'Attempt fixture recovery' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'two available private cosigners',
  );
});
it('blocks mismatched RPC snapshots and replays an identity-matched fixture', () => {
  render(<SnapshotLab />);
  fireEvent.click(
    screen.getByRole('button', { name: 'Try mismatched height' }),
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Reconcile RPC identity' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent('Height mismatch');
  fireEvent.click(screen.getByRole('button', { name: 'Reset RPC fixture' }));
  fireEvent.click(
    screen.getByRole('button', { name: 'Reconcile RPC identity' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Matched snapshot identity',
  );
  expect(screen.getByRole('status')).toHaveTextContent('gap 5000000000 sats');
});
it('shows split views until valid higher-work propagation then restores the one-coin invariant', () => {
  render(<ReorgLab />);
  const lab = within(
    screen.getByRole('region', { name: 'Reorg network laboratory' }),
  );
  for (const name of [
    'Mine Bo at node A',
    'Mine Carol at node B',
    'Propagate tips',
    'Extend B’s branch',
    'Propagate tips',
  ])
    fireEvent.click(lab.getByRole('button', { name }));
  expect(lab.getAllByText(/active UTXO owner Carol/)).toHaveLength(2);
  expect(lab.getByText(/Node A disconnects Bo/)).toBeInTheDocument();
  fireEvent.click(lab.getByRole('button', { name: 'Reset network' }));
  expect(lab.getAllByText(/active UTXO owner Ana/)).toHaveLength(2);
});
it('verifies the historical bytes before claiming a matching txid', async () => {
  render(<HistoricOverflow />);
  const status = screen.getByRole('status');
  // Nothing is claimed until the bytes have actually been decoded and hashed.
  expect(status).toBeEmptyDOMElement();
  fireEvent.click(
    screen.getByRole('button', {
      name: 'Decode bytes and verify historic txid',
    }),
  );
  // The hash is async; wait for the verified result, then pin its contents.
  await waitFor(() =>
    expect(status).toHaveTextContent(`Reconstructed txid ${OVERFLOW_TXID}`),
  );
  expect(status).toHaveTextContent(
    `Reconstructed txid ${OVERFLOW_TXID}; matches original report`,
  );
  expect(status).toHaveTextContent(
    'Outputs: 9223372036854275808 + 9223372036854275808 sats',
  );
  expect(status).toHaveTextContent('signed-64-bit wrapping demonstration -1000000');
  expect(status).not.toHaveTextContent('MISMATCH');
});
it('existing graph inference never consumes hidden change labels, and declines equal outputs', () => {
  const tx = {
    id: 'collab',
    label: 'fixture',
    inputs: ['S1', 'other'],
    outputs: [
      { addr: 'a', sats: 10, change: false },
      { addr: 'b', sats: 10, change: true },
    ],
  };
  expect([...runHeuristics([tx]).cluster]).toEqual(['S1', 'other']);
  const flipped = {
    ...tx,
    outputs: tx.outputs.map((o) => ({ ...o, change: !o.change })),
  };
  expect(runHeuristics([flipped])).toEqual(runHeuristics([tx]));
});
