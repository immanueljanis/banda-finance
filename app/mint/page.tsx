import type { Metadata } from "next";
import { Rosette } from "@/components/guilloche";
import { MintPanel } from "@/components/mint-panel";

export const metadata: Metadata = {
  title: "Banda | Get test USDC",
  robots: { index: false, follow: false },
};

export default function Mint() {
  return (
    <main id="main">
      <section className="detail-note">
        <Rosette className="hero-rosette" />
        <div className="wrap detail-hero">
          <h1>Get test USDC.</h1>
          <p>Banda on Arc Mainnet settles in test USDC. Get free test USDC to try buying and withdrawing. It has no real value.</p>
        </div>
      </section>
      <div className="wrap mint">
        <MintPanel />
      </div>
    </main>
  );
}
