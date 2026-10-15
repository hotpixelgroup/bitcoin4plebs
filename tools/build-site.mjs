import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
// The dispatcher has no cached outputs. Each child owns exactly one directory.
const site = process.env.VITE_SITE === 'lightning' ? 'lightning' : 'bitcoin';
const result = spawnSync(
  process.execPath,
  [resolve('node_modules/.bin/nx'), 'run', `@bitcoin4plebs/web:build-${site}`],
  {
    stdio: 'inherit',
    env: { ...process.env, VITE_SITE: site },
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
