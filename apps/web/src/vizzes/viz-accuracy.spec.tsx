import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OnionPeel } from './onion-peel';
import { ChannelFootprint } from './channel-footprint';
import { InvoiceAnatomy } from './invoice-anatomy';
import { MoneyScorecard } from './money-scorecard';
import { VizFigure } from './viz-figure';

afterEach(cleanup);

describe('onion-peel', () => {
  it('has the sender build the onion and only receiving nodes peel it', () => {
    render(<OnionPeel />);
    // Mira is the sender: she never peels a layer or "learns" a next hop.
    expect(screen.queryByRole('button', { name: /Mira peels/ })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Mira, the sender, built this');
    expect(screen.getByText('4 layers')).toBeInTheDocument();

    const peelers = ['the hub', 'a relay', 'another relay', 'Ines'];
    peelers.forEach((node, i) => {
      fireEvent.click(screen.getByRole('button', { name: `▶ ${node} peels a layer` }));
      expect(screen.getByRole('status')).toHaveTextContent(`what ${node} learns`);
      if (i < peelers.length - 1) {
        expect(screen.getByRole('status')).toHaveTextContent(`send it to ${peelers[i + 1]}`);
      }
    });
    expect(screen.getByRole('status')).toHaveTextContent('the onward HMAC is all zeros');
    expect(screen.getByRole('button', { name: /Reached the recipient/ })).toBeDisabled();
  });
});

describe('channel-footprint', () => {
  const setPayments = (n: number) =>
    fireEvent.change(screen.getByLabelText(/payments between the same two people/), {
      target: { value: String(n) },
    });

  it('calls the channel worse, never a negative saving, below break-even', () => {
    render(<ChannelFootprint />);
    for (const n of [1, 2]) {
      setPayments(n);
      const note = screen.getByRole('status');
      expect(note).toHaveTextContent('worse');
      expect(note).not.toHaveTextContent('never written down');
      expect(note.textContent).not.toMatch(/-\d/);
    }
  });

  it('reports a positive saving once the channel pays off', () => {
    render(<ChannelFootprint />);
    setPayments(3);
    // 3 × 140 = 420 on-chain vs 150 + 170 = 320 in a channel.
    expect(screen.getByRole('status')).toHaveTextContent('100 vbytes never written down');
  });
});

describe('invoice-anatomy', () => {
  it('lists the payment secret between the timestamp and the payment hash, as in BOLT 11', () => {
    render(<InvoiceAnatomy />);
    const labels = screen
      .getAllByRole('button')
      .map((b) => b.textContent);
    expect(labels.slice(3, 6)).toEqual(['pvjluez', 'sp5…', 'pp5…']);
  });
});

describe('viz-figure chrome', () => {
  it('labels the figure by its title, describes it by its caption, and hides the badge', () => {
    render(
      <VizFigure title="A title" caption="A caption">
        body
      </VizFigure>,
    );
    const figure = screen.getByRole('figure', { name: 'A title' });
    expect(figure).toHaveAccessibleDescription('A caption');
    expect(screen.getByText('touch it')).toHaveAttribute('aria-hidden', 'true');
  });

  it('omits the badge on figures that opt out', () => {
    render(<MoneyScorecard />);
    expect(screen.queryByText('touch it')).not.toBeInTheDocument();
    expect(document.querySelector('[role="row"]')).toBeNull();
  });
});
