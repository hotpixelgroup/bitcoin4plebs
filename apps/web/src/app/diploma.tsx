import { useState } from 'react';
import { SITE, SITE_PIN_SHORT, siteQuests } from '../lib/site';

/**
 * The self-issued diploma: verify every quest and mint your own
 * certificate, because nobody grades you here, which means nobody else
 * gets to issue this either. Generated as an SVG in the browser.
 */
function diplomaSvg(name: string, date: string): string {
  const displayName = (name.trim() || 'A Certified Pleb').replace(/[<>&"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
  <rect width="960" height="600" fill="#0b0b0a"/>
  <rect x="18" y="18" width="924" height="564" rx="18" fill="none" stroke="${SITE.accent}" stroke-width="2"/>
  <rect x="30" y="30" width="900" height="540" rx="12" fill="none" stroke="rgba(255,255,255,0.14)"/>
  <rect x="60" y="64" width="34" height="34" rx="8" fill="#111110" stroke="rgba(255,255,255,0.2)"/>
  <rect x="60" y="78" width="3" height="7" rx="1.5" fill="${SITE.accent}"/>
  <rect x="68" y="72" width="14" height="3.4" rx="1.7" fill="#898781"/>
  <rect x="68" y="79.5" width="19" height="3.4" rx="1.7" fill="${SITE.accent}"/>
  <rect x="68" y="87" width="11" height="3.4" rx="1.7" fill="#898781" opacity="0.55"/>
  <text x="106" y="88" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#f6f5f1">${SITE.brand.pre}<tspan fill="${SITE.accent}">${SITE.brand.accent}</tspan>${SITE.brand.post}</text>
  <text x="480" y="180" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" letter-spacing="6" fill="${SITE.accent}">${SITE.tagline.toUpperCase()}</text>
  <text x="480" y="250" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44" font-weight="800" fill="#f6f5f1">${displayName}</text>
  <text x="480" y="300" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" fill="#c6c4b9">${SITE.diploma.claim.replace('{n}', String(siteQuests.length))}</text>
  <text x="480" y="330" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" fill="#c6c4b9">${SITE.diploma.claim2}</text>
  <text x="480" y="404" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14" fill="#908e86">${SITE.diploma.footnote}</text>
  <text x="480" y="470" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#908e86">self-issued (that's the point) · ${date}</text>
  <text x="480" y="540" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="#55534e">source pinned: ${SITE.pinLabel} @ ${SITE_PIN_SHORT} · every excerpt CI-verified</text>
</svg>`;
}

export function Diploma() {
  const [name, setName] = useState('');

  const download = () => {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const blob = new Blob([diplomaSvg(name, date)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certified-pleb.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="diploma">
      <div className="diploma-head">
        <span className="viz-figure-badge"><span aria-hidden="true">🎓</span> all {siteQuests.length} verified</span>
        <strong>Claim your diploma</strong>
      </div>
      <p className="diploma-blurb">
        You verified every quest with your own eyes, so you get to issue your own certificate.
        Nobody else here is qualified to.
      </p>
      <div className="diploma-row">
        <input
          className="height-input diploma-name"
          type="text"
          placeholder="Your name (optional)"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="runbtn diploma-btn" onClick={download}>
          Download (SVG)
        </button>
      </div>
    </div>
  );
}
