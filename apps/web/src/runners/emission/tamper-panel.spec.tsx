import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { TamperPanel } from './emission-runner';
afterEach(cleanup);

const run = (interval: string, removeGuard = false) => {
  const { container } = render(<TamperPanel />);
  fireEvent.change(screen.getByLabelText(/Halving interval/), { target: { value: interval } });
  if (removeGuard) fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /Run my broken schedule/ }));
  return container.querySelector('.callout');
};

it('recognises the unchanged parameters as Bitcoin, not a different network', () => {
  const callout = run('210000');
  expect(callout).toHaveTextContent('20,999,999.9769 BTC');
  expect(callout).toHaveTextContent(/these are Bitcoin's own parameters/i);
  expect(callout).not.toHaveTextContent(/different network/);
  expect(callout).not.toHaveTextContent(/rejects its blocks/);
});

it('does not claim existing nodes reject an underclaiming schedule', () => {
  const callout = run('100000');
  expect(callout).not.toHaveTextContent(/every existing node rejects/);
  expect(callout).toHaveTextContent(/Miners may underclaim/);
});

it('ties an overclaiming schedule to bad-cb-amount, not to MAX_MONEY', () => {
  const callout = run('300000');
  expect(callout).not.toHaveTextContent(/MAX_MONEY exceeded/);
  expect(callout).toHaveTextContent(/bad-cb-amount/);
  expect(callout).toHaveTextContent(/block 210,000/);
});

it('explains the removed guard diverges only at era 65', () => {
  const callout = run('210000', true);
  expect(callout).toHaveTextContent(/still climbing/);
  expect(callout).toHaveTextContent(/bad-cb-amount/);
  expect(callout).toHaveTextContent(/13,440,000/);
});
