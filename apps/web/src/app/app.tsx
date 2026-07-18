import { useCallback, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { PINNED_COMMIT_SHORT } from '@bitcoin4plebs/bitcoin-logic';
import { GlossaryPage } from '../pages/glossary-page';
import { HomePage } from '../pages/home-page';
import { QuestPage } from '../pages/quest-page';
import { NavDrawer } from './nav-drawer';
import { SiteLogo } from './site-logo';

function SiteHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <button className="nav-toggle" onClick={onMenu} aria-label="Open navigation">
          ☰
        </button>
        <SiteLogo />
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
        <div>
          <span className="logo-accent">bitcoin4plebs</span> — understand Bitcoin's code without
          taking anyone's word for it. <Link to="/glossary">Glossary</Link>
        </div>
        <div>Source excerpts © Bitcoin Core developers, MIT License.</div>
      </div>
    </footer>
  );
}

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="app">
      <SiteHeader onMenu={() => setDrawerOpen(true)} />
      <NavDrawer open={drawerOpen} onClose={closeDrawer} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/glossary" element={<GlossaryPage />} />
        <Route path="/quests/:slug" element={<QuestPage />} />
      </Routes>
      <SiteFooter />
    </div>
  );
}

export default App;
