import { ARC, CONTRACTS } from "./arc";
/** Compatibility export for archived market readers. New demo flows use arc.ts. */
export const ROBINHOOD_TESTNET = {...ARC, diamond:CONTRACTS.diamond, settlementAsset:CONTRACTS.demoUSD, usdgFaucet:"/mint", explorer:ARC.blockExplorers.default.url};
export const STRATEGY_IDS = [1, 0, 0, 0, 0] as const;
export const CANONICAL_TESTNET_TICKERS = [] as const;
