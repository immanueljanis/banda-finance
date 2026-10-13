/** Arc has no parent chain: the NAV guard compares quotes against the native block number. */
export function metadata(header) {
  if (!header?.number || !header?.timestamp) throw new Error("Missing block metadata");
  return { block: BigInt(header.number), time: BigInt(header.timestamp) };
}

export function shouldRefresh(quote, head, maxAge, maxLag) {
  const [price, time, block, valid] = quote;
  if (price <= 0n || !valid) throw new Error("Refusing to renew an invalid or uninitialized quote");
  if (time > head.time || block > head.block) throw new Error("Future quote or inconsistent RPC");
  if (maxAge <= 0n || maxLag <= 0n) throw new Error("Invalid NAV policy");
  // Renew halfway through either validity window, leaving time for confirmations.
  return head.time - time >= (maxAge + 1n) / 2n ||
    head.block - block >= (maxLag + 1n) / 2n;
}
