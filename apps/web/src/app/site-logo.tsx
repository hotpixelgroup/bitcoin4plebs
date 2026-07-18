import { Link } from 'react-router-dom';

/**
 * The mark: a miniature of the site's own signature element — a code card
 * with one orange highlighted line (the .cl-hl motif every quest reader
 * knows). Drawn inline so it scales crisply everywhere.
 */
function LogoMark({ size }: { size: number }) {
  return (
    <svg
      className="logo-mark"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="1" y="1" width="30" height="30" rx="7.5" fill="#141413" stroke="rgba(255, 255, 255, 0.18)" />
      <rect x="1" y="13" width="2.6" height="6" rx="1.3" fill="#f7931a" />
      <rect x="8" y="8" width="13" height="3.2" rx="1.6" fill="#898781" />
      <rect className="logo-mark-hl" x="8" y="14.4" width="17" height="3.2" rx="1.6" fill="#f7931a" />
      <rect x="8" y="20.8" width="10" height="3.2" rx="1.6" fill="#898781" fillOpacity="0.55" />
    </svg>
  );
}

export interface SiteLogoProps {
  /** Smaller mark, no tagline — for the nav drawer header. */
  compact?: boolean;
}

/**
 * The bitcoin4plebs lockup: code-card mark, wordmark with the mono orange
 * "4" as its fulcrum, and the site's whole thesis as the tagline.
 */
export function SiteLogo({ compact }: SiteLogoProps) {
  return (
    <Link to="/" className={`logo ${compact ? 'logo-compact' : ''}`} aria-label="bitcoin4plebs — home">
      <LogoMark size={compact ? 24 : 30} />
      <span className="logo-text">
        <span className="logo-word">
          bitcoin<span className="logo-4">4</span>plebs
        </span>
        {!compact && <span className="logo-tag">don't trust. verify.</span>}
      </span>
    </Link>
  );
}
