# Robinhood to Arc migration

See [implementation audit](ARC_IMPLEMENTATION_PLAN.md) and [architecture](ARCHITECTURE.md). This is a continuation of Banda, not a replacement protocol.

## Reused

Existing Diamond storage, upgrade ownership, ERC-721 transfers/approvals, deposit and full-redemption facets, NAV guards, Next.js pages, catalogue, certificate animation and optional Privy integration remain. Existing contract and market unit tests remain available.

## Changed

- `lib/chain/arc.ts`: Arc Mainnet 5042, native USDC with 18 decimals, explicit conversion helpers and deployment manifest. No assumed multicall deployment.
- `contracts/src/banda/demo/`: isolated six-decimal tUSDC faucet, restricted test asset tokens, a fixed-allocation router per Basket and a fixed principal NAV adapter.
- `contracts/src/banda/accounts/`: standard registry compatibility and NFT-controlled account; the old mock registry is not used on mainnet.
- `contracts/script/DeployArc.s.sol`: explicit chain checks, canonical registry bytecode validation, nine-facet deployment and five zero-fee strategies (one router per Basket). Storage layout is unchanged. Rebalance selectors are excluded.
- `components/wallet.tsx`, `lib/chain/demo.ts`: wallet simulation, exact approval, receipt confirmation, real account balances and full redemption.
- All five Baskets accept deposits. Settlement is labelled USDC with a "test" badge. Legacy market, yield and NAV preparation APIs return HTTP 410.
- `deployments/` separates the mainnet manifest (from confirmed receipts) from local-only rehearsal evidence. Dry-run addresses are not live contract addresses.

## Official references

[Arc connection settings](https://docs.arc.io/arc/references/connect-to-arc), [Arc contract addresses](https://docs.arc.io/arc/references/contract-addresses), and [ERC-6551](https://eips.ethereum.org/EIPS/eip-6551).

The canonical ERC-6551 registry was absent at the recorded preflight block. The deterministic deployment factory was present and matched the reference bytecode. Deployment installs the published singleton if still absent and checks its runtime hash. Never assume another network's deployment exists on Arc.

## Deployment status

Deployed to Arc Mainnet on 2026-10-13 from block 25785669: 27 confirmed transactions, 35,850,597 gas, 0.717 native USDC. Owner: `0xc924D1236422Ccca9d08e78f059b574f443Ca29d`. The deployment installed the canonical ERC-6551 registry singleton, whose runtime hash was checked.

All 52 contracts (deployment contracts, router-issued asset tokens and the registry) are verified on Sourcify with exact creation and runtime matches, and the Arc explorer shows them as verified. The explorer API sits behind a Cloudflare challenge, so verify through `--verifier sourcify`. Addresses are in the README and `deployments/arc-mainnet.json`.

Local Anvil transactions are genuine local execution, but are not Arc Mainnet evidence. Public application hosting and a recorded mainnet user journey remain pending.
