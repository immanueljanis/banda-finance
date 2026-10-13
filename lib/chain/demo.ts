import { createPublicClient, http, parseAbi, keccak256, toBytes, numberToHex, encodeAbiParameters, formatUnits, type Address } from "viem";
import { ARC, CONTRACTS, DEPLOYED, REAL_USDC } from "./arc";

export const demoAbi = parseAbi([
  "function claim()", "function nextClaimAt(address) view returns (uint256)", "function claimed(address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)",
  "function symbol() view returns (string)", "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)", "function ownerOf(uint256) view returns (address)",
  "function deposit(uint32,uint256) returns (uint256,address,uint256)",
  "function redeem(uint256,uint256,uint256) returns (uint256)",
  "function previewRedeem(uint256,uint256) view returns (uint256,uint256,uint256)",
  "function basket(uint256) view returns (uint32,address,uint128)",
  "function settlementAsset() view returns (address)",
  "function strategy(uint32) view returns (address,uint96,uint16,address,bool)",
  "function legs() view returns (address[],uint16[])",
  "function simulatedPrices() view returns (uint256[])",
  "function previewAllocation(uint256) view returns (uint256[])",
]);
export const demoClient = createPublicClient({ chain: ARC, transport: http(undefined, { timeout: 15_000, retryCount: 1 }) });
export async function assertDemoDeployment() {
  if (!DEPLOYED) throw new Error("Arc deployment is pending. Demo actions are unavailable.");
  if (await demoClient.getChainId() !== ARC.id) throw new Error("RPC is not Arc Mainnet.");
  const [settlement, strategy, decimals] = await Promise.all([
    demoClient.readContract({ address: CONTRACTS.diamond, abi: demoAbi, functionName: "settlementAsset" }),
    demoClient.readContract({ address: CONTRACTS.diamond, abi: demoAbi, functionName: "strategy", args: [1] }),
    demoClient.readContract({ address: CONTRACTS.demoUSD, abi: demoAbi, functionName: "decimals" }),
  ]);
  if (settlement.toLowerCase() !== CONTRACTS.demoUSD.toLowerCase() || settlement.toLowerCase() === REAL_USDC.toLowerCase() || strategy[0].toLowerCase() !== CONTRACTS.router.toLowerCase() || decimals !== 6 || strategy[2] !== 0) {
    throw new Error("Deployment does not match the DemoUSD configuration. Actions blocked.");
  }
}
export type DemoHolding = { token: Address; symbol: string; balance: string; weight: number; price: string };
export type DemoPosition = { tokenId: string; strategyId: number; slug: string; name: string; account: Address; shares: string; displayShares: string; owner: Address; holdings: DemoHolding[] };
export async function readDemoPortfolio(owner: Address) {
  await assertDemoDeployment();
  const blockNumber = await demoClient.getBlockNumber({ cacheTime: 0 });
  const slot = numberToHex(BigInt(keccak256(toBytes("banda.managed-baskets.storage.v1"))) + BigInt(4), { size: 32 });
  const [raw, settlementBalance, gasBalance] = await Promise.all([
    demoClient.getStorageAt({ address: CONTRACTS.diamond, slot, blockNumber }),
    demoClient.readContract({ address: CONTRACTS.demoUSD, abi: demoAbi, functionName: "balanceOf", args: [owner], blockNumber }),
    demoClient.getBalance({ address: owner, blockNumber }),
  ]);
  const count = Number(BigInt(raw || "0x0"));
  if (count > 5000) throw new Error("Demo indexer capacity exceeded; event indexing is required.");
  const [legs, prices] = await Promise.all([
    demoClient.readContract({ address: CONTRACTS.router, abi: demoAbi, functionName: "legs", blockNumber }),
    demoClient.readContract({ address: CONTRACTS.router, abi: demoAbi, functionName: "simulatedPrices", blockNumber }),
  ]);
  const positions: DemoPosition[] = [];
  for (let start = 1; start <= count; start += 20) {
    const ids = Array.from({ length: Math.min(20, count - start + 1) }, (_, i) => BigInt(start + i));
    const results = await Promise.all(ids.map(async id => {
      // Closed baskets have an empty basket struct. RPC errors must propagate.
      const base = keccak256(encodeAbiParameters([{type:"uint256"},{type:"uint256"}], [id, BigInt(keccak256(toBytes("banda.managed-baskets.storage.v1")))+BigInt(8)]));
      const basketSlot = await demoClient.getStorageAt({address:CONTRACTS.diamond, slot:base, blockNumber});
      if (!basketSlot || BigInt(basketSlot) === BigInt(0)) return null;
      const holder = await demoClient.readContract({ address: CONTRACTS.diamond, abi: demoAbi, functionName: "ownerOf", args: [id], blockNumber });
      if (holder.toLowerCase() !== owner.toLowerCase()) return null;
      const [strategyId, account, shares] = await demoClient.readContract({ address: CONTRACTS.diamond, abi: demoAbi, functionName: "basket", args: [id], blockNumber });
      const holdings = await Promise.all(legs[0].map(async (token, i) => {
        const [balance, symbol] = await Promise.all([
          demoClient.readContract({ address: token, abi: demoAbi, functionName: "balanceOf", args: [account], blockNumber }),
          demoClient.readContract({ address: token, abi: demoAbi, functionName: "symbol", blockNumber }),
        ]);
        return { token, symbol, balance: balance.toString(), weight: legs[1][i] / 100, price: prices[i].toString() };
      }));
      return { tokenId: id.toString(), strategyId, account, shares: shares.toString(), displayShares: formatUnits(shares,6), owner: holder, slug: "neural", name: "NEURAL", holdings };
    }));
    positions.push(...results.filter((v): v is DemoPosition => v !== null));
  }
  return { positions, settlementBalance: settlementBalance.toString(), gasBalance: gasBalance.toString(), blockNumber: blockNumber.toString() };
}
