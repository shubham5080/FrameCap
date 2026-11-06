/** Assets offered for daily caps in the product UI. */
export const QUOTA_TOKENS = [
  { id: "ETH", label: "ETH", hint: "Native", defaultLimit: "0.001" },
  { id: "USDC", label: "USDC", hint: "Stable", defaultLimit: "10" },
  { id: "USDT", label: "USDT", hint: "Stable", defaultLimit: "10" },
] as const;

export type QuotaTokenId = (typeof QUOTA_TOKENS)[number]["id"];

export function tokenMeta(id: QuotaTokenId) {
  return QUOTA_TOKENS.find((t) => t.id === id) ?? QUOTA_TOKENS[0];
}

/**
 * Workshop Diff still settles native ETH on chain 1337.
 * Stable picks are product UX; live proof uses a small ETH spine.
 */
export function ethLimitForWorkshopProof(
  token: QuotaTokenId,
  amount: string,
): string {
  if (token === "ETH") return amount;
  return "0.001";
}
