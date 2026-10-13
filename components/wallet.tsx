"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, formatUnits, parseUnits, type Address, type Hash, type EIP1193Provider } from "viem";
import { ARC, CONTRACTS, DEPLOYED } from "@/lib/chain/arc";
import { demoAbi, demoClient, assertDemoDeployment, readDemoPortfolio, type DemoPosition } from "@/lib/chain/demo";
export type WalletPosition = DemoPosition;

type PortfolioResponse = {
  address: string;
  blockNumber: string;
  settlementBalance: string;
  positions: Array<{
    tokenId: string;
    strategyId: number;
    account: string;
    shares: string;
  }>;
  source: "robinhood-rpc-state";
  fetchedAt: string;
};

type Wallet = {
  claim: () => Promise<Hash>;
  gasBalance: string;
  lastHash?: Hash;
  lastConfirmedHash?: Hash;
  connected: boolean;
  ready: boolean;
  address?: string;
  walletName?: string;
  connecting: boolean;
  error?: string;
  connect: () => void;
  disconnect: () => void;
  balance: number;
  balanceLabel: string;
  positions: WalletPosition[];
  portfolioStatus: "idle" | "loading" | "ready" | "error";
  portfolioBlock?: string;
  portfolioFetchedAt?: string;
  refreshPortfolio: () => void;
  deposit: (strategyId: number, amount: string) => Promise<Hash>;
  redeem: (tokenId: string, shares: string) => Promise<Hash>;
  warmUp: (strategyId: number) => void;
  warmRedemption: (tokenId: string) => Promise<void>;
  previewRedemption: (tokenId: string, shares: string) => Promise<readonly [bigint, bigint, bigint]>;
  transactionStatus: "idle" | "preparing" | "signing" | "confirming";
};


const Context = createContext<Wallet | null>(null);
type Connection = { address?: Address; connect: () => Promise<void>; disconnect: () => void; provider: () => Promise<EIP1193Provider>; ready: boolean };
export function WalletProvider({children}: {children: ReactNode}) {
  const { ready, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const active = wallets.find(w => !w.walletClientType.startsWith("privy")) ?? wallets[0];
  return <DemoWallet connection={{ready, address: active?.address as Address | undefined, connect: async()=>{login();}, disconnect:()=>{void logout();}, provider:async()=>{if(!active) throw new Error("Connect a wallet first"); return await active.getEthereumProvider() as unknown as EIP1193Provider;}}}>{children}</DemoWallet>;
}
export function FallbackWalletProvider({children}: {children: ReactNode}) {
  const [address,setAddress]=useState<Address>();
  const provider=useCallback(async()=>{
    const p=(window as unknown as {ethereum?: EIP1193Provider}).ethereum;
    if(!p) throw new Error("Install MetaMask or Rabby to connect a wallet.");
    return p;
  },[]);
  useEffect(()=>{
    const p=(window as unknown as {ethereum?: EIP1193Provider}).ethereum;
    if(!p) return;
    const changed=(accounts: string[])=>setAddress(accounts[0] as Address | undefined);
    const disconnected=()=>setAddress(undefined);
    p.on("accountsChanged",changed); p.on("disconnect",disconnected);
    return ()=>{p.removeListener("accountsChanged",changed);p.removeListener("disconnect",disconnected);};
  },[]);
  return <DemoWallet connection={{ready:true,address,provider,disconnect:()=>setAddress(undefined),connect:async()=>{const p=await provider();const accounts=await p.request({method:"eth_requestAccounts"});setAddress(accounts[0]);}}}>{children}</DemoWallet>;
}
function DemoWallet({children,connection}: {children:ReactNode;connection:Connection}) {
  const {address}=connection;
  const [connecting,setConnecting]=useState(false);
  const [error,setError]=useState<string>();
  const [portfolio,setPortfolio]=useState<Awaited<ReturnType<typeof readDemoPortfolio>>>();
  const [portfolioStatus,setPortfolioStatus]=useState<Wallet["portfolioStatus"]>("idle");
  const [transactionStatus,setTransactionStatus]=useState<Wallet["transactionStatus"]>("idle");
  const [lastHash,setLastHash]=useState<Hash>();
  const [lastConfirmedHash,setLastConfirmedHash]=useState<Hash>();
  const lock=useRef(false);
  const generation=useRef(0);
  const load=useCallback(async()=>{
    const request=++generation.current;
    if(!address){setPortfolio(undefined);setPortfolioStatus("idle");return;}
    setPortfolio(undefined);
    if(!DEPLOYED){setPortfolioStatus("idle");return;}
    setPortfolioStatus("loading");
    try {const p=await readDemoPortfolio(address);if(request===generation.current){setPortfolio(p);setPortfolioStatus("ready");}}
    catch(e){if(request===generation.current){setPortfolioStatus("error");setError(e instanceof Error?e.message:"Unable to read portfolio");}}
  },[address]);
  useEffect(()=>{setError(undefined);setLastHash(undefined);void load();return()=>{++generation.current;};},[load]);
  const fail=(e:unknown)=>{const raw=e instanceof Error?e.message:"Transaction failed";const message=/daily limit/i.test(raw)?"Faucet limit: wait 24 hours before claiming again.":/lifetime limit/i.test(raw)?"This wallet has reached its 5,000 test USDC lifetime limit.":/insufficient funds/i.test(raw)?"This wallet needs native USDC for Arc network gas.":/user rejected|user denied/i.test(raw)?"Request cancelled in your wallet.":raw.split("\n").filter(Boolean).slice(0,2).join(" ");setError(message);return new Error(message);};
  async function client(){
    if(!address)throw new Error("Connect a wallet first");
    await assertDemoDeployment();
    const p=await connection.provider();
    try {await p.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x13b2"}]});}
    catch(e){if((e as {code?:number}).code!==4902)throw e;await p.request({method:"wallet_addEthereumChain",params:[{chainId:"0x13b2",chainName:ARC.name,nativeCurrency:ARC.nativeCurrency,rpcUrls:[...ARC.rpcUrls.default.http],blockExplorerUrls:[ARC.blockExplorers.default.url]}]});await p.request({method:"wallet_switchEthereumChain",params:[{chainId:"0x13b2"}]});}
    const walletCode=await p.request({method:"eth_getCode",params:[CONTRACTS.diamond,"latest"]});
    if(!walletCode||walletCode==="0x")throw new Error("Your wallet's network has no Banda contracts. Point the wallet's Arc network at the same RPC as this app and retry.");
    const accounts=await p.request({method:"eth_accounts"});
    if(accounts[0]?.toLowerCase()!==address.toLowerCase())throw new Error("Wallet account changed. Reconnect and retry.");
    return createWalletClient({account:address,chain:ARC,transport:custom(p)});
  }
  type Client = Awaited<ReturnType<typeof client>>;
  async function send(c:Client,to:Address,fn:"claim"|"approve"|"deposit"|"redeem",args:readonly unknown[]=[]){
    const request={address:to,abi:demoAbi,functionName:fn,args,account:c.account,chain:ARC} as never;
    await demoClient.simulateContract(request);
    const estimatedGas=await demoClient.estimateContractGas(request);
    const gas=estimatedGas*BigInt(120)/BigInt(100);
    setTransactionStatus("signing");
    const hash=await c.writeContract({...(request as object),gas} as never);
    setLastHash(hash);setTransactionStatus("confirming");
    const receipt=await demoClient.waitForTransactionReceipt({hash});
    if(receipt.status!=="success")throw new Error("Transaction reverted. No success was recorded.");
    setLastConfirmedHash(hash);
    return hash;
  }
  async function transaction(run:(c:Client)=>Promise<Hash>){
    if(lock.current)throw new Error("A transaction is already in progress");
    lock.current=true;setError(undefined);setLastHash(undefined);setLastConfirmedHash(undefined);setTransactionStatus("preparing");
    try {const hash=await run(await client());await load();return hash;}
    catch(e){throw fail(e);}finally{lock.current=false;setTransactionStatus("idle");}
  }
  const previewRedemption=async(tokenId:string,shares:string)=>{
    await assertDemoDeployment();
    return demoClient.readContract({address:CONTRACTS.diamond,abi:demoAbi,functionName:"previewRedeem",args:[BigInt(tokenId),parseUnits(shares,6)]});
  };
  const balanceLabel=portfolio?formatUnits(BigInt(portfolio.settlementBalance),6):"0";
  return <Context.Provider value={{
    ready:connection.ready, connected:!!address,address,connecting,error,
    connect:()=>{setConnecting(true);setError(undefined);void connection.connect().catch(e=>{fail(e);}).finally(()=>setConnecting(false));},
    disconnect:connection.disconnect,balance:Number(balanceLabel),balanceLabel,
    positions:portfolio?.positions??[],portfolioStatus,portfolioBlock:portfolio?.blockNumber,
    gasBalance:portfolio?formatUnits(BigInt(portfolio.gasBalance),18):"unavailable",lastHash,lastConfirmedHash,
    refreshPortfolio:()=>{void load();}, transactionStatus, warmUp:()=>{},warmRedemption:async()=>{},previewRedemption,
    claim:()=>transaction(c=>send(c,CONTRACTS.demoUSD,"claim")),
    deposit:async(strategyId,amount)=>transaction(async c=>{
      if(!Number.isInteger(strategyId)||strategyId<1||strategyId>5)throw new Error("Unknown Basket.");
      if(!/^\d+(\.\d{1,6})?$/.test(amount))throw new Error("Use up to six decimal places.");
      const units=parseUnits(amount,6);if(units<BigInt(10e6))throw new Error("Minimum deposit is 10 USDC.");
      const allowance=await demoClient.readContract({address:CONTRACTS.demoUSD,abi:demoAbi,functionName:"allowance",args:[c.account.address,CONTRACTS.diamond]});
      if(allowance<units)await send(c,CONTRACTS.demoUSD,"approve",[CONTRACTS.diamond,units]);
      return send(c,CONTRACTS.diamond,"deposit",[strategyId,units]);
    }),
    redeem:async(tokenId,shares)=>transaction(async c=>{
      const units=parseUnits(shares,6);
      const basket=await demoClient.readContract({address:CONTRACTS.diamond,abi:demoAbi,functionName:"basket",args:[BigInt(tokenId)]});
      if(units!==basket[2])throw new Error("This demo supports full redemption only.");
      return send(c,CONTRACTS.diamond,"redeem",[BigInt(tokenId),units,units]);
    }),
  }}>{children}</Context.Provider>;
}
export function useWallet(){const wallet=useContext(Context);if(!wallet)throw new Error("WalletProvider is required");return wallet;}
