import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GLOSSARY_CATEGORIES } from '@bitcoin4plebs/quests/content';
import { SITE, siblingQuestUrl, siteGlossary, siteQuests } from '../lib/site';
import { Callout, RichText } from '@bitcoin4plebs/ui';

const DEFAULT_TITLE = `${SITE.name} · ${SITE.tagline}`;

const slugByNumber = new Map(siteQuests.map((quest) => [quest.number, quest.slug]));

/**
 * The glossary: Bitcoin terms, the important variable names, and layman's
 * explanations. Every entry cites the pinned source and links to the
 * quest where the reader can verify it instead of memorizing it.
 */
export function GlossaryPage() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = `Glossary · ${SITE.name}`;
    window.scrollTo(0, 0);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, []);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? siteGlossary.filter((entry) =>
        `${entry.term} ${entry.definition} ${entry.cite ?? ''}`.toLowerCase().includes(needle)
      )
    : siteGlossary;

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
          Search {siteGlossary.length} terms:
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
            {filtered.length} of {siteGlossary.length} terms match.
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
                    {entry.quest !== undefined &&
                      ((entry.questSite ?? 'bitcoin') === SITE.id ? (
                        slugByNumber.has(entry.quest) && (
                          <Link
                            className="glossary-quest"
                            to={`/quests/${slugByNumber.get(entry.quest)}`}
                          >
                            Verify it in Quest #{entry.quest} →
                          </Link>
                        )
                      ) : (
                        // Shared vocabulary, proven on the other front door.
                        siblingQuestUrl(entry.quest) && (
                          <a className="glossary-quest" href={siblingQuestUrl(entry.quest)}>
                            Verify it in {SITE.sibling.name} Quest #{entry.quest} ↗
                          </a>
                        )
                      ))}
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
