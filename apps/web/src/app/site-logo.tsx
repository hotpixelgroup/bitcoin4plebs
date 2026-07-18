/**
 * The mark: a miniature of the site's own signature element — a code card
 * with one orange highlighted line (the .cl-hl motif every quest reader
 * knows). Drawn inline so it scales crisply everywhere. In the header it
 * doubles as the navigation button.
 */
export function LogoMark({ size }: { size: number }) {
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
