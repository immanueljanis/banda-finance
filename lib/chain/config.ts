import { ARC, CONTRACTS } from "./arc";
/** Compatibility export for archived market readers. New demo flows use arc.ts. */
export const ROBINHOOD_TESTNET = {...ARC, diamond:CONTRACTS.diamond, settlementAsset:CONTRACTS.demoUSD, usdgFaucet:"/portfolio#faucet", explorer:ARC.blockExplorers.default.url};
export const STRATEGY_IDS = [1, 2, 3, 4, 5] as const;
export const CANONICAL_TESTNET_TICKERS = [] as const;
