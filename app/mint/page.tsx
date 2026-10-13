import type { Metadata } from "next";
import { Rosette } from "@/components/guilloche";
import { MintPanel } from "@/components/mint-panel";

export const metadata: Metadata = {
  title: "Banda | Get DemoUSD",
  robots: { index: false, follow: false },
};

export default function Mint() {
  return (
    <main id="main">
      <section className="detail-note">
        <Rosette className="hero-rosette" />
        <div className="wrap detail-hero">
          <h1>Get DemoUSD.</h1>
          <p>Limited demo credits for exploring Banda on Arc. They cannot be exchanged for real USDC.</p>
        </div>
      </section>
      <div className="wrap mint">
        <MintPanel />
      </div>
    </main>
  );
}
