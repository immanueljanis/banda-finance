"use client";
import { useWallet } from "./wallet";
import { WaveBand } from "./guilloche";

export function MintPanel() {
  const wallet = useWallet();
  return (
    <div className="buy-panel mint-panel">
      <WaveBand className="terms-wave" />
      <span className="certificate-kind">Free test USDC</span>
      <h2>Get USDC to try Banda</h2>
      <p>The faucet sends 1,000 test USDC per wallet each day, up to 5,000 in total, enough for several Baskets. It has no real value.</p>
      <ol className="mint-steps">
        <li>Copy your wallet address{wallet.address ? <>: <span className="mono">{wallet.address}</span></> : " after you connect."}</li>
        <li>Claim test USDC below. Your wallet switches to Arc Mainnet if needed.</li>
        <li>Network fees on Arc are paid in USDC, so keep a little real USDC in your wallet.</li>
      </ol>
      <p>
        {wallet.connected ? (
          <>Your balance: <span className="mono">{wallet.balanceLabel} USDC</span></>
        ) : (
          <button type="button" className="text-link" onClick={wallet.connect}>Connect wallet</button>
        )}
      </p>
      <button type="button" className="primary-button" disabled={wallet.transactionStatus !== "idle"} onClick={() => { if (!wallet.connected) { wallet.connect(); return; } void wallet.claim().catch(() => undefined); }}>
        {wallet.transactionStatus === "signing" ? "Approve in your wallet…" : wallet.transactionStatus === "confirming" ? "Confirming…" : "Claim 1,000 test USDC"}
      </button>
    </div>
  );
}
