import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { groupQuestsByTrack } from '@bitcoin4plebs/quests';
import { SITE, siteQuests } from '../lib/site';
import { useVerifiedQuests } from '../lib/progress';

/** The brandless reference pages, rendered only where the site offers them. */
const REFERENCE_LINKS = [
  { to: '/core-vs-knots', icon: '⑂', label: 'Core vs. Knots · which node?' },
  { to: '/wallets', icon: '⚷', label: 'Wallets · who holds your keys?' },
  { to: '/security', icon: '🛡', label: 'Keep it safe · security playbook' },
] as const;

export interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The left flyout navigation: every quest, grouped by track, with the
 * reader's ✓ verified marks, plus Home and the Glossary. Closes on
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

  const groups = groupQuestsByTrack(siteQuests);
  const linkClass = (to: string) =>
    `drawer-link ${location.pathname === to ? 'drawer-link-active' : ''}`;
  const current = (to: string) => (location.pathname === to ? ('page' as const) : undefined);

  return (
    <>
      <div className={`drawer-overlay ${open ? 'drawer-overlay-open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'drawer-open' : ''}`} aria-label="Site navigation" aria-hidden={!open}>
        <div className="drawer-head">
          <span className="drawer-title">
            {SITE.brand.pre}
            <span className="logo-4">{SITE.brand.accent}</span>
            {SITE.brand.post}
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
          {REFERENCE_LINKS.filter((link) => SITE.referencePages.includes(link.to)).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={linkClass(link.to)}
              aria-current={current(link.to)}
            >
              <span className="drawer-link-num">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
          <Link to="/glossary" className={linkClass('/glossary')} aria-current={current('/glossary')}>
            <span className="drawer-link-num">§</span>
            <span>Glossary</span>
          </Link>
          <Link to="/sandbox" className={linkClass('/sandbox')} aria-current={current('/sandbox')}>
            <span className="drawer-link-num">⚙</span>
            <span>Sandbox · all the machines</span>
          </Link>
          <a className="drawer-link drawer-link-sibling" href={SITE.sibling.url}>
            <span className="drawer-link-num">↗</span>
            <span>
              {SITE.sibling.name} · {SITE.sibling.label}
            </span>
          </a>
        </nav>
      </aside>
    </>
  );
}
