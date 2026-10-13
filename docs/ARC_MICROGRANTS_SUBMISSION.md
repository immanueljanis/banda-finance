# Banda Finance — submission draft

**Tagline:** One NFT, a composable onchain portfolio.

**Problem:** Multi-asset positions are fragmented across tokens and applications. Ownership, custody and portfolio accounting are difficult to inspect as one unit.

**Solution:** Banda connects an ERC-721 Basket to its own ERC-6551 account. The Arc proof of concept demonstrates actual ownership, custody, deterministic allocation and redemption with explicitly simulated economic assets.

**Technical architecture:** Existing EIP-2535 Diamond facets manage NFT ownership and deposit/redemption. A restricted mock router issues six synthetic NEURAL legs to each account. DemoUSD reserves cover fixed principal refunds. The existing Next.js interface displays actual RPC balances and transaction receipts.

**Why Arc:** Arc provides EVM execution and USDC-denominated gas. The demo keeps native gas accounting separate from valueless DemoUSD settlement while demonstrating composable portfolio custody.

**Implemented:** Arc configuration, deployable contracts, limited faucet, one six-leg Basket, deterministic custody, full redemption, wallet integration and automated contract tests. Mainnet simulation and local deployment rehearsal have run. Live mainnet functionality is not yet claimed.

**Live demo:** Pending verified Arc deployment and hosting. Existing project website: https://www.bandafinance.xyz/ (not yet verified as the Arc demo).

**Repository:** https://github.com/immanueljanis/banda-finance — created private at the owner's request. Upload of Arc changes is pending. Public-repository eligibility is not yet met; changing visibility requires the owner's authorization. Original project: https://github.com/immanueljanis/banda.

**Verified contract addresses:** Pending; no mainnet deployment claims.

**Transaction evidence:** Mainnet evidence pending. Local rehearsal artifacts are development evidence only.

**Limitations:** All assets and valuations are simulated, unbacked and without monetary value. No real investments, liquidity, yields or real-USDC redemption. Unaudited; the Diamond owner retains upgrade/configuration powers. Acceptance of simulated assets by the program is not guaranteed.

**Future opportunities:** Additional curated Baskets, event indexing, richer account interoperability, external security review and carefully scoped integrations with real assets after appropriate technical and legal work.

Before submission, replace pending fields with verified links, attach a successful mainnet full-redemption journey and confirm current program terms/deadline on the official hackathon page.
