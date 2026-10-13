# Arc architecture

Settlement uses test USDC (tUSDC) and test asset tokens. They have no monetary value and do not redeem for real USDC.

The existing EIP-2535 Diamond holds the ERC-721 ownership and Basket accounting in the unchanged `banda.managed-baskets.storage.v1` namespace. Deposit, redemption, NFT, view and NAV guard facets are reused. The Arc deployment selects nine facets; rebalance execution is not installed. The owner retains Diamond upgrades, pause, strategy and NAV configuration authority.

Each deposit creates a new transferable NFT, matching the existing implementation. NFT approvals and transfers are preserved. A standard ERC-6551 registry derives the account from implementation, salt, chain ID, Diamond address and token ID. `RegistryAdapter` translates the existing registry call into the standard interface. `ArcBasketAccount` reads the immutable proxy footer and permits asset execution only through the controlling Diamond while the NFT exists. Owners cannot withdraw individual legs around redemption. Signature authorization is intentionally disabled. No separate initialization transaction is required.

## Fixed accounting

tUSDC uses six decimals; asset tokens use eighteen. Minimum deposit is 10 tUSDC. Each Basket (strategy IDs 1-5 in catalogue order) has its own router, which holds that Basket's deposits as an exact principal reserve. It issues synthetic tokens directly to the account; issuance is not a market purchase.

NEURAL, as an example (all routers and legs are listed in the README):

| Leg | Weight | Fixed tUSDC price per token |
| --- | ---: | ---: |
| mNVDA | 30% | 100 |
| mTAO | 20% | 200 |
| mGOOGL | 15% | 150 |
| mNEAR | 10% | 5 |
| mGLD | 10% | 250 |
| mCASH | 15% | 1 |

Allocation credits are floored for every leg except the last (the cash sleeve), which receives the remaining credits. Quantity is `allocatedCredits6 * 10^18 / price6`, floored. The router records the exact issued quantities and principal per account. Fixed NAV is principal, not a tradable price or investment return. Tiny quantity rounding never increases redemption liability. Annual fees are zero.

Full redemption transfers the recorded issued quantities from the account to the router, burns those tokens and refunds exactly the reserved principal through the Diamond to the NFT owner. The NFT is burned. Partial redemption is disabled. Donations do not increase principal or redeemable quantities; unrelated tokens can remain stranded after redemption. Router liabilities track open principal and are covered by tUSDC reserves.

tUSDC faucet claims are 1,000 tokens every 24 hours, capped at 5,000 per address. Asset token minting is restricted to the issuing router. One NAV adapter recognises all five routers. There are no swaps, lending protocols, bridges, changing prices or external NAV signers.

Native USDC is exclusively network gas and uses 18 decimals. Its six-decimal ERC-20 interface at `0x3600000000000000000000000000000000000000` represents the same balance. Neither interface participates in demo settlement.

## Frontend

Next.js retains the existing visual system and catalogue. All five Baskets accept deposits; the faucet sits at the bottom of the Portfolio page. Before sending, the wallet's own RPC must see the Diamond, so a wallet pointed at another network is blocked. Injected wallets work without Privy credentials; existing Privy support remains optional. Transactions are simulated, sent through the wallet and checked for successful receipts. Portfolio reads use one block for NFT/account balances and show RPC failures. The demo enumerates at most 5,000 NFT IDs; production would require event indexing. The mainnet manifest is written only from confirmed receipts by `scripts/arc-evidence.mjs`.
