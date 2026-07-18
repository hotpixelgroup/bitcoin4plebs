import { useState } from 'react';
import { quests } from '@bitcoin4plebs/quests';

/**
 * The self-issued diploma: verify every quest and mint your own
 * certificate, because nobody grades you here, which means nobody else
 * gets to issue this either. Generated as an SVG in the browser.
 */
function diplomaSvg(name: string, date: string): string {
  const displayName = (name.trim() || 'A Certified Pleb').replace(/[<>&"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
  <rect width="960" height="600" fill="#0b0b0a"/>
  <rect x="18" y="18" width="924" height="564" rx="18" fill="none" stroke="#f7931a" stroke-width="2"/>
  <rect x="30" y="30" width="900" height="540" rx="12" fill="none" stroke="rgba(255,255,255,0.14)"/>
  <rect x="60" y="64" width="34" height="34" rx="8" fill="#111110" stroke="rgba(255,255,255,0.2)"/>
  <rect x="60" y="78" width="3" height="7" rx="1.5" fill="#f7931a"/>
  <rect x="68" y="72" width="14" height="3.4" rx="1.7" fill="#898781"/>
  <rect x="68" y="79.5" width="19" height="3.4" rx="1.7" fill="#f7931a"/>
  <rect x="68" y="87" width="11" height="3.4" rx="1.7" fill="#898781" opacity="0.55"/>
  <text x="106" y="88" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="#f6f5f1">bitcoin<tspan fill="#f7931a">4</tspan>plebs</text>
  <text x="480" y="180" text-anchor="middle" font-family="ui-monospace, monospace" font-size="15" letter-spacing="6" fill="#f7931a">DON'T TRUST. VERIFY.</text>
  <text x="480" y="250" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44" font-weight="800" fill="#f6f5f1">${displayName}</text>
  <text x="480" y="300" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" fill="#c6c4b9">read the real Bitcoin Core source, ran the real arithmetic, and verified all ${quests.length} quests</text>
  <text x="480" y="330" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" fill="#c6c4b9">with their own eyes, taking nobody's word for any of it</text>
  <text x="480" y="404" text-anchor="middle" font-family="ui-monospace, monospace" font-size="14" fill="#908e86">21,000,000 never · 20,999,999.9769 forever · 000000000019d668…</text>
  <text x="480" y="470" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#908e86">self-issued (that's the point) · ${date}</text>
  <text x="480" y="540" text-anchor="middle" font-family="ui-monospace, monospace" font-size="12" fill="#55534e">source pinned: bitcoin/bitcoin @ 18c05d9 · every excerpt CI-verified</text>
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
        <span className="viz-figure-badge"><span aria-hidden="true">🎓</span> all {quests.length} verified</span>
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
