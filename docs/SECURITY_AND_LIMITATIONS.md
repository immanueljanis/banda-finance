# Security and limitations

This is an unaudited proof of concept, not a production investment product. All underlying assets, prices and valuations are simulated. There is no securities or commodities backing, liquidity, guaranteed yield, real investment exposure or redemption into real USDC. Do not send valuable assets to these contracts.

DemoUSD is a separate six-decimal ERC-20. Real USDC pays network gas only. The router rejects real USDC as settlement. Mock tokens have restricted issuance; the faucet is time- and lifetime-limited per wallet, but is not Sybil-resistant. Multiple wallets can claim independently.

The Diamond owner can upgrade facets, pause activity and change strategy/NAV configuration. These are significant trust powers, not a trustless immutable deployment. Intended owner: `0xc924D1236422Ccca9d08e78f059b574f443Ca29d`. Actual mainnet deployment and ownership remain unverified until receipts exist. The immutable router has no reserve withdrawal mechanism, but Diamond upgrades remain a custody risk.

NFT transfer and operator approvals are inherited behavior. Redemption proceeds go to the NFT owner; approved operators may initiate redemption. Users should grant approvals carefully. Accounts permit calls only from their bound NFT contract while ownership exists. Signature validation is disabled. Accounts cannot send native currency through the supported execution path.

Only full redemption is supported. Issued underlying tokens are burned, principal is refunded and the NFT closes. Direct donations and unrelated assets are not included in liabilities and may become permanently stranded. Do not transfer the controlling NFT to its own account or create circular ownership; there is no recovery flow.

Prices are fixed synthetic constants. NAV equals deposited principal, not market value. Rounding does not promise extra credits. No price updater, market data service, DEX or lending system is used by this demo.

The frontend enumerates a bounded number of Basket IDs and relies on RPC availability. It is not a production indexer. RPC failures must not be interpreted as zero balances or transaction success. Browser configuration must be rebuilt after deployment addresses change.

Mainnet contracts are not yet deployed or source-verified. Local manifests and dry-run output must never be submitted as mainnet evidence. Legacy Robinhood scripts remain for history and should not be used to operate the Arc demo. The inherited legacy browser suite contains old product assumptions; use the dedicated Arc journey suite for this migration.
