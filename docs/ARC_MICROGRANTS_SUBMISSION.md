# Banda Finance — submission draft

**Tagline:** One NFT, a composable onchain portfolio.

**Problem:** Multi-asset positions are fragmented across tokens and applications. Ownership, custody and portfolio accounting are difficult to inspect as one unit.

**Solution:** Banda connects an ERC-721 Basket to its own ERC-6551 account. One deposit buys a themed portfolio; the NFT owns the account that holds every asset, and transferring the NFT transfers the whole portfolio.

**Technical architecture:** EIP-2535 Diamond facets manage NFT ownership, deposits and redemption. Each of the five Baskets has its own router that keeps the deposit in reserve and issues the Basket's asset tokens into the NFT's ERC-6551 account. A Next.js interface shows live RPC balances and confirmed transaction receipts.

**Why Arc:** Arc provides EVM execution with USDC-denominated gas, so a USDC-settled portfolio product pays fees in the same unit it is priced in.

**Implemented:** Five live Baskets on Arc Mainnet (NEURAL, RAILS, RESERVE, FRONTIER, FORTRESS), test USDC faucet, deterministic ERC-6551 custody, full redemption, wallet integration, contract tests and a local end-to-end browser journey.

**Live demo:** Pending hosting.

**Repository:** https://github.com/immanueljanis/banda-finance — Arc changes uploaded. The repository is currently private; it must be made public to meet eligibility. Original project: https://github.com/immanueljanis/banda.

**Verified contract addresses:** Diamond [`0xeFA0c1B2bc31345d7d795E0786968a607B5C6230`](https://explorer.arc.io/address/0xeFA0c1B2bc31345d7d795E0786968a607B5C6230). All 52 contracts are source-verified (Sourcify exact match, shown as verified on the Arc explorer); the full list is in the README.

**Transaction evidence:** Deployment: 27 confirmed transactions from block 25785669 (`deployments/arc-mainnet.json`). Mainnet user journey (faucet, deposit, redeem): pending.

**Limitations:** Settlement uses test USDC and test asset tokens with fixed prices; there are no real investments, liquidity, yield or redemption into real USDC yet. Unaudited; the Diamond owner retains upgrade and configuration powers.

**Future opportunities:** Real USDC settlement and real asset routing on Arc, event indexing, richer account interoperability and an external security review.

Before submission: add the hosted demo link, record the mainnet journey hashes, make the repository public and confirm current program terms and deadline on the official hackathon page.
