import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { createPublicClient, http, parseAbi, decodeEventLog, formatUnits } from "viem";

const rpcUrl = "http://127.0.0.1:8545";
const rpc = createPublicClient({transport:http(rpcUrl)});
const local = JSON.parse(readFileSync("deployments/local-arc.json","utf8"));
const holder = "0x000000000000000000000000000000000000beef";
const disclosure = "Arc Mainnet Proof of Concept. All portfolio assets and valuations are simulated and have no real-world backing or monetary value.";

const routes=["/","/basket/neural","/basket/rails","/basket/reserve","/basket/frontier","/basket/fortress","/mint","/portfolio","/docs"];
for(const width of [375,1440]) for(const route of routes) test(`${route} disclosures and layout fit ${width}px`,async({page})=>{
    const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
    await page.setViewportSize({width,height:900});
    await page.goto(route);await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(disclosure,{exact:true})).toBeVisible();
    if(route==="/") for(const name of ["NEURAL","RAILS","RESERVE","FRONTIER","FORTRESS"]) await expect(page.getByRole("link",{name,exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(route.startsWith('/basket/')&&!route.endsWith('/neural')) await expect(page.locator('.buy-panel button[type="submit"]')).toBeDisabled();
    await expect(page.locator("main")).not.toContainText(/live market prices|earns interest|Morpho|Paxos/);
    expect(errors).toEqual([]);
});

test("wallet faucet, deposit, real token custody and full redemption on local Arc rehearsal",async({page})=>{
  expect(new URL(rpcUrl).hostname).toBe('127.0.0.1');
  expect(local.status).toBe('local-rehearsal');
  const snapshot = await rpc.request({method:'evm_snapshot' as never}) as string;
  try {
    await rpc.request({method:'anvil_setBalance' as never,params:[holder,'0x56bc75e2d63100000'] as never});
    await page.addInitScript(({holder,rpcUrl})=>{
      const listeners=new Map<string,Set<(...args:unknown[])=>void>>();
      let chain='0x1';
      const sent:string[]=[];
      Object.assign(window, {demoTestHashes:sent, ethereum:{
        on:(event:string,listener:(...args:unknown[])=>void)=>{if(!listeners.has(event))listeners.set(event,new Set());listeners.get(event)!.add(listener);},
        removeListener:(event:string,listener:(...args:unknown[])=>void)=>listeners.get(event)?.delete(listener),
        request:async({method,params=[]}:{method:string;params:unknown[]})=>{
          if(method==='eth_requestAccounts'||method==='eth_accounts')return [holder];
          if(method==='eth_chainId')return chain;
          if(method==='wallet_switchEthereumChain'){chain=(params[0] as {chainId:string}).chainId;return null;}
          if(method==='wallet_addEthereumChain')return null;
          const response=await fetch(rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
          const data=await response.json();if(data.error)throw Object.assign(new Error(data.error.message),{code:data.error.code});
          if(method==='eth_sendTransaction')sent.push(data.result);
          return data.result;
        },
      }});
    },{holder,rpcUrl});
    await page.goto('/mint');
    await page.getByRole('button',{name:'Connect wallet',exact:true}).first().click();
    await expect(page.getByRole('button',{name:'Disconnect'})).toBeVisible();
    await page.getByRole('button',{name:'Claim DemoUSD',exact:true}).click();
    await expect(page.locator('.wallet-balance-value')).toHaveText('1000');
    await page.getByRole('button',{name:'Claim DemoUSD',exact:true}).click();
    await expect(page.locator('.demo-status').getByRole('alert')).toContainText('24 hours');
    await page.getByRole('link',{name:'Baskets',exact:true}).click();
    await page.getByRole('link',{name:'NEURAL',exact:true}).click();
    const input=page.getByLabel('Amount in DemoUSD');
    for(const invalid of ['0','9.999999','1001','10.0000001']){
      await input.fill(invalid);await expect(page.getByRole('button',{name:/Deposit DemoUSD/})).toBeDisabled();
    }
    await input.fill('100.000001');
    await expect(page.locator('.detail-content')).toContainText('0.3');
    await page.getByRole('button',{name:/Deposit DemoUSD/}).click();
    await expect(page.locator('.wallet-balance-value')).toHaveText('899.999999');
    const hashes=await page.evaluate(()=>(window as unknown as {demoTestHashes:string[]}).demoTestHashes);
    expect(hashes).toHaveLength(3); // claim + exact approval + deposit; denied claim never broadcast.
    const receipt=await rpc.getTransactionReceipt({hash:hashes[2] as `0x${string}`});expect(receipt.status).toBe('success');
    const eventAbi=parseAbi(['event BasketDeposited(uint256 indexed tokenId,uint32 indexed strategyId,address indexed owner,address account,uint256 assets,uint256 shares)']);
    const event=receipt.logs.map(log=>{try{return decodeEventLog({abi:eventAbi,data:log.data,topics:log.topics});}catch{return null;}}).find(Boolean)!;
    expect(event.args.assets).toBe(BigInt(100000001));
    await page.getByRole('link',{name:/Inspect portfolio/}).click();
    await expect(page.locator('.arc-position').first()).toContainText(`NFT #${event.args.tokenId}`);
    await expect(page.locator('.arc-position').first()).toContainText(event.args.account);
    await expect(page.locator('.arc-position').first()).toContainText('100.000001 DemoUSD');
    const tokenAbi=parseAbi(['function balanceOf(address) view returns(uint256)','function totalLiability() view returns(uint256)']);
    const before=[];
    for(const asset of local.assets){
      const balance=await rpc.readContract({address:asset.address,abi:tokenAbi,functionName:'balanceOf',args:[event.args.account]});
      expect(balance).toBeGreaterThan(BigInt(0));before.push({token:asset.address,balance:balance.toString()});
      await expect(page.locator('.arc-position').first()).toContainText(formatUnits(balance,18));
    }
    await page.getByRole('button',{name:/Redeem all/}).click();
    await expect(page.getByText(/fully redeemed. Receipt confirmed/)).toBeVisible();
    await expect(page.getByText(/No open Baskets at block/)).toBeVisible();
    await expect(page.locator('.wallet-balance-value')).toHaveText('1000');
    for(const asset of local.assets)expect(await rpc.readContract({address:asset.address,abi:tokenAbi,functionName:'balanceOf',args:[event.args.account]})).toBe(BigInt(0));
    const redeemHashes=await page.evaluate(()=>(window as unknown as {demoTestHashes:string[]}).demoTestHashes);
    const redemption=await rpc.getTransactionReceipt({hash:redeemHashes.at(-1) as `0x${string}`});expect(redemption.status).toBe('success');
    writeFileSync('deployments/local-journey.json',JSON.stringify({kind:'local-anvil-only-not-mainnet',checkedAt:new Date().toISOString(),tokenId:String(event.args.tokenId),account:event.args.account,holdingsBeforeRedemption:before,hashes:redeemHashes,depositBlock:String(receipt.blockNumber),redemptionBlock:String(redemption.blockNumber),result:'full-refund-and-zero-issued-holdings'},null,2)+'\n');
  } finally {await rpc.request({method:'evm_revert' as never,params:[snapshot] as never});}
});
