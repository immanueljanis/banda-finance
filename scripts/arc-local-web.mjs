import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const local = JSON.parse(readFileSync(new URL('../deployments/local-arc.json', import.meta.url), 'utf8'));
if (local.status !== 'local-rehearsal' || local.chainId !== 5042) throw new Error('Run the local deployment setup first');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', '3120'], {
  cwd: new URL('..', import.meta.url), stdio: 'inherit', windowsHide: true,
  env: { ...process.env, BANDA_BUILD_DIR: '.next-local', NEXT_PUBLIC_ARC_RPC_URL: 'http://127.0.0.1:8545', NEXT_PUBLIC_ARC_DIAMOND: local.diamond, NEXT_PUBLIC_ARC_DEMO_USD: local.demoUSD, NEXT_PUBLIC_PRIVY_APP_ID: '' },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
