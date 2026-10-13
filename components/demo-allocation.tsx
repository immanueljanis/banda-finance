"use client";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import type { Basket } from "@/constants/baskets";
import { CONTRACTS, DEPLOYED } from "@/lib/chain/arc";
import { demoAbi, demoClient, assertDemoDeployment } from "@/lib/chain/demo";
const symbols=["mNVDA","mTAO","mGOOGL","mNEAR","mGLD","mCASH"];
export function DemoAllocation({basket,amount}:{basket:Basket;amount:string}) {
  const [quantities,setQuantities]=useState<readonly bigint[]>(); const [error,setError]=useState<string>();
  const supported=basket.slug==="neural";
  useEffect(()=>{let cancelled=false;setQuantities(undefined);setError(undefined);
    if(!DEPLOYED||!supported||!/^\d+(\.\d{1,6})?$/.test(amount)||Number(amount)<10)return;
    const timer=setTimeout(()=>{void assertDemoDeployment().then(()=>demoClient.readContract({address:CONTRACTS.router,abi:demoAbi,functionName:"previewAllocation",args:[parseUnits(amount,6)]})).then(q=>{if(!cancelled)setQuantities(q);}).catch(()=>{if(!cancelled)setError("Allocation preview unavailable. Check the network and amount.");});},250);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[amount,supported]);
  return <section><h2>Simulated allocation</h2><p>No market purchases take place. These assets have no real-world backing.</p><div className="arc-table-scroll"><table className="fee-table"><thead><tr><th>Demo exposure</th><th>Weight</th>{supported&&<th>Token quantity</th>}</tr></thead><tbody>{basket.holdings.map((h,i)=><tr key={h.ticker}><td>{supported?symbols[i]:`Simulated ${h.ticker}`}</td><td>{h.weight}%</td>{supported&&<td className="mono">{quantities?formatUnits(quantities[i],18):"—"}</td>}</tr>)}</tbody></table></div>{error&&<p role="alert">{error}</p>}<p>DemoUSD stays reserved in the router. Full redemption burns issued holdings and returns the deposited credits. No yield accrues.</p></section>;
}
