import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const [site, base] = process.argv.slice(2);
assert(
  ['bitcoin', 'lightning'].includes(site),
  'Expected bitcoin or lightning',
);
const dir = `apps/web/dist${site === 'lightning' ? '-lightning' : ''}`;
const brand = `${site}4plebs`;
const sibling = `${site === 'bitcoin' ? 'lightning' : 'bitcoin'}4plebs`;
for (const file of ['index.html', '404.html']) {
  const html = readFileSync(`${dir}/${file}`, 'utf8');
  assert.match(html, new RegExp(`<title>${brand}`));
  assert(!html.includes(`<title>${sibling}`));
  if (file === 'index.html')
    assert(
      html.includes(`src="${base}assets/`),
      `Incorrect asset base in ${file}`,
    );
}
const manifest = JSON.parse(
  readFileSync(`${dir}/manifest.webmanifest`, 'utf8'),
);
assert.equal(manifest.name, brand);
assert.equal(manifest.start_url, base);
const cacheInputs = JSON.parse(readFileSync('nx.json', 'utf8')).targetDefaults
  .build.inputs;
for (const env of ['VITE_SITE', 'VITE_BASE'])
  assert(cacheInputs.some((input) => input.env === env));
assert(readdirSync(`${dir}/assets`).some((name) => name.endsWith('.js')));
console.log(
  `Verified ${site}: index, deep-link fallback, asset base, PWA manifest and cache inputs (${base})`,
);
