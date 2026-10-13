# Robinhood to Arc migration

See [implementation audit](ARC_IMPLEMENTATION_PLAN.md) and [architecture](ARCHITECTURE.md). This is a continuation of Banda, not a replacement protocol.

## Reused

Existing Diamond storage, upgrade ownership, ERC-721 transfers/approvals, deposit and full-redemption facets, NAV guards, Next.js pages, catalogue, certificate animation and optional Privy integration remain. Existing contract and market unit tests remain available.

## Changed

- `lib/chain/arc.ts`: Arc Mainnet 5042, native USDC with 18 decimals, explicit conversion helpers and deployment manifest. No assumed multicall deployment.
- `contracts/src/banda/demo/`: isolated six-decimal DemoUSD faucet, restricted mock tokens, fixed allocation router and fixed principal NAV adapter.
- `contracts/src/banda/accounts/`: standard registry compatibility and NFT-controlled account; the old mock registry is not used on mainnet.
- `contracts/script/DeployArc.s.sol`: explicit chain checks, canonical registry bytecode validation, nine-facet deployment and zero-fee NEURAL configuration. Storage layout is unchanged. Rebalance selectors are excluded.
- `components/wallet.tsx`, `lib/chain/demo.ts`: wallet simulation, exact approval, receipt confirmation, real account balances and full redemption.
- Relevant pages disclose simulated assets. Four unsupported Baskets remain visible with disabled deposit actions. Legacy market, yield and NAV preparation APIs return HTTP 410.
- `deployments/` separates pending mainnet/testnet manifests from local-only rehearsal evidence. Dry-run addresses are not live contract addresses.

## Official references

[Arc connection settings](https://docs.arc.io/arc/references/connect-to-arc), [Arc contract addresses](https://docs.arc.io/arc/references/contract-addresses), and [ERC-6551](https://eips.ethereum.org/EIPS/eip-6551).

The canonical ERC-6551 registry was absent at the recorded preflight block. The deterministic deployment factory was present and matched the reference bytecode. Deployment installs the published singleton if still absent and checks its runtime hash. Never assume another network's deployment exists on Arc.

## Deployment status

Mainnet deployment is pending explicit authorization and funding. A read-only simulation completed with 19 transactions and 20,936,840 estimated gas. The recorded two-times-gas-price budget was approximately 0.84 native USDC; this is an estimate, not a fixed fee. The proposed deployer/owner is `0xc924D1236422Ccca9d08e78f059b574f443Ca29d`; its balance was zero at preflight. Repeat preflight before broadcasting.

The Arc explorer identifies itself as Blockscout. When broadcast is authorized, Foundry should use `--verify --verifier blockscout --verifier-url https://explorer.arc.io/api/`. Verification state must be checked on each resulting address and recorded after confirmation; it cannot be inferred from the broadcast exit code.

Local Anvil transactions are genuine local execution, but are not Arc Mainnet evidence. Explorer source verification, public application deployment and a mainnet user journey remain pending.
