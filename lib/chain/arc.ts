import { defineChain, isAddress, zeroAddress, type Address } from "viem";
import manifest from "@/deployments/arc-mainnet.json";

export const ARC = defineChain({
  id: 5042, name: "Arc Mainnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.mainnet.arc.io"] } },
  blockExplorers: { default: { name: "Arc Explorer", url: "https://explorer.arc.io" } },
});
export const REAL_USDC = "0x3600000000000000000000000000000000000000" as Address;
function address(value: string | null | undefined): Address {
  return value && isAddress(value) ? value as Address : zeroAddress;
}
export const CONTRACTS = {
  diamond: address(process.env.NEXT_PUBLIC_ARC_DIAMOND || manifest.diamond),
  demoUSD: address(process.env.NEXT_PUBLIC_ARC_DEMO_USD || manifest.demoUSD),
  router: address(process.env.NEXT_PUBLIC_ARC_ROUTER || manifest.router),
};
export const DEPLOYED = Object.values(CONTRACTS).every(a => a !== zeroAddress) && CONTRACTS.demoUSD !== REAL_USDC;
export const DISCLOSURE = "Arc Mainnet Proof of Concept. All portfolio assets and valuations are simulated and have no real-world backing or monetary value.";
export const explorerAddress = (value: string) => `${ARC.blockExplorers.default.url}/address/${value}`;
export const explorerTx = (value: string) => `${ARC.blockExplorers.default.url}/tx/${value}`;
// Same USDC balance, two interfaces. Never add these representations together.
export const nativeToErc20USDC = (native: bigint) => native / BigInt(1e12);
export const erc20ToNativeUSDC = (erc20: bigint) => erc20 * BigInt(1e12);
