import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { PINNED_COMMIT_SHORT } from '@bitcoin4plebs/bitcoin-logic';
import { HomePage } from '../pages/home-page';
import { QuestPage } from '../pages/quest-page';

function SiteHeader() {
  const location = useLocation();
  const onQuest = location.pathname.startsWith('/quests/');
  return (
    <header className="site-header">
      <div className="wrap">
        <Link to="/" className="logo">
          <span className="logo-accent">bitcoin4plebs</span>
          {onQuest && ' · Quest'}
        </Link>
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
          taking anyone's word for it.
        </div>
        <div>Source excerpts © Bitcoin Core developers, MIT License.</div>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <div className="app">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/quests/:slug" element={<QuestPage />} />
      </Routes>
      <SiteFooter />
    </div>
  );
}

export default App;
