"use client";
import { useWallet } from "./wallet";
import { DEPLOYED, explorerTx } from "@/lib/chain/arc";
export function DemoStatus() {
  const wallet = useWallet();
  return <div className="demo-status" aria-live="polite">
    {!DEPLOYED && <p>Arc deployment is pending. Contract actions are disabled until verified addresses are configured.</p>}
    {wallet.transactionStatus !== "idle" && <p role="status">{wallet.transactionStatus === "preparing" ? "Checking network and simulating transaction…" : wallet.transactionStatus === "signing" ? "Review the transaction in your wallet…" : "Transaction submitted. Waiting for receipt…"}</p>}
    {wallet.error && <p role="alert">{wallet.error}</p>}
    {wallet.lastHash && wallet.lastConfirmedHash === wallet.lastHash && <p>Latest transaction confirmed onchain.</p>}
    {wallet.lastHash && <p><a className="text-link" href={explorerTx(wallet.lastHash)} target="_blank" rel="noreferrer">Inspect latest transaction ↗</a></p>}
  </div>;
}
