import { encodeFunctionData, type Address, type Hex } from "viem";
import { config } from "./config";
import { rpc } from "./rpc";

const DEPOSIT_INFO_ABI = [
  {
    type: "function",
    name: "getDepositInfo",
    stateMutability: "view",
    inputs: [{ type: "address" }],
    outputs: [
      { type: "uint256" },
      { type: "uint32" },
      { type: "uint64" },
    ],
  },
] as const;

export type StakeInfo = {
  amountWei: bigint;
  unstakeDelaySec: number;
  withdrawTime: number;
};

/** NaiveStakingRegistry.getDepositInfo(address) → (stake, unstakeDelay, withdrawTime). */
export async function getStakeInfo(address: Address): Promise<StakeInfo> {
  const data = encodeFunctionData({
    abi: DEPOSIT_INFO_ABI,
    functionName: "getDepositInfo",
    args: [address],
  });
  const out = (await rpc<Hex>("eth_call", [
    { to: config.stakingRegistry, data },
    "latest",
  ])) as Hex;
  const body = out.slice(2);
  if (body.length < 192) {
    return { amountWei: 0n, unstakeDelaySec: 0, withdrawTime: 0 };
  }
  return {
    amountWei: BigInt(`0x${body.slice(0, 64)}`),
    unstakeDelaySec: Number(BigInt(`0x${body.slice(64, 128)}`)),
    withdrawTime: Number(BigInt(`0x${body.slice(128, 192)}`)),
  };
}

export function formatStakeEth(amountWei: bigint): string {
  const whole = amountWei / 10n ** 18n;
  const frac = (amountWei % 10n ** 18n).toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${frac}`;
}
