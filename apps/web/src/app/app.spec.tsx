import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { quest01, quests } from '@bitcoin4plebs/quests';
import { getRunner } from '../runners/registry';
import App from './app';

describe('App', () => {
  it('renders the home page with Quest #1', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/No engineering degree required/i)).toBeInTheDocument();
    expect(screen.getByText(quest01.title)).toBeInTheDocument();
  });

  it('renders a quest page from data alone, including verbatim source', () => {
    render(
      <MemoryRouter initialEntries={[`/quests/${quest01.slug}`]}>
        <App />
      </MemoryRouter>
    );
    // A stop title and a verbatim source line must both be on screen.
    expect(screen.getByText(/The entire emission schedule is ten lines of code/i)).toBeInTheDocument();
    expect(screen.getByText(/nSubsidy >>= halvings;/)).toBeInTheDocument();
    // The verify link is pinned to the quest's commit.
    const links = screen.getAllByRole('link', { name: /Verify these lines on GitHub/i });
    expect(links.length).toBe(quest01.stops.length);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining(quest01.pin.commit));
  });

  it('renders EVERY quest in the registry from data alone', () => {
    for (const quest of quests) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/quests/${quest.slug}`]}>
          <App />
        </MemoryRouter>
      );
      expect(screen.getByRole('heading', { level: 1, name: quest.title })).toBeInTheDocument();
      // Every stop's verify link is present and pinned.
      const links = screen.getAllByRole('link', { name: /Verify these lines on GitHub/i });
      expect(links.length).toBe(quest.stops.length);
      for (const link of links) {
        expect(link).toHaveAttribute('href', expect.stringContaining(quest.pin.commit));
      }
      unmount();
    }
  });

  it('has a registered runner for every quest finale', () => {
    for (const quest of quests) {
      if (quest.finale) {
        expect(getRunner(quest.finale.runnerId), `runner ${quest.finale.runnerId}`).toBeDefined();
      }
    }
  });

  it('shows a friendly not-found page for unknown quests', () => {
    render(
      <MemoryRouter initialEntries={['/quests/nope']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Quest not found/i)).toBeInTheDocument();
  });

  it('groups the home page into curriculum tracks', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Foundations' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Advanced' })).toBeInTheDocument();
  });

  it('links each quest to the next one in curriculum order', () => {
    render(
      <MemoryRouter initialEntries={[`/quests/${quest01.slug}`]}>
        <App />
      </MemoryRouter>
    );
    // The footer nav shows the following quest's title as a link card.
    expect(screen.getByText(quests[1].title)).toBeInTheDocument();
  });

  it('lets the reader mark a quest verified, persisted in localStorage', () => {
    localStorage.clear();
    render(
      <MemoryRouter initialEntries={[`/quests/${quest01.slug}`]}>
        <App />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Mark as verified/i }));
    expect(screen.getByRole('button', { name: /Verified with my own eyes/i })).toBeInTheDocument();
    expect(localStorage.getItem('b4p.verified.v1')).toContain(quest01.slug);
    localStorage.clear();
  });
});
