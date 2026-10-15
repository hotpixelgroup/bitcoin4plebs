import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const cache = mkdtempSync(join(tmpdir(), 'plebs-nx-cache-'));
const nx = resolve('node_modules/.bin/nx');
function run(site, base) {
  const log = execFileSync(process.execPath, [nx, 'build', 'web'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NX_DAEMON: 'false',
      NX_CACHE_DIRECTORY: cache,
      VITE_SITE: site,
      VITE_BASE: base,
    },
  });
  execFileSync(process.execPath, ['tools/assert-site-build.mjs', site, base], {
    stdio: 'inherit',
  });
  return log;
}
function digest(dir) {
  const hash = createHash('sha256');
  function visit(path) {
    for (const item of readdirSync(path, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const next = join(path, item.name);
      if (item.isDirectory()) visit(next);
      else {
        hash.update(next);
        hash.update(readFileSync(next));
      }
    }
  }
  visit(dir);
  return hash.digest('hex');
}
run('lightning', '/old-ln/');
run('bitcoin', '/btc/');
run('lightning', '/new-ln/');
const lightning = digest('apps/web/dist-lightning');
const btcRestore = run('bitcoin', '/btc/');
assert.match(
  btcRestore.replace(/\x1b\[[0-9;]*m/g, ''),
  /web:build-bitcoin[^\n]*\[local cache\]/,
  'Expected Bitcoin child target cache restoration',
);
assert.equal(
  digest('apps/web/dist-lightning'),
  lightning,
  'Bitcoin cache restore overwrote the newer Lightning sibling',
);
run('bitcoin', '/new-btc/');
const bitcoin = digest('apps/web/dist');
const lnRestore = run('lightning', '/new-ln/');
assert.match(
  lnRestore.replace(/\x1b\[[0-9;]*m/g, ''),
  /web:build-lightning[^\n]*\[local cache\]/,
  'Expected Lightning child target cache restoration',
);
assert.equal(
  digest('apps/web/dist'),
  bitcoin,
  'Lightning cache restore overwrote the newer Bitcoin sibling',
);
console.log(
  'Both variant cache restores preserve every byte of the newer sibling artifact.',
);
