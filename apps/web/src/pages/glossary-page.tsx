import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY_CATEGORIES, glossary, quests } from '@bitcoin4plebs/quests';
import { Callout, RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = "bitcoin4plebs · Don't trust. Verify.";

const slugByNumber = new Map(quests.map((quest) => [quest.number, quest.slug]));

/**
 * The glossary: Bitcoin terms, the important variable names, and layman's
 * explanations. Every entry cites the pinned source and links to the
 * quest where the reader can verify it instead of memorizing it.
 */
export function GlossaryPage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Glossary · bitcoin4plebs';
    window.scrollTo(0, 0);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? glossary.filter((entry) =>
        `${entry.term} ${entry.definition} ${entry.cite ?? ''}`.toLowerCase().includes(needle)
      )
    : glossary;

  return (
    <main className="wrap">
      <section className="hero">
        <div className="kicker">Look it up. Then verify it.</div>
        <h1>Glossary</h1>
        <p>
          Every Bitcoin term this site uses, the important variable names from the real source
          code, and plain-English explanations for all of them. Definitions are a starting point,
          not an authority. Where a term has a quest, the link takes you to the code that{' '}
          <strong>proves</strong> it.
        </p>
        <label className="height-input-label glossary-search-label">
          Search {glossary.length} terms:
          <input
            className="height-input glossary-search"
            type="search"
            placeholder="halving, scriptPubKey, nonce…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {needle && (
          <p className="glossary-count">
            {filtered.length} of {glossary.length} terms match.
          </p>
        )}
      </section>

      {GLOSSARY_CATEGORIES.map((category) => {
        const entries = filtered.filter((entry) => entry.category === category);
        if (entries.length === 0) return null;
        return (
          <section className="glossary-section" key={category}>
            <h2>{category}</h2>
            <dl className="glossary-list">
              {entries.map((entry) => (
                <div className="glossary-entry" key={entry.term}>
                  <dt>
                    {entry.code ? <code>{entry.term}</code> : entry.term}
                    {entry.cite && <span className="glossary-cite">{entry.cite}</span>}
                  </dt>
                  <dd>
                    <RichText text={entry.definition} />
                    {entry.quest !== undefined && slugByNumber.has(entry.quest) && (
                      <Link className="glossary-quest" to={`/quests/${slugByNumber.get(entry.quest)}`}>
                        Verify it in Quest #{entry.quest} →
                      </Link>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      {filtered.length === 0 && (
        <Callout>
          No terms match “{query}”. Try a shorter search, or tell us what's missing.
        </Callout>
      )}
    </main>
  );
}
