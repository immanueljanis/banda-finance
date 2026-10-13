# Judge walkthrough

Status: mainnet deployment and a hosted Arc demo are pending. Do not treat the existing public Banda website or local rehearsal as a verified Arc deployment. Use this walkthrough only after `deployments/arc-mainnet.json` contains confirmed addresses and source-verification results.

1. Open the deployed frontend and read the persistent simulation disclosure.
2. Connect MetaMask, Rabby or a supported wallet. Approve switching to Arc Mainnet (5042). Native USDC is required only for gas.
3. Open Demo faucet. Claim 1,000 DemoUSD. Confirm the receipt and inspect its explorer link. Credits have no monetary value; limits are 24 hours between claims and 5,000 per wallet lifetime.
4. Select NEURAL. The other four catalogue entries are visible but unsupported. Enter at least 10 DemoUSD with at most six decimal places; 100 is a convenient example.
5. Review the fixed allocation. Approve the exact DemoUSD amount and confirm deposit. These are separate transactions when allowance is insufficient.
6. Open Portfolio. Inspect the NFT ID, owner, ERC-6551 account, fixed principal NAV, underlying quantities and contract links. Independently query the underlying ERC-20 `balanceOf(account)` values.
7. Redeem all. Confirm the receipt. The original principal returns as DemoUSD; issued underlying balances are burned and the NFT closes. No real USDC is paid out.
8. Record actual claim, approval, deposit and redemption hashes, block numbers and explorer links. Confirm successful receipts before describing the demonstration as complete.

## Local validation

Run the contract tests and production build described in the README. `tests/arc.spec.ts` exercises an injected wallet against a local Anvil deployment and checks actual receipts, token balances and the full refund. Its generated `deployments/local-journey.json` is explicitly local-only; the test restores an Anvil snapshot afterward. `playwright.arc.config.ts` also retains the certificate animation check.

The browser suite expects a local node at port 8545 with chain ID 5042, a confirmed `deployments/local-arc.json`, and the frontend at port 3120 built with that local RPC and manifest's three public addresses. Never use a funded mainnet wallet/provider for the local test fixture.

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
