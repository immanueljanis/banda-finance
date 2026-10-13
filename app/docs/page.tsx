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
          <h2>The five demo Baskets</h2>
          <p>NEURAL follows an AI theme and is the supported demo. RAILS, RESERVE, FRONTIER and FORTRESS remain catalogue previews with deposits disabled. All displayed exposures are simulated.</p>
        </section>
        <section>
          <h2>Depositing and redeeming</h2>
          <p>Claim limited DemoUSD, approve an exact deposit amount, then deposit at least 10 credits. Each deposit creates a separate NFT. Full redemption burns the issued mock holdings and NFT, returning the exact deposited DemoUSD. Partial redemption is disabled. Pausing deposits does not block redemption.</p>
        </section>
        <section>
          <h2>Prices</h2>
          <p>Prices are fixed demo parameters: mNVDA 100, mTAO 200, mGOOGL 150, mNEAR 5, mGLD 250 and mCASH 1 DemoUSD per token. These are synthetic accounting inputs, not market feeds. No yield or price appreciation is simulated.</p>
        </section>
        <section>
          <h2>Curation and risks</h2>
          <p>The Diamond owner can upgrade facets, pause deposits and change NAV guard configuration. This is an unaudited prototype without a verified multisig or timelock. Do not send valuable assets into Basket accounts. Unrelated tokens can become stranded when the NFT is burned.</p>
        </section>
        <section>
          <h2>Fees</h2>
          <p>The demo has zero annual, deposit and redemption protocol fees. Arc network transactions require real USDC for gas. DemoUSD is a separate valueless ERC-20 and can never redeem for real USDC.</p>
        </section>
        <section>
          <h2>About the figures</h2>
          <p>Simulated NAV is the recorded refundable DemoUSD principal. The router retains those demo credits as reserves and issues fixed-price mock holdings to each account. Donations do not increase redemption rights. The illustrative certificate is not evidence of a funded position.</p>
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
