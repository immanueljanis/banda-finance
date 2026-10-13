import { readFile, writeFile } from 'node:fs/promises';
import { createPublicClient, http, parseAbi } from 'viem';
const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/arc-evidence.mjs <confirmed Foundry broadcast JSON>');
if(source.includes('dry-run'))throw new Error('Dry-run addresses are not deployment evidence.');
const rpc=process.env.ARC_MAINNET_RPC_URL||'https://rpc.mainnet.arc.io';
const client=createPublicClient({transport:http(rpc)});
const chainId=await client.getChainId();
if(![31337,5042,5042002].includes(chainId))throw new Error('Unexpected chain');
const local=['localhost','127.0.0.1'].includes(new URL(rpc).hostname);
const broadcast=JSON.parse(await readFile(source,'utf8'));
if(Number(broadcast.chain)!==chainId)throw new Error('Chain mismatch');
const txs=broadcast.transactions;
if(!txs?.length||!broadcast.receipts?.length)throw new Error('No confirmed transactions');
const transactions=[];
for(const tx of txs){
  const receipt=await client.getTransactionReceipt({hash:tx.hash});
  if(receipt.status!=='success')throw new Error(`Failed receipt ${tx.hash}`);
  transactions.push({hash:tx.hash,blockNumber:String(receipt.blockNumber),contract:tx.contractName||null,address:receipt.contractAddress||null,explorer:local?null:`https://${chainId===5042002?'explorer.testnet':'explorer'}.arc.io/tx/${tx.hash}`});
}
const deployed=name=>{const tx=txs.find(t=>t.contractName===name&&t.transactionType==='CREATE');if(!tx?.contractAddress)throw new Error(`Missing ${name}`);return tx.contractAddress;};
const manifest={chainId,status:local?'local-rehearsal':'deployed',diamond:deployed('Diamond'),demoUSD:deployed('DemoUSD'),router:deployed('MockPortfolioRouter'),registry:'0x000000006551c19487814612e58FE06813775758',registryAdapter:deployed('RegistryAdapter'),accountImplementation:deployed('ArcBasketAccount'),navAdapter:deployed('DemoNavAdapter'),deploymentBlock:transactions[0].blockNumber,transactions,verification:'pending'};
for(const key of ['diamond','demoUSD','router','registryAdapter','accountImplementation','navAdapter']){
  const code=await client.getCode({address:manifest[key]});if(!code||code==='0x')throw new Error(`No bytecode: ${key}`);
}
const abi=parseAbi(['function owner() view returns(address)','function legs() view returns(address[],uint16[])','function registry() view returns(address)','function settlementAsset() view returns(address)']);
manifest.registry=await client.readContract({address:manifest.registryAdapter,abi,functionName:'registry'});
manifest.owner=await client.readContract({address:manifest.diamond,abi,functionName:'owner'});
const settlement=await client.readContract({address:manifest.diamond,abi,functionName:'settlementAsset'});
if(settlement.toLowerCase()!==manifest.demoUSD.toLowerCase())throw new Error('Settlement mismatch');
const [tokens,weights]=await client.readContract({address:manifest.router,abi,functionName:'legs'});
manifest.assets=tokens.map((address,i)=>({address,weightBps:weights[i]}));
const target=local?'local-arc':chainId===5042?'arc-mainnet':'arc-testnet';
await writeFile(new URL(`../deployments/${target}.json`,import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(`Verified ${transactions.length} successful receipts; recorded deployments/${target}.json. Explorer source verification remains pending.`);
