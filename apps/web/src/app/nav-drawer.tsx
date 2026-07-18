import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Quest } from '@bitcoin4plebs/quests';
import { quests } from '@bitcoin4plebs/quests';
import { useVerifiedQuests } from '../lib/progress';
import { SiteLogo } from './site-logo';

export interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** Group consecutive quests that share a track, preserving curriculum order. */
function groupByTrack(all: Quest[]): Array<{ track: string; quests: Quest[] }> {
  const groups: Array<{ track: string; quests: Quest[] }> = [];
  for (const quest of all) {
    const track = quest.track ?? 'Foundations';
    const last = groups[groups.length - 1];
    if (last && last.track === track) {
      last.quests.push(quest);
    } else {
      groups.push({ track, quests: [quest] });
    }
  }
  return groups;
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

  const groups = groupByTrack(quests);
  const linkClass = (to: string) =>
    `drawer-link ${location.pathname === to ? 'drawer-link-active' : ''}`;

  return (
    <>
      <div className={`drawer-overlay ${open ? 'drawer-overlay-open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${open ? 'drawer-open' : ''}`} aria-label="Site navigation" aria-hidden={!open}>
        <div className="drawer-head">
          <SiteLogo compact />
          <button className="drawer-close" onClick={onClose} aria-label="Close navigation">
            ✕
          </button>
        </div>
        <nav>
          <Link to="/" className={linkClass('/')}>
            <span className="drawer-link-num">⌂</span>
            <span>Home — all quests</span>
          </Link>
          <Link to="/glossary" className={linkClass('/glossary')}>
            <span className="drawer-link-num">§</span>
            <span>Glossary</span>
          </Link>
          {groups.map((group) => (
            <div key={group.track}>
              <div className="drawer-track">{group.track}</div>
              {group.quests.map((quest) => (
                <Link
                  key={quest.id}
                  to={`/quests/${quest.slug}`}
                  className={linkClass(`/quests/${quest.slug}`)}
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
        </nav>
      </aside>
    </>
  );
}
