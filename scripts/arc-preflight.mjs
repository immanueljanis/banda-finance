import { createPublicClient, http, formatUnits, getAddress, keccak256 } from 'viem';
import { readFile, writeFile } from 'node:fs/promises';

const rpc = process.env.ARC_MAINNET_RPC_URL || 'https://rpc.mainnet.arc.io';
const deployer = getAddress(process.env.BANDA_DEPLOYER || '0xc924D1236422Ccca9d08e78f059b574f443Ca29d');
const expected = Number(process.env.BANDA_CHAIN_ID || 5042);
if (![5042, 5042002].includes(expected)) throw new Error('Use Arc Mainnet or explicit Arc Testnet for preflight.');
const registry = '0x000000006551c19487814612e58FE06813775758';
const factory = '0x4e59b44847b379578588920cA78FbF26c0B4956C';
const expectedFactory = '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3';
const data = (await readFile(new URL('../contracts/script/data/erc6551-deployment.hex', import.meta.url), 'utf8')).trim();
const runtime = `0x${data.slice(2 + 64 * 2)}`;
const client = createPublicClient({ transport: http(rpc, { timeout: 20_000, retryCount: 1 }) });
const chainId = await client.getChainId();
if (chainId !== expected) throw new Error(`Wrong chain: ${chainId}; expected ${expected}`);
const [blockNumber, balance, nonce, gasPrice, registryCode, factoryCode] = await Promise.all([
  client.getBlockNumber(), client.getBalance({address:deployer}), client.getTransactionCount({address:deployer}),
  client.getGasPrice(), client.getCode({address:registry}), client.getCode({address:factory}),
]);
if (registryCode && registryCode !== '0x' && keccak256(registryCode) !== keccak256(runtime)) throw new Error('Canonical registry bytecode mismatch');
if (factoryCode !== expectedFactory) throw new Error('Deterministic factory bytecode mismatch');
const simulationPath = process.argv[2];
let simulatedGas = null;
let simulationTransactions = null;
if (simulationPath) {
  const simulation = JSON.parse(await readFile(simulationPath, 'utf8'));
  if (Number(simulation.chain) !== chainId) throw new Error('Simulation chain mismatch');
  const txs = simulation.transactions;
  if (!txs?.length || txs.some(t=>t.transaction.from.toLowerCase()!==deployer.toLowerCase())) throw new Error('Simulation sender mismatch');
  simulatedGas = txs.reduce((sum,t)=>sum+BigInt(t.transaction.gas),0n);
  simulationTransactions = txs.length;
}
const feeBudget = simulatedGas === null ? null : simulatedGas * gasPrice * 2n;
const result = {
  kind:'read-only-preflight-not-deployment', checkedAt:new Date().toISOString(), chainId, blockNumber:String(blockNumber),
  deployer, intendedDiamondOwner:deployer, nonce, nativeBalanceUSDC:formatUnits(balance,18),
  gasPriceNativeUnits:String(gasPrice), registry, registryStatus:registryCode && registryCode!=='0x'?'verified-bytecode':'absent-deploy-published-singleton',
  expectedRegistryCodeHash:keccak256(runtime), factory, factoryBytecodeVerified:true,
  simulationPath:simulationPath||null, simulationTransactions, simulatedGasLimitTotal:simulatedGas?.toString()??null,
  budgetAtTwiceCurrentGasPriceUSDC:feeBudget===null?null:formatUnits(feeBudget,18),
  fundedForBudget:feeBudget===null?null:balance>=feeBudget,
  authorization:'NOT AUTHORIZED TO BROADCAST',
};
await writeFile(new URL(`../deployments/preflight-${chainId}.json`,import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
