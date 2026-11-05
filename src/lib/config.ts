/**
 * Pinned from forshtat/mempool-workshop workshop.config.json5 (verify live at runtime).
 * Gateway = sidecar: alt admit + eth_* proxy + faucet/explorer methods.
 */
export const config = {
  chainId: 1337,
  gatewayUrl: "https://altmempoolgateway.forshtat.com/rpc",
  explorerUrl: "https://explorer.altmempool.wtf/",
  stakingRegistry: "0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f" as const,
  entryPoint: "0x00000000000000000000000000000000000000aa" as const,
  /** Demo transfer recipient from workshop.config.json5 */
  recipient: "0x8943545177806ED17B9F23F0a21ee5948eCaa776" as const,
  /** 1 gwei transfer value */
  transferWei: 1_000_000_000n,
  /** 2 gwei maxFeePerGas */
  maxFeePerGasWei: 2_000_000_000n,
  /** Faucet if balance below 0.1 ETH */
  minBalanceWei: 10n ** 17n,
  /** Strictly above minStake 0.01 ETH */
  stakeEth: "0.012",
  unstakeDelaySec: 86400,
  txTimeoutSec: 120,
  /** hegota-support profile id for this devnet */
  profileId: "ethrex-eip8141-tracer",
  hegotaSupportVersion: "0.0.1",
} as const;

export function explorerTxUrl(hash: string) {
  const base = config.explorerUrl.replace(/\/$/, "");
  return `${base}/tx/${hash}`;
}
