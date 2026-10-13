"use client";
import { useWallet } from "./wallet";
import { WaveBand } from "./guilloche";
import { DEPLOYED } from "@/lib/chain/arc";
import { DemoStatus } from "./demo-status";

export function MintPanel() {
  const wallet = useWallet();
  return (
    <div className="buy-panel mint-panel">
      <WaveBand className="terms-wave" />
      <span className="certificate-kind">Valueless demo credits</span>
      <h2>Get DemoUSD to try Banda</h2>
      <p>Claim 1,000 DemoUSD every 24 hours, up to 5,000 total per wallet. DemoUSD has no monetary value or redemption rights for real USDC.</p>
      <ol className="mint-steps"><li>Connect MetaMask, Rabby or a supported wallet.</li><li>Switch to Arc Mainnet when prompted.</li><li>Claim demo credits. Real USDC is used only for network gas.</li></ol>
      <p>
        {wallet.connected ? (
          <>Your balance: <span className="mono">{wallet.balanceLabel} DemoUSD</span></>
        ) : (
          <button type="button" className="text-link" onClick={wallet.connect}>Connect wallet</button>
        )}
      </p>
      <button className="primary-button" disabled={!DEPLOYED || wallet.transactionStatus !== "idle"} onClick={()=>{if(!wallet.connected){wallet.connect();return;}void wallet.claim().catch(()=>{});}}>Claim DemoUSD</button>
      <DemoStatus />
    </div>
  );
}
