import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { groupQuestsByTrack, quests } from '@bitcoin4plebs/quests';
import { useVerifiedQuests } from '../lib/progress';

export interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The left flyout navigation: every quest, grouped by track, with the
 * reader's ✓ verified marks — plus Home and the Glossary. Closes on
 * Escape, on the overlay, and whenever navigation happens.
 */
export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const location = useLocation();
  const { verified } = useVerifiedQuests();

  // Any successful navigation closes the drawer.
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const groups = groupQuestsByTrack(quests);
  const linkClass = (to: string) =>
    `drawer-link ${location.pathname === to ? 'drawer-link-active' : ''}`;
  const current = (to: string) => (location.pathname === to ? ('page' as const) : undefined);

  return (
    <>
      <div className={`drawer-overlay ${open ? 'drawer-overlay-open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'drawer-open' : ''}`} aria-label="Site navigation" aria-hidden={!open}>
        <div className="drawer-head">
          <span className="drawer-title">
            bitcoin<span className="logo-4">4</span>plebs
          </span>
          <button className="drawer-close" onClick={onClose} aria-label="Close navigation">
            ✕
          </button>
        </div>
        <nav>
          <Link to="/" className={linkClass('/')} aria-current={current('/')}>
            <span className="drawer-link-num">⌂</span>
            <span>Home · all quests</span>
          </Link>
          {groups.map((group) => (
            <div key={group.track}>
              <div className="drawer-track">{group.track}</div>
              {group.quests.map((quest) => (
                <Link
                  key={quest.id}
                  to={`/quests/${quest.slug}`}
                  className={linkClass(`/quests/${quest.slug}`)}
                  aria-current={current(`/quests/${quest.slug}`)}
                >
                  <span className="drawer-link-num">#{quest.number}</span>
                  <span>
                    {quest.title}
                    {verified[quest.slug] && <span className="drawer-check"> ✓</span>}
                  </span>
                </Link>
              ))}
            </div>
          ))}
          <div className="drawer-track">Reference</div>
          <Link to="/questions" className={linkClass('/questions')} aria-current={current('/questions')}>
            <span className="drawer-link-num">?</span>
            <span>Got a question? Start there</span>
          </Link>
          <Link to="/map" className={linkClass('/map')} aria-current={current('/map')}>
            <span className="drawer-link-num">▦</span>
            <span>The map · what builds on what</span>
          </Link>
          <Link to="/review" className={linkClass('/review')} aria-current={current('/review')}>
            <span className="drawer-link-num">↻</span>
            <span>Daily review · five minutes</span>
          </Link>
          <Link
            to="/core-vs-knots"
            className={linkClass('/core-vs-knots')}
            aria-current={current('/core-vs-knots')}
          >
            <span className="drawer-link-num">⑂</span>
            <span>Core vs. Knots · which node?</span>
          </Link>
          <Link to="/wallets" className={linkClass('/wallets')} aria-current={current('/wallets')}>
            <span className="drawer-link-num">⚷</span>
            <span>Wallets · who holds your keys?</span>
          </Link>
          <Link to="/glossary" className={linkClass('/glossary')} aria-current={current('/glossary')}>
            <span className="drawer-link-num">§</span>
            <span>Glossary</span>
          </Link>
          <Link to="/sandbox" className={linkClass('/sandbox')} aria-current={current('/sandbox')}>
            <span className="drawer-link-num">⚙</span>
            <span>Sandbox · all the machines</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}
