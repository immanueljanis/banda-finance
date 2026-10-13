"use client";
import Link from "next/link";
import { formatUnits } from "viem";
import { useState } from "react";
import { useWallet } from "./wallet";
import { DemoStatus, Usdc } from "./demo-status";
import { MintPanel } from "./mint-panel";
import { CONTRACTS, DEPLOYED, explorerAddress } from "@/lib/chain/arc";
export function DemoPortfolio(){
  const wallet=useWallet();const [redeemed,setRedeemed]=useState<string>();
  return <main id="main"><section className="detail-note"><div className="wrap detail-hero"><h1>Your Baskets.</h1><p>Live ownership and custody on Arc, read straight from the chain.</p></div></section>
    <div className="wrap arc-portfolio"><DemoStatus/>
      {!wallet.connected?<button className="primary-button" onClick={wallet.connect}>Connect wallet</button>:<><p className="mono arc-address">Wallet: {wallet.address}</p><p>Balance: {wallet.portfolioStatus==="ready"?<>{wallet.balanceLabel} <Usdc/></>:"unavailable"} · Gas: {wallet.gasBalance} USDC</p><button className="text-link" onClick={wallet.refreshPortfolio}>Refresh onchain state</button></>}
      {wallet.portfolioStatus==="loading"&&<p role="status">Reading onchain balances…</p>}
      {wallet.portfolioStatus==="ready"&&wallet.positions.length===0&&<p>No open Baskets at block {wallet.portfolioBlock}. <Link href="/#baskets">Explore Baskets →</Link></p>}
      {redeemed&&<p role="status">Basket #{redeemed} fully redeemed. Receipt confirmed; deposit returned.</p>}
      {wallet.positions.map(p=><article className="portfolio-item arc-position" key={p.tokenId}><h2>{p.name} · NFT #{p.tokenId}</h2>
        <dl className="arc-details"><div><dt>Owner</dt><dd><a href={explorerAddress(p.owner)}>{p.owner}</a></dd></div><div><dt>ERC-6551 account</dt><dd><a href={explorerAddress(p.account)}>{p.account}</a></dd></div><div><dt>Value</dt><dd>{formatUnits(BigInt(p.shares),6)} <Usdc/></dd></div><div><dt>Observed block</dt><dd>{wallet.portfolioBlock}</dd></div></dl>
        <div className="arc-table-scroll"><table className="fee-table"><thead><tr><th>Asset</th><th>Balance</th><th>Target allocation</th><th>Price</th></tr></thead><tbody>{p.holdings.map(h=><tr key={h.token}><td><a href={explorerAddress(h.token)}>{h.symbol} ↗</a></td><td className="mono">{formatUnits(BigInt(h.balance),18)}</td><td>{h.weight}%</td><td>{formatUnits(BigInt(h.price),6)} <Usdc/></td></tr>)}</tbody></table></div>
        <p>Redeeming returns your full deposit and closes this NFT.</p>
        <button className="primary-button" disabled={wallet.transactionStatus!=="idle"} onClick={()=>{setRedeemed(undefined);void wallet.redeem(p.tokenId,formatUnits(BigInt(p.shares),6)).then(()=>setRedeemed(p.tokenId)).catch(()=>{});}}>Redeem all · {formatUnits(BigInt(p.shares),6)} USDC</button>
      </article>)}
      <MintPanel/>
      {DEPLOYED&&<section className="arc-position"><h2>Contracts</h2>{Object.entries(CONTRACTS).map(([name,address])=><p className="arc-address" key={name}>{name}: <a href={explorerAddress(address)}>{address}</a></p>)}</section>}
    </div>
  </main>;
}
