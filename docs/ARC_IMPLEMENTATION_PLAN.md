# Arc implementation plan

## Audited baseline (2026-10-13)

The requested workspace was empty. Source was cloned locally from `../banda`,
commit `c505a10b9b6fd76035a5a9c94a3a84f63459e12b`, preserving its history and
leaving the source checkout (including its modified research evidence) untouched.

| Area | Actual implementation | Migration / complexity |
| --- | --- | --- |
| App | Next.js 15, React 19, viem, Privy, Bun; existing visual system | Reuse shell/styles/catalogue; replace economic UI paths, medium |
| Diamond | Cut/loupe/ownership and lifecycle facets; namespaced storage | Reuse layout and owner-only upgrades unchanged, low |
| NFT | Transferable ERC-721 surface, approvals, one NFT per deposit, burn on full redemption | Preserve permissions; add ERC-165 discovery, low |
| Custody | `BasketAccount.sol` is a controller-only fixture; `Mock6551Registry.sol` ignores implementation/chain and uses CREATE | Add real ERC-6551 proxy registry compatibility and restricted account, high |
| Deposit | `DepositFacet.sol` pulls exact settlement, binds account, calls strategy; lifecycle lock | Reuse existing ABI and storage, low |
| Redemption | `RedeemFacet.sol` moves account holdings, invokes strategy, pays current NFT owner, accrues configured fees | Reuse with zero fees and full-only demo strategy, medium |
| Strategy | `gateway/BasketStrategy.sol` uses pool buy/sell; sweeping strategy balances is unsuitable for isolated demo reserves | New isolated fixed-price mock router implementing existing interfaces, high |
| Mocks | Public-mint USDG, mutable NAV and fixture registry exist | Never deploy those as Arc demo dependencies; restricted demo assets/faucet, medium |
| NAV | Freshness/block guards, offchain signed-in preparation, mutable market prices | Reuse guard with explicit immutable principal quote adapter; no market/yield dependency, medium |
| Network | `lib/chain/config.ts`, wallet, readers, scripts hardcode Robinhood 46630 and USDG; multicall assumed | Arc-specific addresses/config, fail closed before deployment, medium |
| Tests | Foundry unit suites and Robinhood fork suites; Node validation and Playwright | Retain baseline; add Arc lifecycle/accounting and frontend tests, high |
| Deployment | Robinhood Foundry scripts, mock registry deployments, market updater | Reuse facet selector wiring; Arc/local deploy and read-only preflight, medium |

No existing behavior is considered tested until executed here. Existing hosted
site and DoraHacks page could not be fetched with the research tool. Program
deadline/eligibility remain user-provided, not independently verified.

## Scope and accounting

- Preserve Diamond storage, upgrade ownership, NFT transfers and deposit-per-NFT model.
- Preserve NEURAL weights: NVDA 30%, TAO 20%, GOOGL 15%, NEAR 10%, GLD 10%,
  cash sleeve 15%. All six issued assets are explicitly simulated, including a
  mock cash asset; they are not real securities, yield products or USDC.
- DemoUSD uses 6 decimals. Faucet grants 1,000 credits/day, maximum 5,000 lifetime
  per wallet. No unrestricted mint entrypoint or owner withdrawal of reserves.
- Router retains all deposited DemoUSD, records per-account principal and exact
  issued quantities. Full redemption burns only recorded quantities and returns
  exactly principal. Donations cannot increase payouts. Prices/weights immutable;
  no yield or mark-to-market liabilities. Shares are demo credit base units.
- Mock tokens use 18 decimals; allocation floors all but final sleeve, which gets
  remaining credit units. Require each leg nonzero. Minimum 10 DemoUSD.
- Bridge the old registry ABI through an adapter to the ERC-6551 standard registry.
  Verify canonical registry bytecode before mainnet deployment; do not assume it.
  Accounts keep Diamond-only execution; holders cannot drain custody independently.
- Unsupported basket actions disabled; no valuable-token purchase path.

## Implementation sequence and acceptance

1. **P0 contracts:** isolated demo tokens/router/fixed quote, standard account and
   registry adapter, deployment selector reuse. Acceptance: deterministic accounts,
   correct owner after transfer, real holdings, exact full refund, reserve isolation,
   zero/invalid/repeated/unauthorized operations and precision tests pass.
2. **P0 frontend:** preserve branding/navigation and five baskets; connect/switch Arc,
   faucet, NEURAL approval/deposit, chain-read dashboard, full redemption. Acceptance:
   receipt status checked, errors visible, no hardcoded portfolio state, demo
   disclosure on every relevant screen; unavailable deployment fails closed.
3. **P0 verification:** execute unit/integration, type checks, production build and
   shared `verify.mjs --run`. Fix failures without weakening baseline assertions.
4. **P1 deployment readiness:** local rehearsal; separate chain manifests; preflight
   chain ID, registry code, deployer, balance, simulation, gas/cost. Present concrete
   plan and request explicit mainnet-spend authorization only after preparation.
5. **P1 documents:** migration, architecture, limitations, judge walkthrough and
   submission with only observed facts. Address/transaction fields stay pending
   until receipts exist. Hosting/publication and verification are not assumed.

## Risks / completion gates

The legacy registry is not adequate ERC-6551 evidence; the migration must address
this before deployment. Owner upgrades remain a trust boundary. Faucet limits are
per wallet, not Sybil resistance. Mainnet RPC reachability, deployer funding,
broadcast authorization, explorer verification and hosting/public repository
availability are completion gates. No mainnet transaction is authorized yet.

Official network source: https://docs.arc.io/arc/references/connect-to-arc
USDC interfaces: https://docs.arc.io/arc/references/contract-addresses
Account specification: https://eips.ethereum.org/EIPS/eip-6551
