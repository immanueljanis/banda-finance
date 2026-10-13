"use client";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { BASKETS, type Basket } from "@/constants/baskets";
import { DEPLOYED } from "@/lib/chain/arc";
import { demoAbi, demoClient, assertDemoDeployment, routerFor } from "@/lib/chain/demo";
const tokenSymbol=(ticker:string)=>ticker==="USDG"?"mCASH":`m${ticker}`;
export function DemoAllocation({basket,amount}:{basket:Basket;amount:string}) {
  const [quantities,setQuantities]=useState<readonly bigint[]>(); const [error,setError]=useState<string>();
  const strategyId=BASKETS.findIndex(entry=>entry.slug===basket.slug)+1;
  useEffect(()=>{let cancelled=false;setQuantities(undefined);setError(undefined);
    if(!DEPLOYED||strategyId<1||!/^\d+(\.\d{1,6})?$/.test(amount)||Number(amount)<10)return;
    const timer=setTimeout(()=>{void assertDemoDeployment().then(()=>routerFor(strategyId)).then(router=>demoClient.readContract({address:router,abi:demoAbi,functionName:"previewAllocation",args:[parseUnits(amount,6)]})).then(q=>{if(!cancelled)setQuantities(q);}).catch(()=>{if(!cancelled)setError("Allocation preview unavailable. Check the network and amount.");});},250);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[amount,strategyId]);
  return <section><h2>Allocation</h2><div className="arc-table-scroll"><table className="fee-table"><thead><tr><th>Asset</th><th>Weight</th><th>Token quantity</th></tr></thead><tbody>{basket.holdings.map((h,i)=><tr key={h.ticker}><td>{tokenSymbol(h.ticker)}</td><td>{h.weight}%</td><td className="mono">{quantities?formatUnits(quantities[i],18):"—"}</td></tr>)}</tbody></table></div>{error&&<p role="alert">{error}</p>}<p>Your deposit is split across these assets into the Basket&apos;s own vault. Redeeming returns your full deposit.</p></section>;
}
