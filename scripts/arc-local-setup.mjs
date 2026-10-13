import { createPublicClient, http } from 'viem';
import { spawnSync } from 'node:child_process';

// Deliberately fixed to loopback. Never run Anvil mutation methods on a remote RPC.
const rpc = 'http://127.0.0.1:8545';
const client = createPublicClient({ transport: http(rpc) });
if (await client.getChainId() !== 5042) throw new Error('Start anvil --chain-id 5042 --port 8545 --auto-impersonate --silent');
const version = await client.request({ method: 'web3_clientVersion' });
if (!version.toLowerCase().includes('anvil')) throw new Error('Local setup requires Anvil.');
const deployer = '0xc924D1236422Ccca9d08e78f059b574f443Ca29d';
const factory = '0x4e59b44847b379578588920cA78FbF26c0B4956C';
const factoryCode = '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3';
if (await client.getTransactionCount({ address: deployer }) !== 0) throw new Error('Use a fresh Anvil node; existing deployment state will not be overwritten.');
await client.request({ method: 'anvil_setCode', params: [factory, factoryCode] });
await client.request({ method: 'anvil_setBalance', params: [deployer, '0x56bc75e2d63100000'] });
const env = { ...process.env, BANDA_CHAIN_ID: '5042', BANDA_DEPLOYER: deployer, ARC_MAINNET_RPC_URL: rpc };
const deployment = spawnSync('forge', ['script', 'script/DeployArc.s.sol:DeployArc', '--rpc-url', rpc, '--sender', deployer, '--unlocked', '--broadcast', '--slow', '--non-interactive'], {
  cwd: new URL('../contracts', import.meta.url), env, stdio: 'inherit', windowsHide: true,
});
if (deployment.error || deployment.status !== 0) throw deployment.error || new Error('Local deployment failed');
const evidence = spawnSync(process.execPath, ['scripts/arc-evidence.mjs', 'contracts/broadcast/DeployArc.s.sol/5042/run-latest.json'], {
  cwd: new URL('..', import.meta.url), env, stdio: 'inherit', windowsHide: true,
});
if (evidence.error || evidence.status !== 0) throw evidence.error || new Error('Local receipt verification failed');
console.log('Local deployment only. No mainnet transaction was sent. Start scripts/arc-local-web.mjs, then run bun run test:e2e:arc.');
