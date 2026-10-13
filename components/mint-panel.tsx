"use client";
import { useWallet } from "./wallet";
import { DEPLOYED } from "@/lib/chain/arc";
import { Usdc } from "./demo-status";

export function MintPanel() {
  const wallet = useWallet();
  return (
    <section className="arc-position" id="faucet">
      <h2>Faucet</h2>
      <p>Claim 1,000 test USDC every 24 hours, up to 5,000 per wallet. Real USDC is used only for Arc network gas.</p>
      {wallet.connected && <p>Balance: <span className="mono">{wallet.balanceLabel}</span> <Usdc /></p>}
      <button className="primary-button" disabled={!DEPLOYED || wallet.transactionStatus !== "idle"} onClick={()=>{if(!wallet.connected){wallet.connect();return;}void wallet.claim().catch(()=>{});}}>Claim test USDC</button>
    </section>
  );
}
