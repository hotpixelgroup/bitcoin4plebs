import { useCallback, useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { PINNED_COMMIT_SHORT } from '@bitcoin4plebs/bitcoin-logic';
import { GlossaryPage } from '../pages/glossary-page';
import { HomePage } from '../pages/home-page';
import { QuestPage } from '../pages/quest-page';
import { SandboxPage } from '../pages/sandbox-page';
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
                bitcoin<span className="logo-4">4</span>plebs
              </span>
              <span className="logo-tag">don't trust. verify.</span>
            </span>
          </Link>
        </div>
        <button className="search-btn" onClick={onSearch} aria-label="Search the site">
          <span aria-hidden="true">⌕</span> search <kbd>/</kbd>
        </button>
        <div className="pin">
          source pinned: bitcoin/bitcoin @ <b>{PINNED_COMMIT_SHORT}</b>
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
            <span className="logo-accent">bitcoin4plebs</span> · understand Bitcoin's code without
            taking anyone's word for it
          </span>
          <span className="site-footer-links">
            <Link to="/">Quests</Link>
            <Link to="/glossary">Glossary</Link>
            <Link to="/sandbox">Sandbox</Link>
            <a
              href="https://github.com/hotpixelgroup/bitcoin4plebs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source ↗
            </a>
          </span>
        </div>
        <div>Source excerpts © Bitcoin Core developers, MIT License. Don't trust. Verify.</div>
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
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/quests/:slug" element={<QuestPage />} />
        </Routes>
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
