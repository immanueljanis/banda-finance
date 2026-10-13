import type { Address } from "viem";

const walletRpcUrl =
  process.env.NEXT_PUBLIC_ARC_RPC_URL ??
  "https://rpc.mainnet.arc.io";

export const ROBINHOOD_TESTNET = {
  id: 5042,
  name: "Arc Mainnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  blockTime: 500,
  contracts: { multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" as Address } },
  rpcUrls: { default: { http: [walletRpcUrl] }, public: { http: [walletRpcUrl] } },
  diamond: "0x95bFe16D93B49dEA0feC30C596a8AFb7Cb3BBeE2" as Address,
  settlementAsset: "0x4724F649C045B4358fF93FfabB3c72486cE8931a" as Address,
  usdgFaucet: "/mint",
  explorer: "https://explorer.arc.io",
} as const;

/** Contract strategy ids for BASKETS, in the same order: market-priced Baskets settled in test USDC. Ids 1-20 are disabled placeholders. */
export const STRATEGY_IDS = [21, 22, 23, 24, 25] as const;

/** Every live Basket leg is a pool-minted testnet mock priced at live market prices; none is a canonical token. */
export const CANONICAL_TESTNET_TICKERS = [] as const;
