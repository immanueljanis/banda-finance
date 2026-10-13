# Judge walkthrough

Contracts are live and source-verified on Arc Mainnet (Diamond [`0xeFA0c1B2bc31345d7d795E0786968a607B5C6230`](https://explorer.arc.io/address/0xeFA0c1B2bc31345d7d795E0786968a607B5C6230)). The hosted frontend is pending; until then run it locally with `bun dev`, which reads the mainnet manifest.

1. Open the frontend. Connect MetaMask, Rabby or a supported wallet and approve switching to Arc Mainnet (5042). Native USDC is needed only for gas.
2. Open Portfolio and scroll to Faucet. Claim 1,000 test USDC (limits: one claim per 24 hours, 5,000 per wallet). Confirm the receipt via its explorer link.
3. Pick any of the five Baskets. Enter at least 10 USDC with at most six decimal places; 100 is a convenient example. Review the allocation preview.
4. Approve the exact amount and confirm the deposit. These are separate transactions when allowance is insufficient.
5. Open Portfolio. Inspect the NFT ID, owner, ERC-6551 account, value, token balances and contract links. Independently query each asset token's `balanceOf(account)`.
6. Redeem all. Confirm the receipt. The deposit returns as test USDC, the issued asset tokens are burned and the NFT closes.
7. Record the claim, approval, deposit and redemption hashes, block numbers and explorer links.

## Local validation

Run the contract tests and production build described in the README. `tests/arc.spec.ts` exercises an injected wallet against a local Anvil deployment and checks actual receipts, token balances and the full refund. Its generated `deployments/local-journey.json` is explicitly local-only; the test restores an Anvil snapshot afterward. `playwright.arc.config.ts` also retains the certificate animation check.

The browser suite expects a local node at port 8545 with chain ID 5042, a confirmed `deployments/local-arc.json`, and the frontend at port 3120 built with that local RPC and the local manifest's Diamond and tUSDC addresses. Never use a funded mainnet wallet/provider for the local test fixture.

In separate terminals, from the repository root:

```powershell
# Terminal 1: ephemeral local chain, with no real money or private keys.
anvil --chain-id 5042 --port 8545 --auto-impersonate --silent
# Terminal 2: refuses remote RPCs and non-Anvil nodes.
node scripts/arc-local-setup.mjs
node scripts/arc-local-web.mjs
# Terminal 3: run once development pages have compiled.
bun run test:e2e:arc
```

The setup script refuses to overwrite an existing deployer nonce. Restart with a fresh Anvil instance for a new deployment. Local addresses must never be copied into the mainnet manifest.
