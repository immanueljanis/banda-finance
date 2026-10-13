import Link from "next/link";
import { BASKETS, money } from "@/constants/baskets";
import { AssetLabel, AssetLogo } from "@/components/asset-label";
import { Certificate, Sparkline } from "@/components/certificate";
import { Microtext, Rosette, Seal, WaveBand } from "@/components/guilloche";
import { yieldAssets, yieldWeight } from "@/lib/yields";

const SPECIMEN = BASKETS[0];

export default function Home() {
  return (
    <main id="main">
      <section className="hero-note">
        <Rosette className="hero-rosette" />
        <div className="wrap hero">
          <div className="hero-copy">
            <h1>Composable portfolios onchain. <span>One token, every asset inside.</span></h1>
            <p className="hero-lede">Deposit USDC on Arc, receive a Basket NFT, and see every asset held in its own onchain vault.</p>
            <dl className="hero-engines">
              <div>
                <dt><i className="category-0" aria-hidden="true" />Ownership</dt>
                <dd>An NFT controls a vault holding the Basket&apos;s portfolio tokens.</dd>
              </div>
              <div>
                <dt><i className="category-2" aria-hidden="true" />Allocation</dt>
                <dd>Every deposit is split across the Basket&apos;s assets by fixed weights.</dd>
              </div>
            </dl>
            <div className="hero-actions">
              <Link className="gold-button" href="#baskets">
                Browse Baskets <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link" href="#how-it-works">
                How it works
              </Link>
            </div>
          </div>
          <div className="hero-object">
            <Certificate basket={SPECIMEN} hero />
          </div>
        </div>
        <div className="wrap hero-terms">
          <span>NEURAL proof of concept</span>
          <span>Zero protocol fees</span>
          <span>Your Basket, your vault</span>
          <span>Real USDC for network gas only</span>
        </div>
        <Microtext text="BANDA · COMPOSABLE ETFS ONCHAIN · ONE TOKEN, EVERY ASSET INSIDE" className="hero-microtext" />
      </section>

      <section className="anatomy wrap" aria-labelledby="anatomy-title">
        <div className="anatomy-copy">
          <h2 id="anatomy-title">What your Basket holds.</h2>
          <p>
            Every deposit creates a new NFT and a vault holding simulated assets. Transferring the NFT transfers control of the portfolio.
          </p>
          <dl className="anatomy-sleeves">
            <div>
              <dt><i className="category-0" aria-hidden="true" />Ownership</dt>
              <dd>An NFT controls a vault holding the Basket&apos;s portfolio tokens.</dd>
            </div>
            <div>
              <dt><i className="category-2" aria-hidden="true" />Allocation</dt>
              <dd>Every deposit is split across the Basket&apos;s assets by fixed weights.</dd>
            </div>
            <div>
              <dt><i className="category-1" aria-hidden="true" />Redemption</dt>
              <dd>Redeeming closes the Basket and returns your full deposit.</dd>
            </div>
          </dl>
        </div>
        <figure className="anatomy-diagram" aria-label={`How the ${SPECIMEN.name} Basket is held`}>
          <div className="anatomy-node anatomy-owner">
            <span className="anatomy-role">Your wallet owns</span>
            <strong>Your Basket No. {SPECIMEN.id}</strong>
            <span className="mono">ERC-721</span>
          </div>
          <div className="anatomy-node anatomy-account">
            <span className="anatomy-role">Which has</span>
            <strong>Its own vault</strong>
            <span className="mono">ERC-6551</span>
          </div>
          <ul className="anatomy-holdings">
            {SPECIMEN.holdings.map((holding) => (
              <li key={holding.ticker}>
                <AssetLabel ticker={holding.ticker} compact />
                <span className="mono">{holding.weight}%</span>
              </li>
            ))}
          </ul>
          <figcaption>
            Full redemption returns the deposited demo credits and closes the Basket.
          </figcaption>
        </figure>
      </section>

      <section className="ledger wrap" id="baskets" aria-labelledby="baskets-title">
        <div className="ledger-heading">
          <h2 id="baskets-title">Five themes. Start with NEURAL.</h2>
          <p>NEURAL is implemented for this demo. Other Baskets are previews with deposits disabled.</p>
        </div>
        <ol className="ledger-list">
          {BASKETS.map((basket) => (
            <li className="ledger-row" key={basket.slug}>
              <div className="ledger-name">
                <span className="ledger-serial mono">No. {basket.id}</span>
                <h3>
                  <Link href={`/basket/${basket.slug}`}>{basket.name}</Link>
                </h3>
                <p>{basket.thesis}</p>
              </div>
              <div className="ledger-thesis">
                <strong>{basket.thesis}</strong>
                <span>{basket.character}</span>
                <span className="ledger-logos" aria-label={`Holdings: ${basket.holdings.map((h) => h.ticker).join(", ")}`}>
                  {basket.holdings.map((holding) => (
                    <AssetLogo ticker={holding.ticker} key={holding.ticker} />
                  ))}
                </span>
              </div>
              <div className="ledger-value"><span>{basket.slug === "neural" ? "Fixed simulated prices" : "Catalogue preview only"}</span><strong>{basket.slug === "neural" ? "Demo lifecycle" : "Deposits disabled"}</strong></div>
              <span className="ledger-arrow" aria-hidden="true">→</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="steps-section" id="how-it-works" aria-labelledby="steps-title">
        <div className="wrap">
          <h2 id="steps-title">From deposit to onchain custody.</h2>
          <ol className="steps">
            <li>
              <span className="step-number mono">1</span>
              <h3>Choose a theme</h3>
              <p>Pick one of five themed Baskets.</p>
            </li>
            <li>
              <span className="step-number mono">2</span>
              <h3>Deposit USDC</h3>
              <p>Connect a wallet and deposit at least 10 USDC.</p>
            </li>
            <li>
              <span className="step-number mono">3</span>
              <h3>Hold, send or withdraw</h3>
              <p>Inspect the token bound account and redeem your deposit any time.</p>
            </li>
          </ol>
          <Link className="text-link" href="/docs">
            Read how Banda works <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="terms wrap" id="fees" aria-labelledby="fees-title">
        <div className="terms-copy">
          <Seal className="terms-seal" label="NO ENTRY FEE · NO EXIT FEE" value="0%" />
          <h2 id="fees-title">
            <span>0% to buy.</span> <span>0% to withdraw.</span>
          </h2>
          <p>
            Zero protocol fees. You only pay Arc network gas.
          </p>
          <Link className="text-link" href="/docs">
            Read the details <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="terms-sheet">
          <WaveBand className="terms-wave" />
          <table className="fee-table">
            <caption className="sr-only">Banda fees</caption>
            <tbody>
              <tr><th>Buy</th><td className="mono">0%</td></tr>
              <tr><th>Withdraw</th><td className="mono">0%</td></tr>
              <tr><th>Performance fee</th><td>None</td></tr>
              <tr><th>Yearly fee, every Basket</th><td><span className="mono">0%</span><span className="muted"> a year</span></td></tr>
            </tbody>
          </table>
          <p className="fee-note">
            Your deposit stays reserved for redemption. No investment return or yield is promised.
          </p>
        </div>
      </section>

      <section className="closing-note">
        <Rosette className="closing-rosette" />
        <div className="wrap closing">
          <h2>One token. Every asset inside.</h2>
          <Link className="gold-button" href="#baskets">
            Find your Basket <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
