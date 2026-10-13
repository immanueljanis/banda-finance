# Banda Finance — Arc proof of concept

One NFT controls a portfolio account. Banda reuses its EIP-2535 Diamond, ERC-721 ownership and ERC-6551 custody architecture on Arc, with explicitly simulated economic assets.

**Arc Mainnet Proof of Concept. All portfolio assets and valuations are simulated and have no real-world backing or monetary value.**

Mainnet deployment is pending authorization and funding. No live Arc contract or transaction links are claimed. The existing website is not yet verified as this Arc build.

## Implemented scope

NEURAL deposits DemoUSD into an immutable mock router reserve. The router issues six fixed-price demo tokens into the NFT's account. Full redemption burns issued tokens and returns the exact DemoUSD principal. There are no DEX trades, real investments, yield or real-USDC redemptions. The five existing Baskets remain visible; only NEURAL is enabled.

DemoUSD uses six decimals. Native Arc USDC uses eighteen decimals and pays gas only. The six-decimal real-USDC ERC-20 interface represents the same native balance and is never a separate portfolio asset.

## Run

Prerequisites: Node.js, Bun 1.3.3 and Foundry with Solidity 0.8.30 support.

```powershell
bun install --frozen-lockfile
Copy-Item .env.example .env.local
bun dev
```

Without deployed addresses, the interface displays a pending deployment state and disables contract actions. Configure the public RPC and three public contract addresses only after confirmed deployment. Public environment values are embedded at build time. Privy is optional; injected MetaMask/Rabby connections work without its application ID.

```powershell
bun run test:contracts
bun run check
```

`check` executes the retained Node unit tests, non-Robinhood-fork Solidity tests, TypeScript and production build. Legacy fork tests require their original network environment. The dedicated Arc browser suite is `bun run test:e2e:arc`; see the local setup requirements in the demo guide. Existing legacy browser tests are retained but target the previous product.

## Mainnet preparation — no broadcast

From `contracts/`:

```powershell
$env:BANDA_CHAIN_ID="5042"
$env:BANDA_DEPLOYER="0xc924D1236422Ccca9d08e78f059b574f443Ca29d"
forge script script/DeployArc.s.sol:DeployArc --rpc-url https://rpc.mainnet.arc.io --sender $env:BANDA_DEPLOYER --non-interactive
```

From the repository root:

```powershell
node scripts/arc-preflight.mjs contracts/broadcast/DeployArc.s.sol/5042/dry-run/run-latest.json
```

Review chain ID, sender, nonce, native balance, canonical registry/factory bytecode and estimated USDC budget before requesting explicit broadcast authorization. Use a local encrypted keystore or hardware signer; never paste or commit private keys. Only after authorization may the deployment command include `--broadcast` with an appropriate signer. After successful receipts, `scripts/arc-evidence.mjs` records addresses and blocks from confirmed Foundry output. Source verification remains a separate required step. Never promote dry-run or local addresses into the mainnet manifest.

The Arc explorer is Blockscout. The authorized broadcast should include `--verify --verifier blockscout --verifier-url https://explorer.arc.io/api/`. Verification is only successful after every deployed contract reports verified source on the explorer; a submitted request is not enough. The evidence manifest stays `verification: "pending"` until that check is complete.

## Documentation

- [Implementation audit and plan](docs/ARC_IMPLEMENTATION_PLAN.md)
- [Arc migration](docs/ARC_MIGRATION.md)
- [Architecture and accounting](docs/ARCHITECTURE.md)
- [Judge walkthrough](docs/DEMO_GUIDE.md)
- [Security and limitations](docs/SECURITY_AND_LIMITATIONS.md)
- [Submission draft](docs/ARC_MICROGRANTS_SUBMISSION.md)
- [Historical Robinhood documentation](docs/ROBINHOOD_LEGACY_README.md)

This project is unaudited. Diamond upgrades and configuration remain owner-controlled. Local rehearsal evidence is explicitly not mainnet evidence.
