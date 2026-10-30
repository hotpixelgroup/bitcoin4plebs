import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GlossaryEntry, SiteId } from '@bitcoin4plebs/quests/content';
import { entryForCodeToken, findCodeTerms, linkFirstTerm } from './glossary-term.js';

/** Stamp the front door the way the app's entry point does on <html>. */
function onSite(site: SiteId) {
  vi.stubGlobal('document', { documentElement: { dataset: { site } } });
}

/** The glossary entry linkFirstTerm attached to the first match, if any. */
function linkedEntry(node: ReactNode): GlossaryEntry | undefined {
  if (!isValidElement(node)) return undefined;
  const children = (node as ReactElement<{ children: ReactNode[] }>).props.children;
  const term = children.find(
    (c): c is ReactElement<{ entry: GlossaryEntry }> => isValidElement(c) && 'entry' in (c.props as object),
  );
  return term?.props.entry;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('auto-linking respects the front door', () => {
  it('links "gossip" to the Lightning entry on the Lightning site', () => {
    onSite('lightning');
    const entry = linkedEntry(linkFirstTerm('Channel terms spread by gossip between nodes.', 0));
    expect(entry?.term).toBe('Gossip');
    expect(entry?.questSite).toBe('lightning');
  });

  it('links "gossip" to the peer-to-peer relay entry on the Bitcoin site', () => {
    onSite('bitcoin');
    const entry = linkedEntry(linkFirstTerm('Transactions travel by gossip between nodes.', 0));
    expect(entry?.term).toBe('Peer-to-peer gossip');
  });

  it('uses each site’s own entry for terms defined once per site', () => {
    for (const site of ['bitcoin', 'lightning'] as const) {
      onSite(site);
      for (const text of ['A payment channel opens.', 'The revocation key punishes.']) {
        const entry = linkedEntry(linkFirstTerm(text, 0));
        expect(entry, `${site}: ${text}`).toBeDefined();
        expect(entry?.site, `${site}: ${text}`).toBe(site);
      }
    }
  });

  it('never links an entry restricted to the other site', () => {
    onSite('lightning');
    expect(entryForCodeToken('gossip')?.term).toBe('Gossip');
    expect(entryForCodeToken('revocation key')?.site).toBe('lightning');
    onSite('bitcoin');
    expect(entryForCodeToken('revocation')?.site).toBe('bitcoin');
    // "revocationpubkey" is only a pattern of the Lightning-only entry, so
    // on the Bitcoin site a `revocationpubkey` code span links nothing.
    expect(entryForCodeToken('revocationpubkey')).toBeUndefined();
    onSite('lightning');
    expect(entryForCodeToken('revocationpubkey')?.site).toBe('lightning');
  });

  it('still links shared identifiers in code lines on both sites', () => {
    for (const site of ['bitcoin', 'lightning'] as const) {
      onSite(site);
      expect(findCodeTerms('CAmount nSubsidy = 50 * COIN;').map((t) => t.entry.term)).toEqual(['CAmount', 'COIN']);
    }
  });
});
