import {
  fireEvent,
  render,
  screen,
  within,
  cleanup,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { UtxoFlow } from './utxo-flow';
import { HtlcChain } from './htlc-chain';
import { SharedLedger } from './shared-ledger';
import { ChannelSimulator } from '../runners/lightning/channel-simulator';
import { DoubleSpend } from '../runners/doublespend/double-spend';
const finale = { title: 'Test', takeaway: 'Test', runnerId: 'test' };
afterEach(cleanup);
function stat(label: string) {
  return screen.getByText(label).closest('.stat')?.querySelector('.stat-value')
    ?.textContent;
}
function openAndPay() {
  fireEvent.click(screen.getByRole('button', { name: /open the tab:/ }));
  fireEvent.click(screen.getByRole('button', { name: /Ana buys a coffee/ }));
}
describe('learning lab transitions', () => {
  it('spends whole UTXOs and conserves value after prediction', () => {
    render(<UtxoFlow />);
    fireEvent.click(screen.getByRole('button', { name: /Box A/ }));
    fireEvent.click(screen.getByRole('button', { name: /Box B/ }));
    expect(screen.getByRole('button', { name: /Build:/ })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Predict what happens/), {
      target: { value: 'whole' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Build:/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Pending transaction');
    fireEvent.click(
      screen.getByRole('button', { name: /Confirm transaction/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '0.8 BTC in = 0.6 payment + 0.1999 change + 0.0001 fee',
    );
    expect(screen.getAllByText('destroyed (opened whole)')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /start over/ }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('leaves confirmed UTXOs unchanged on an insufficient-input attempt', () => {
    render(<UtxoFlow />);
    fireEvent.change(screen.getByLabelText(/Predict what happens/), {
      target: { value: 'whole' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Attempt: need/ }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Confirmed UTXOs did not change',
    );
    expect(stat('your “balance”')).toContain('1.05');
    expect(
      screen.queryByRole('button', { name: /Confirm transaction/ }),
    ).not.toBeInTheDocument();
  });
  it('does not confirm a penalty automatically while the observer is offline', () => {
    render(<ChannelSimulator finale={finale} />);
    openAndPay();
    fireEvent.click(screen.getByRole('button', { name: /Bo pays Ana/ }));
    fireEvent.click(screen.getByRole('button', { name: /Bo tries to cheat/ }));
    fireEvent.click(screen.getByRole('checkbox'));
    expect(
      screen.getByRole('button', { name: /Confirm revocation penalty/ }),
    ).toBeDisabled();
    for (let i = 0; i < 6; i++)
      fireEvent.click(screen.getByRole('button', { name: /Advance 24/ }));
    expect(stat('on-chain transactions')).toBe('2');
    fireEvent.click(screen.getByRole('button', { name: /Confirm Bo/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Recovery missed');
    expect(stat('on-chain transactions')).toBe('3');
  });
  it('rejects an invalid mint even when most peers propose it', () => {
    render(<SharedLedger />);
    fireEvent.change(screen.getByLabelText(/Peers proposing/), {
      target: { value: '3' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Propose an unauthorized/ }),
    );
    expect(screen.getAllByText('✗ invalid mint')).toHaveLength(3);
    expect(
      screen.getByText(/Counting peers cannot make an invalid block valid/),
    ).toBeInTheDocument();
  });
  it('propagates fulfillment backwards with fees above the invoice', () => {
    render(<HtlcChain />);
    expect(
      screen.getByRole('button', { name: /Reveal the recipient outcome/ }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Predict: who/), {
      target: { value: 'recipient' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Reveal the recipient outcome/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'incoming HTLC still pending',
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Hub fulfills incoming/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Ines receives 180,000 sats; hub earns 180 sats',
    );
  });
  it('fails a liquidity-poor route without earning a fee', () => {
    render(<HtlcChain />);
    fireEvent.change(screen.getByLabelText(/Hub outbound liquidity/), {
      target: { value: '100000' },
    });
    fireEvent.change(screen.getByLabelText(/Predict: who/), {
      target: { value: 'recipient' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Reveal the recipient outcome/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'insufficient outbound liquidity',
    );
  });
  it('requires two explicit timeout recoveries, not automatic expiry', () => {
    render(<HtlcChain />);
    fireEvent.click(screen.getByRole('button', { name: /Advance 10/ }));
    expect(screen.getByRole('status')).toHaveTextContent('HTLCs pending');
    fireEvent.click(
      screen.getByRole('button', { name: /Confirm outgoing timeout/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Incoming HTLC remains pending',
    );
    for (let i = 0; i < 4; i++)
      fireEvent.click(screen.getByRole('button', { name: /Advance 10/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Confirm incoming timeout/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'No forwarding fee earned',
    );
  });
  it('does not count cooperative closing as a payment', () => {
    render(<ChannelSimulator finale={finale} />);
    openAndPay();
    fireEvent.click(
      screen.getByRole('button', { name: /close the tab cooperatively/ }),
    );
    expect(stat('payments made')).toBe('1');
    expect(stat('on-chain transactions')).toBe('2');
  });
  it('counts funding, revoked commitment and confirmed penalty separately', () => {
    render(<ChannelSimulator finale={finale} />);
    openAndPay();
    fireEvent.click(screen.getByRole('button', { name: /Bo pays Ana/ }));
    fireEvent.click(screen.getByRole('button', { name: /Bo tries to cheat/ }));
    expect(stat('on-chain transactions')).toBe('2');
    fireEvent.click(
      screen.getByRole('button', { name: /Confirm revocation penalty/ }),
    );
    expect(stat('on-chain transactions')).toBe('3');
    expect(stat('payments made')).toBe('2');
  });
  it('makes monitoring and delayed sweeps visible', () => {
    render(<ChannelSimulator finale={finale} />);
    openAndPay();
    fireEvent.click(screen.getByRole('button', { name: /Force-close/ }));
    expect(screen.getByRole('button', { name: /Confirm Ana/ })).toBeDisabled();
    for (let i = 0; i < 6; i++)
      fireEvent.click(screen.getByRole('button', { name: /Advance 24/ }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Ana/ }));
    expect(stat('on-chain transactions')).toBe('3');
    expect(stat('payments made')).toBe('1');
  });
  it('allows a valid higher-work reorg to replace the confirmed conflict', () => {
    render(<DoubleSpend finale={finale} />);
    fireEvent.click(
      screen.getByRole('button', { name: /sign this coin to BOTH/ }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: /mine a block containing the payment to Bo/,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /adopt a valid competing branch/ }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'old confirmation was disconnected',
    );
    expect(
      within(document.querySelector('.ds-tx-won') as HTMLElement).getByText(
        'pay Carol',
      ),
    ).toBeInTheDocument();
  });
});
