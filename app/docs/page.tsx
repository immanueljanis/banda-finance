import Link from "next/link";
import { Rosette } from "@/components/guilloche";

export default function Docs() {
  return (
    <main id="main">
      <section className="detail-note">
        <Rosette className="hero-rosette" />
        <div className="wrap detail-hero">
          <Link className="breadcrumb" href="/">
            ← Back to Banda
          </Link>
          <h1>How Banda works.</h1>
          <p>Real onchain portfolio ownership and custody on Arc, using valueless simulated assets. This proof of concept is not an investment product.</p>
        </div>
      </section>
      <div className="docs wrap">
        <section>
          <h2>What you own</h2>
          <p>A Basket is a transferable ERC-721 NFT controlling its own ERC-6551 account. The vault holds actual ERC-20 demo token balances. Transferring the NFT transfers control of the portfolio. No token represents a backed security or commodity.</p>
        </section>
        <section>
          <h2>Signing in</h2>
          <p>Connect MetaMask, Rabby or a configured Privy wallet. The NFT owner or an approved operator may redeem through the Diamond; payment always goes to the current NFT owner. Arbitrary vault withdrawals are disabled.</p>
        </section>
        <section>
          <h2>The five Baskets</h2>
          <p>NEURAL, RAILS, RESERVE, FRONTIER and FORTRESS each have their own onchain router and fixed weights. Every one accepts deposits.</p>
        </section>
        <section>
          <h2>Depositing and redeeming</h2>
          <p>Claim test USDC from the faucet on the Portfolio page, approve an exact deposit amount, then deposit at least 10 USDC. Each deposit creates a separate NFT. Full redemption burns the issued mock holdings and NFT, returning the exact deposit. Partial redemption is disabled. Pausing deposits does not block redemption.</p>
        </section>
        <section>
          <h2>Prices</h2>
          <p>Each router uses fixed per-token prices in USDC (for example mNVDA 100, mGLD 250, mBTC 60,000, mCASH 1). They are accounting inputs, not market feeds; no yield or price appreciation is applied.</p>
        </section>
        <section>
          <h2>Curation and risks</h2>
          <p>The Diamond owner can upgrade facets, pause deposits and change NAV guard configuration. This is an unaudited prototype without a verified multisig or timelock. Do not send valuable assets into Basket accounts. Unrelated tokens can become stranded when the NFT is burned.</p>
        </section>
        <section>
          <h2>Fees</h2>
          <p>Zero annual, deposit and redemption protocol fees. Arc network transactions require real USDC for gas. Test USDC (tUSDC) is a separate ERC-20 from the faucet and does not redeem for real USDC.</p>
        </section>
        <section>
          <h2>About the figures</h2>
          <p>Basket value is the recorded refundable principal. The router retains deposits as reserves and issues fixed-price mock holdings to each account. Donations do not increase redemption rights. The illustrative certificate is not evidence of a funded position.</p>
        </section>
        <section>
          <h2>For developers</h2>
          <p>The existing EIP-2535 Diamond storage and deposit/redemption facets are reused. A registry adapter connects the legacy deposit ABI to the standard ERC-6551 singleton. Token binding is immutable in proxy bytecode; no account initializer can be hijacked.</p>
          <p>All live balances come from onchain reads. Transaction success requires a successful receipt. The application fails closed until Arc addresses are configured. Deployment and explorer verification remain pending until receipts and verification evidence are recorded.</p>
        </section>
      </div>
    </main>
  );
}
