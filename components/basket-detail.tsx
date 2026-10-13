"use client";
import { useState } from "react";
import Link from "next/link";
import { BASKETS, type Basket } from "@/constants/baskets";
import { useWallet } from "./wallet";
import { NavNumber } from "./certificate";
import { Rosette, WaveBand } from "./guilloche";
import { DemoAllocation } from "./demo-allocation";
import { DemoStatus, Usdc } from "./demo-status";
import { DEPLOYED } from "@/lib/chain/arc";
import { STRATEGY_IDS } from "@/lib/chain/config";
export function BasketDetail({ basket }: { basket: Basket }) {
  const wallet = useWallet();
  const [amount, setAmount] = useState("100");
  const value = Number(amount);
  const valid = DEPLOYED && /^\d+(\.\d{1,6})?$/.test(amount) && value >= 10 && value <= wallet.balance;
  const strategyId = STRATEGY_IDS[BASKETS.findIndex((entry) => entry.slug === basket.slug)];
  const warm = () => { if (wallet.connected) wallet.warmUp(strategyId); };
  return (
    <main id="main">
      <section className="detail-note">
        <Rosette className="hero-rosette" />
        <div className="wrap detail-hero">
          <Link className="breadcrumb" href="/#baskets">
            ← All Baskets
          </Link>
          <div className="detail-intro">
            <div>
              <span className="certificate-serial mono">No. {basket.id}</span>
              <h1>{basket.name}</h1>
              <p className="detail-thesis">{basket.thesis} · {basket.character}</p>
            </div>
            <div className="detail-value"><span>Full redemption returns your whole deposit.</span></div>
          </div>
        </div>
      </section>
      <div className="detail wrap">
      <div className="detail-layout">
        <div className="detail-content">
          <DemoAllocation basket={basket} amount={amount} />
        </div>
        <form
          className="buy-panel"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!wallet.connected) {
              wallet.connect();
              return;
            }
            if (valid) {
              await wallet.deposit(strategyId, amount).catch(() => undefined);
            }
          }}
        >
          <WaveBand className="terms-wave" />
          <span className="certificate-kind">Deposit</span>
          <h2>Create {basket.name}</h2>
          <p>Each deposit creates a new Basket NFT with its own vault. Minimum 10 USDC.</p>
          <label htmlFor="amount">Amount in USDC</label>
          <input
            id="amount"
            inputMode="decimal"
            type="number"
            min="10"
            step="any"
            value={amount}
            onFocus={warm}
            onChange={(e) => {
              warm();
              setAmount(e.target.value);
            }}
            required
          />
          <div className="quick-chips">
            {[50, 500].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => {
                  warm();
                  setAmount(String(n));
                }}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(String(wallet.balance))}
            >
              Max
            </button>
          </div>
          <p>
            Available balance:{" "}
            <span className="mono">{wallet.balanceLabel}</span> <Usdc />
          </p>
          <div className="buy-preview">
            You create <span className="mono">1</span> Basket with{" "}
            <span className="mono">
              {Number.isFinite(value) && value > 0 ? value : 0}
            </span>{" "}<Usdc />{" "}
            in {basket.name}.
          </div>
          <div className="fee-line">
            <span>Fee to buy</span>
            <span className="mono">0%</span>
          </div>
          <div className="fee-line">
            <span>Yearly fee</span>
            <span className="mono">0%</span>
          </div>
          <p>
            No annual, deposit or redemption fee. Real USDC is required for Arc network gas only.
          </p>
          <button
            className="primary-button"
            type="submit"
            disabled={!DEPLOYED || wallet.connected && (!valid || wallet.transactionStatus === "preparing" || wallet.transactionStatus === "signing" || wallet.transactionStatus === "confirming")}
          >
            {!wallet.connected
              ? "Connect wallet"
              : wallet.transactionStatus === "preparing"
                ? "Checking…"
              : wallet.transactionStatus === "signing"
                ? "Approve in your wallet…"
                : wallet.transactionStatus === "confirming"
                  ? "Confirming…"
                  : "Deposit USDC"}{" "}
            <span aria-hidden="true">→</span>
          </button>
          {wallet.connected && value > wallet.balance && (
            <p role="alert">That is more than your available balance.</p>
          )}
          <Link className="text-link" href="/portfolio#faucet">Get test USDC</Link><Link className="text-link" href="/portfolio">Inspect portfolio</Link><DemoStatus />
        </form>
      </div>
      </div>
    </main>
  );
}
