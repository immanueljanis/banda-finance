# Banda Finance on Arc

One NFT controls a portfolio account. Banda reuses its EIP-2535 Diamond, ERC-721 ownership and ERC-6551 custody architecture on Arc, with five onchain Baskets live on Arc Mainnet.

Contracts are deployed and source-verified on Arc Mainnet; see [Arc Mainnet deployment](#arc-mainnet-deployment). Diamond: [`0xeFA0c1B2bc31345d7d795E0786968a607B5C6230`](https://explorer.arc.io/address/0xeFA0c1B2bc31345d7d795E0786968a607B5C6230). Live app: https://banda-arc.vercel.app.

## Implemented scope

All five Baskets (NEURAL, RAILS, RESERVE, FRONTIER, FORTRESS) accept deposits of test USDC (tUSDC). Each Basket has its own immutable router that keeps the deposit in reserve and issues fixed-price asset tokens into the NFT's ERC-6551 account. Full redemption burns the issued tokens and returns the exact principal. There are no DEX trades, yield or redemptions into real USDC yet; the asset tokens and tUSDC are test tokens without monetary value.

tUSDC uses six decimals and comes from a limited faucet (1,000 per 24 hours, 5,000 per wallet). Native Arc USDC uses eighteen decimals and pays gas only. The six-decimal real-USDC ERC-20 interface represents the same native balance and is never a separate portfolio asset.

## Run

Prerequisites: Node.js, Bun 1.3.3 and Foundry with Solidity 0.8.30 support.

```powershell
bun install --frozen-lockfile
Copy-Item .env.example .env.local
bun dev
```

The interface reads contract addresses from `deployments/arc-mainnet.json`; `NEXT_PUBLIC_ARC_DIAMOND` and `NEXT_PUBLIC_ARC_DEMO_USD` override them (the local rehearsal uses this). Basket routers are resolved from the Diamond. Public environment values are embedded at build time. Privy is optional; injected MetaMask/Rabby connections work without its application ID.

```powershell
bun run test:contracts
bun run check
```

`check` executes the retained Node unit tests, non-Robinhood-fork Solidity tests, TypeScript and production build. Legacy fork tests require their original network environment. The dedicated Arc browser suite is `bun run test:e2e:arc`; see the local setup requirements in the demo guide. Existing legacy browser tests are retained but target the previous product.

## Arc Mainnet deployment

Deployed 2026-10-13 on Arc Mainnet (chain ID 5042) from block 25785669, in 27 confirmed transactions (full list in [`deployments/arc-mainnet.json`](deployments/arc-mainnet.json)). Diamond owner: `0xc924D1236422Ccca9d08e78f059b574f443Ca29d`.

Every contract below is source-verified on [Sourcify](https://sourcify.dev) with an exact match (creation and runtime bytecode).

| Contract | Address | Verified |
| --- | --- | --- |
| Diamond (Basket NFT + entrypoint) | [`0xeFA0c1B2bc31345d7d795E0786968a607B5C6230`](https://explorer.arc.io/address/0xeFA0c1B2bc31345d7d795E0786968a607B5C6230) | [source](https://repo.sourcify.dev/5042/0xeFA0c1B2bc31345d7d795E0786968a607B5C6230) |
| Test USDC (tUSDC) faucet token | [`0xD387AD52d5e5AB43d32975853A6A53EE2cd00328`](https://explorer.arc.io/address/0xD387AD52d5e5AB43d32975853A6A53EE2cd00328) | [source](https://repo.sourcify.dev/5042/0xD387AD52d5e5AB43d32975853A6A53EE2cd00328) |
| ERC-6551 registry (canonical singleton) | [`0x000000006551c19487814612e58FE06813775758`](https://explorer.arc.io/address/0x000000006551c19487814612e58FE06813775758) | [source](https://repo.sourcify.dev/5042/0x000000006551c19487814612e58FE06813775758) |
| Registry adapter | [`0x287443027C8B97e29408E6395993333bf9b369f5`](https://explorer.arc.io/address/0x287443027C8B97e29408E6395993333bf9b369f5) | [source](https://repo.sourcify.dev/5042/0x287443027C8B97e29408E6395993333bf9b369f5) |
| Basket account implementation | [`0x6a06BE1e2af61811fc1323f027946A09EDf9BeD1`](https://explorer.arc.io/address/0x6a06BE1e2af61811fc1323f027946A09EDf9BeD1) | [source](https://repo.sourcify.dev/5042/0x6a06BE1e2af61811fc1323f027946A09EDf9BeD1) |
| NAV adapter | [`0x9BF5D894De00274a0997E7d867611adf7cD851CA`](https://explorer.arc.io/address/0x9BF5D894De00274a0997E7d867611adf7cD851CA) | [source](https://repo.sourcify.dev/5042/0x9BF5D894De00274a0997E7d867611adf7cD851CA) |
| BandaInit | [`0x8642f95eD9785afCD0C9F822fC91897E661E4A1f`](https://explorer.arc.io/address/0x8642f95eD9785afCD0C9F822fC91897E661E4A1f) | [source](https://repo.sourcify.dev/5042/0x8642f95eD9785afCD0C9F822fC91897E661E4A1f) |
| DiamondCutFacet | [`0x34196d3DebC549aa6239cbaD37039840071aEdb3`](https://explorer.arc.io/address/0x34196d3DebC549aa6239cbaD37039840071aEdb3) | [source](https://repo.sourcify.dev/5042/0x34196d3DebC549aa6239cbaD37039840071aEdb3) |
| DiamondLoupeFacet | [`0xf3a720CD23bBA2dA8bd9f979DAEF57df4764ad01`](https://explorer.arc.io/address/0xf3a720CD23bBA2dA8bd9f979DAEF57df4764ad01) | [source](https://repo.sourcify.dev/5042/0xf3a720CD23bBA2dA8bd9f979DAEF57df4764ad01) |
| OwnershipFacet | [`0xd5215b5A2D43d29441Dc3dF84733a91ad6536A3F`](https://explorer.arc.io/address/0xd5215b5A2D43d29441Dc3dF84733a91ad6536A3F) | [source](https://repo.sourcify.dev/5042/0xd5215b5A2D43d29441Dc3dF84733a91ad6536A3F) |
| AdminFacet | [`0xF9568872C061C9461de6870Fc0955230243BA84E`](https://explorer.arc.io/address/0xF9568872C061C9461de6870Fc0955230243BA84E) | [source](https://repo.sourcify.dev/5042/0xF9568872C061C9461de6870Fc0955230243BA84E) |
| BasketNFTFacet | [`0xFc2896142E6e0155cB2446d0F78A880D657cC81a`](https://explorer.arc.io/address/0xFc2896142E6e0155cB2446d0F78A880D657cC81a) | [source](https://repo.sourcify.dev/5042/0xFc2896142E6e0155cB2446d0F78A880D657cC81a) |
| DepositFacet | [`0xe960fd941c37D36A5C6EE8fe123c928625d1E02C`](https://explorer.arc.io/address/0xe960fd941c37D36A5C6EE8fe123c928625d1E02C) | [source](https://repo.sourcify.dev/5042/0xe960fd941c37D36A5C6EE8fe123c928625d1E02C) |
| BasketViewFacet | [`0xDfCAF4666C96B4b887b0FA7B30F05e9e5F1c3AF0`](https://explorer.arc.io/address/0xDfCAF4666C96B4b887b0FA7B30F05e9e5F1c3AF0) | [source](https://repo.sourcify.dev/5042/0xDfCAF4666C96B4b887b0FA7B30F05e9e5F1c3AF0) |
| RedeemFacet | [`0x96d8593DBd35B49e78d4729D8FbE082F359c76A1`](https://explorer.arc.io/address/0x96d8593DBd35B49e78d4729D8FbE082F359c76A1) | [source](https://repo.sourcify.dev/5042/0x96d8593DBd35B49e78d4729D8FbE082F359c76A1) |
| NavGuardFacet | [`0xBC9f1d60d48258DdDB375Edd3e25268b43A06B23`](https://explorer.arc.io/address/0xBC9f1d60d48258DdDB375Edd3e25268b43A06B23) | [source](https://repo.sourcify.dev/5042/0xBC9f1d60d48258DdDB375Edd3e25268b43A06B23) |

### Basket routers and asset tokens

Strategy IDs follow the catalogue order. Each router holds deposits in reserve and issues the Basket's asset tokens into the Basket's own ERC-6551 account.

**1. NEURAL**: router [`0x0738D88418c625e82364C75A1160f4faa5fDB90E`](https://explorer.arc.io/address/0x0738D88418c625e82364C75A1160f4faa5fDB90E) ([source](https://repo.sourcify.dev/5042/0x0738D88418c625e82364C75A1160f4faa5fDB90E))

| Asset | Weight | Address | Verified |
| --- | --- | --- | --- |
| mNVDA | 30% | [`0xac302e5CD486C0d8d0398f9669243f405811F94b`](https://explorer.arc.io/address/0xac302e5CD486C0d8d0398f9669243f405811F94b) | [source](https://repo.sourcify.dev/5042/0xac302e5CD486C0d8d0398f9669243f405811F94b) |
| mTAO | 20% | [`0xA937E21E347C976Faa0Bb2ddd4211c47368d9DD3`](https://explorer.arc.io/address/0xA937E21E347C976Faa0Bb2ddd4211c47368d9DD3) | [source](https://repo.sourcify.dev/5042/0xA937E21E347C976Faa0Bb2ddd4211c47368d9DD3) |
| mGOOGL | 15% | [`0x6EcF6c7a721CCB903259B40F8CB3b8BB67cD808b`](https://explorer.arc.io/address/0x6EcF6c7a721CCB903259B40F8CB3b8BB67cD808b) | [source](https://repo.sourcify.dev/5042/0x6EcF6c7a721CCB903259B40F8CB3b8BB67cD808b) |
| mNEAR | 10% | [`0x3733928D8Fd1d55f5Df8b3a229BBA2BC53Ee63d7`](https://explorer.arc.io/address/0x3733928D8Fd1d55f5Df8b3a229BBA2BC53Ee63d7) | [source](https://repo.sourcify.dev/5042/0x3733928D8Fd1d55f5Df8b3a229BBA2BC53Ee63d7) |
| mGLD | 10% | [`0x76C1057D0408674c400090191d0D4dDc2d5A6216`](https://explorer.arc.io/address/0x76C1057D0408674c400090191d0D4dDc2d5A6216) | [source](https://repo.sourcify.dev/5042/0x76C1057D0408674c400090191d0D4dDc2d5A6216) |
| mCASH | 15% | [`0xcff6045ce2089699467f374f9bC52B200934CFA8`](https://explorer.arc.io/address/0xcff6045ce2089699467f374f9bC52B200934CFA8) | [source](https://repo.sourcify.dev/5042/0xcff6045ce2089699467f374f9bC52B200934CFA8) |

**2. RAILS**: router [`0x2b0918B51587178d2a57c58D2D972069ee5a4360`](https://explorer.arc.io/address/0x2b0918B51587178d2a57c58D2D972069ee5a4360) ([source](https://repo.sourcify.dev/5042/0x2b0918B51587178d2a57c58D2D972069ee5a4360))

| Asset | Weight | Address | Verified |
| --- | --- | --- | --- |
| mCOIN | 20% | [`0x2318483F2867BCeC2e548d7f198572964f4027e4`](https://explorer.arc.io/address/0x2318483F2867BCeC2e548d7f198572964f4027e4) | [source](https://repo.sourcify.dev/5042/0x2318483F2867BCeC2e548d7f198572964f4027e4) |
| mCRCL | 15% | [`0x48756848F8Ef3741d425f6ad413bD6D346BE64aB`](https://explorer.arc.io/address/0x48756848F8Ef3741d425f6ad413bD6D346BE64aB) | [source](https://repo.sourcify.dev/5042/0x48756848F8Ef3741d425f6ad413bD6D346BE64aB) |
| mETH | 20% | [`0x88be1faaa68E3d6d1684d4a6cb4b3FD14AC8f734`](https://explorer.arc.io/address/0x88be1faaa68E3d6d1684d4a6cb4b3FD14AC8f734) | [source](https://repo.sourcify.dev/5042/0x88be1faaa68E3d6d1684d4a6cb4b3FD14AC8f734) |
| mSOL | 15% | [`0x327275d4ede2194D8896b31D750c5e2cf11B2576`](https://explorer.arc.io/address/0x327275d4ede2194D8896b31D750c5e2cf11B2576) | [source](https://repo.sourcify.dev/5042/0x327275d4ede2194D8896b31D750c5e2cf11B2576) |
| mLINK | 10% | [`0x439A961a1d63B2dd1AE6FDF7b7C782A178CdA5f6`](https://explorer.arc.io/address/0x439A961a1d63B2dd1AE6FDF7b7C782A178CdA5f6) | [source](https://repo.sourcify.dev/5042/0x439A961a1d63B2dd1AE6FDF7b7C782A178CdA5f6) |
| mGLD | 5% | [`0x8862DB511cd866a84C63407A68bc810e65e5fB93`](https://explorer.arc.io/address/0x8862DB511cd866a84C63407A68bc810e65e5fB93) | [source](https://repo.sourcify.dev/5042/0x8862DB511cd866a84C63407A68bc810e65e5fB93) |
| mCASH | 15% | [`0xEa0E9C058fc7ddeEd3dfa6e1D573412E0bdC7461`](https://explorer.arc.io/address/0xEa0E9C058fc7ddeEd3dfa6e1D573412E0bdC7461) | [source](https://repo.sourcify.dev/5042/0xEa0E9C058fc7ddeEd3dfa6e1D573412E0bdC7461) |

**3. RESERVE**: router [`0x578F94d870940064bD6bfB1A6F782B25E79a565D`](https://explorer.arc.io/address/0x578F94d870940064bD6bfB1A6F782B25E79a565D) ([source](https://repo.sourcify.dev/5042/0x578F94d870940064bD6bfB1A6F782B25E79a565D))

| Asset | Weight | Address | Verified |
| --- | --- | --- | --- |
| mBTC | 30% | [`0x1127ad3c2393D8c7391A7782a40BE784804D52a2`](https://explorer.arc.io/address/0x1127ad3c2393D8c7391A7782a40BE784804D52a2) | [source](https://repo.sourcify.dev/5042/0x1127ad3c2393D8c7391A7782a40BE784804D52a2) |
| mSPY | 25% | [`0xcc3c45bDF21292699583a42d12dc5b1e594EabBD`](https://explorer.arc.io/address/0xcc3c45bDF21292699583a42d12dc5b1e594EabBD) | [source](https://repo.sourcify.dev/5042/0xcc3c45bDF21292699583a42d12dc5b1e594EabBD) |
| mGLD | 20% | [`0xf1C797d9a32560C84455AbFedD4078FEc69E4809`](https://explorer.arc.io/address/0xf1C797d9a32560C84455AbFedD4078FEc69E4809) | [source](https://repo.sourcify.dev/5042/0xf1C797d9a32560C84455AbFedD4078FEc69E4809) |
| mETH | 10% | [`0x9D5dA819081b2EBadf9AA8394A711C24C35Cc946`](https://explorer.arc.io/address/0x9D5dA819081b2EBadf9AA8394A711C24C35Cc946) | [source](https://repo.sourcify.dev/5042/0x9D5dA819081b2EBadf9AA8394A711C24C35Cc946) |
| mCASH | 15% | [`0x776Aba3C22aE1de581F759Dd85506b062ca7DA2b`](https://explorer.arc.io/address/0x776Aba3C22aE1de581F759Dd85506b062ca7DA2b) | [source](https://repo.sourcify.dev/5042/0x776Aba3C22aE1de581F759Dd85506b062ca7DA2b) |

**4. FRONTIER**: router [`0x447463E069D80CEC7B55FaC5f8E8A4783f806a72`](https://explorer.arc.io/address/0x447463E069D80CEC7B55FaC5f8E8A4783f806a72) ([source](https://repo.sourcify.dev/5042/0x447463E069D80CEC7B55FaC5f8E8A4783f806a72))

| Asset | Weight | Address | Verified |
| --- | --- | --- | --- |
| mQQQ | 25% | [`0x89E06F5AB6A4B704bA74922f75790726698CFc12`](https://explorer.arc.io/address/0x89E06F5AB6A4B704bA74922f75790726698CFc12) | [source](https://repo.sourcify.dev/5042/0x89E06F5AB6A4B704bA74922f75790726698CFc12) |
| mAMD | 15% | [`0xf86D5953670434Df553b72aB5e97a5Da581D8627`](https://explorer.arc.io/address/0xf86D5953670434Df553b72aB5e97a5Da581D8627) | [source](https://repo.sourcify.dev/5042/0xf86D5953670434Df553b72aB5e97a5Da581D8627) |
| mTSLA | 15% | [`0xcd8596547C9EB43Bd35a94A69B315e1e28949b26`](https://explorer.arc.io/address/0xcd8596547C9EB43Bd35a94A69B315e1e28949b26) | [source](https://repo.sourcify.dev/5042/0xcd8596547C9EB43Bd35a94A69B315e1e28949b26) |
| mRENDER | 15% | [`0xd1503aB9e3284D10F217214939f7f25b65646751`](https://explorer.arc.io/address/0xd1503aB9e3284D10F217214939f7f25b65646751) | [source](https://repo.sourcify.dev/5042/0xd1503aB9e3284D10F217214939f7f25b65646751) |
| mSOL | 10% | [`0x1b01F1C6f253946AEA24916ED1E463137bE3907D`](https://explorer.arc.io/address/0x1b01F1C6f253946AEA24916ED1E463137bE3907D) | [source](https://repo.sourcify.dev/5042/0x1b01F1C6f253946AEA24916ED1E463137bE3907D) |
| mGLD | 5% | [`0x9674007D3Bcf804af1B1567c9B479cA18fA18117`](https://explorer.arc.io/address/0x9674007D3Bcf804af1B1567c9B479cA18fA18117) | [source](https://repo.sourcify.dev/5042/0x9674007D3Bcf804af1B1567c9B479cA18fA18117) |
| mUSO | 5% | [`0x940B77A26Cf874DAAB4c961e8BBD64424E0f5841`](https://explorer.arc.io/address/0x940B77A26Cf874DAAB4c961e8BBD64424E0f5841) | [source](https://repo.sourcify.dev/5042/0x940B77A26Cf874DAAB4c961e8BBD64424E0f5841) |
| mCASH | 10% | [`0xf243145A644524Ad058e60E80445ab67f05f19F0`](https://explorer.arc.io/address/0xf243145A644524Ad058e60E80445ab67f05f19F0) | [source](https://repo.sourcify.dev/5042/0xf243145A644524Ad058e60E80445ab67f05f19F0) |

**5. FORTRESS**: router [`0xB283eA18875eeD8391d973F7Ad80b97075876BBd`](https://explorer.arc.io/address/0xB283eA18875eeD8391d973F7Ad80b97075876BBd) ([source](https://repo.sourcify.dev/5042/0xB283eA18875eeD8391d973F7Ad80b97075876BBd))

| Asset | Weight | Address | Verified |
| --- | --- | --- | --- |
| mGLD | 30% | [`0x60AEE3c937d784BE9cAa994c0B13DdcFdd6e6Edd`](https://explorer.arc.io/address/0x60AEE3c937d784BE9cAa994c0B13DdcFdd6e6Edd) | [source](https://repo.sourcify.dev/5042/0x60AEE3c937d784BE9cAa994c0B13DdcFdd6e6Edd) |
| mSPY | 20% | [`0x3157a42114ed2c875702f1d0C463540dF4417148`](https://explorer.arc.io/address/0x3157a42114ed2c875702f1d0C463540dF4417148) | [source](https://repo.sourcify.dev/5042/0x3157a42114ed2c875702f1d0C463540dF4417148) |
| mBTC | 15% | [`0xf2b1fF3568F3858E834EE1b0045dE7FF32410882`](https://explorer.arc.io/address/0xf2b1fF3568F3858E834EE1b0045dE7FF32410882) | [source](https://repo.sourcify.dev/5042/0xf2b1fF3568F3858E834EE1b0045dE7FF32410882) |
| mETH | 10% | [`0x441E3D9a0fd7c24B33E5c587311A853fef15981C`](https://explorer.arc.io/address/0x441E3D9a0fd7c24B33E5c587311A853fef15981C) | [source](https://repo.sourcify.dev/5042/0x441E3D9a0fd7c24B33E5c587311A853fef15981C) |
| mCASH | 25% | [`0xbD84Cf91e3cD72DDA43B03e6aeb2eE5072278AFe`](https://explorer.arc.io/address/0xbD84Cf91e3cD72DDA43B03e6aeb2eE5072278AFe) | [source](https://repo.sourcify.dev/5042/0xbD84Cf91e3cD72DDA43B03e6aeb2eE5072278AFe) |

## Redeploying to Arc Mainnet

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

Verify every deployed contract with `forge verify-contract <address> <path>:<Contract> --chain-id 5042 --verifier sourcify`. Tokens created by the routers also need `--constructor-args` (name, symbol, 18, router). The Arc explorer API (`explorer.arc.io/api`) is behind a Cloudflare challenge and rejects CLI submissions. Confirm each address returns `exact_match` from `https://sourcify.dev/server/v2/contract/5042/<address>` before marking the manifest verified.

## Documentation

- [Implementation audit and plan](docs/ARC_IMPLEMENTATION_PLAN.md)
- [Arc migration](docs/ARC_MIGRATION.md)
- [Architecture and accounting](docs/ARCHITECTURE.md)
- [Judge walkthrough](docs/DEMO_GUIDE.md)
- [Security and limitations](docs/SECURITY_AND_LIMITATIONS.md)
- [Submission draft](docs/ARC_MICROGRANTS_SUBMISSION.md)
- [Historical Robinhood documentation](docs/ROBINHOOD_LEGACY_README.md)

This project is unaudited. Diamond upgrades and configuration remain owner-controlled. Local rehearsal evidence is explicitly not mainnet evidence.
