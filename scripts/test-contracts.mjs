import { spawnSync } from 'node:child_process';
// Foundry's Windows lint resolver needs cwd to be the actual Foundry root.
const result = spawnSync('forge', ['test', '--no-match-contract', 'Robinhood'], {
  cwd: new URL('../contracts', import.meta.url), stdio: 'inherit', windowsHide: true,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
