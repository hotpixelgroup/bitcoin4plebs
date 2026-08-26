import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { SITE, SITE_PIN_SHORT, SITE_REPO_URL } from '../lib/site';
import { CoreVsKnotsPage } from '../pages/core-vs-knots-page';
import { GlossaryPage } from '../pages/glossary-page';
import { HomePage } from '../pages/home-page';
import { MapPage } from '../pages/map-page';
import { QuestPage } from '../pages/quest-page';
import { QuestionsPage } from '../pages/questions-page';
import { ReviewPage } from '../pages/review-page';
import { SandboxPage } from '../pages/sandbox-page';
import { SecurityPage } from '../pages/security-page';
import { WalletsPage } from '../pages/wallets-page';
import { NavDrawer } from './nav-drawer';
import { LogoMark } from './site-logo';
import { SiteSearch } from './site-search';

function SiteHeader({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <div className="logo">
          <button className="nav-toggle" onClick={onMenu} aria-label="Open navigation">
            <LogoMark size={32} />
          </button>
          <Link to="/" className="logo-text-link">
            <span className="logo-text">
              <span className="logo-word">
                {SITE.brand.pre}
                <span className="logo-4">{SITE.brand.accent}</span>
                {SITE.brand.post}
              </span>
              <span className="logo-tag">{SITE.tagline}</span>
            </span>
          </Link>
        </div>
        <button className="search-btn" onClick={onSearch} aria-label="Search the site">
          <span aria-hidden="true">⌕</span> search <kbd>/</kbd>
        </button>
        <div className="pin">
          source pinned: {SITE.pinLabel} @ <b>{SITE_PIN_SHORT}</b>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer-row">
          <span>
            <span className="logo-accent">{SITE.name}</span> · {SITE.footerLine}
          </span>
          <span className="site-footer-links">
            <Link to="/">Quests</Link>
            <Link to="/questions">Questions</Link>
            <Link to="/glossary">Glossary</Link>
            <Link to="/sandbox">Sandbox</Link>
            <Link to="/review">Review</Link>
            <a href={SITE.sibling.url}>
              {SITE.sibling.name} · {SITE.sibling.label} ↗
            </a>
            <a href={SITE_REPO_URL} target="_blank" rel="noopener noreferrer">
              Source ↗
            </a>
          </span>
        </div>
        <div>{SITE.footerCredit} Don't trust. Verify.</div>
      </div>
    </footer>
  );
}

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
      if ((e.key === '/' && !typing) || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader onMenu={() => setDrawerOpen(true)} onSearch={() => setSearchOpen(true)} />
      <NavDrawer open={drawerOpen} onClose={closeDrawer} />
      <SiteSearch open={searchOpen} onClose={closeSearch} />
      <div id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          {/* Reference pages are per-site: a Bitcoin-only page must not
              appear, half-relevant, inside the Lightning brand. */}
          {SITE.referencePages.includes('/core-vs-knots') && (
            <Route path="/core-vs-knots" element={<CoreVsKnotsPage />} />
          )}
          {SITE.referencePages.includes('/wallets') && (
            <Route path="/wallets" element={<WalletsPage />} />
          )}
          {SITE.referencePages.includes('/security') && (
            <Route path="/security" element={<SecurityPage />} />
          )}
          <Route path="/map" element={<MapPage />} />
          <Route path="/quests/:slug" element={<QuestPage />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
