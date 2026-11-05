import { encodeFunctionData, type Address, type Hex } from "viem";
import { getProfile } from "@forshtat/hegota-support/profiles";
import {
  frame,
  newTx,
  secp256k1Placeholder,
  signTx,
  txHash,
  type FrameTx,
} from "@forshtat/hegota-support/tx";
import { toWire } from "@forshtat/hegota-support/rpc";
import { config } from "./config";

export const profile = getProfile(config.profileId);

function assemble(a: {
  sender: Address;
  nonceSeq: bigint;
  maxFeePerGas: bigint;
  frames: ReturnType<typeof frame>[];
  signer?: Hex;
}): FrameTx {
  return newTx({
    chainId: config.chainId,
    sender: a.sender,
    nonceSeq: a.nonceSeq,
    signatures: [secp256k1Placeholder(profile, a.signer)],
    fees: { maxFeePerGas: a.maxFeePerGas },
    frames: a.frames,
  });
}

/** Minimal self-relay: VERIFY(self) + SENDER transfer. */
export function buildSelfRelayTx(a: {
  from: Address;
  to: Address;
  value: bigint;
  nonce: bigint;
  maxFeePerGas: bigint;
}): FrameTx {
  return assemble({
    sender: a.from,
    nonceSeq: a.nonce,
    maxFeePerGas: a.maxFeePerGas,
    frames: [
      frame(profile, "VERIFY", {
        scope: "EXECUTION_AND_PAYMENT",
        target: null,
        execution: 30_000n,
      }),
      frame(profile, "SENDER", {
        target: a.to,
        execution: 50_000n,
        state: 200_000n,
        value: a.value,
      }),
    ],
  });
}

const RECORD_SPEND_ABI = [
  {
    type: "function",
    name: "recordSpend",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address" },
      { type: "uint128" },
    ],
    outputs: [],
  },
] as const;

/** Wallet VERIFY (+ optional quota probe) + optional ledger.recordSpend + SENDER transfer. */
export function buildWalletTx(a: {
  wallet: Address;
  owner: Address;
  to: Address;
  value: bigint;
  nonce: bigint;
  maxFeePerGas: bigint;
  /** Non-empty → QuotaWallet reads foreign ledger storage. */
  verifyData?: Hex;
  /** When set with ledger, records spend in execution (persists after VERIFY). */
  ledger?: Address;
  spendWei?: bigint;
}): FrameTx {
  // Devnet MAX_VERIFY_GAS is 100_000 (incl. ~2800 sig cost) — stay ≤ 70k like workshop wallets.
  const frames = [
    frame(profile, "VERIFY", {
      scope: "EXECUTION_AND_PAYMENT",
      target: null,
      execution: 70_000n,
      data: a.verifyData,
    }),
  ];
  if (a.ledger && a.spendWei != null) {
    frames.push(
      frame(profile, "SENDER", {
        target: a.ledger,
        execution: 80_000n,
        state: 200_000n,
        data: encodeFunctionData({
          abi: RECORD_SPEND_ABI,
          functionName: "recordSpend",
          args: [a.wallet, a.spendWei],
        }),
      }),
    );
  }
  frames.push(
    frame(profile, "SENDER", {
      target: a.to,
      execution: 50_000n,
      state: 200_000n,
      value: a.value,
    }),
  );
  return assemble({
    sender: a.wallet,
    nonceSeq: a.nonce,
    maxFeePerGas: a.maxFeePerGas,
    signer: a.owner,
    frames,
  });
}

const ADD_STAKE_ABI = [
  {
    type: "function",
    name: "addStake",
    stateMutability: "payable",
    inputs: [{ type: "uint32" }],
    outputs: [],
  },
] as const;

/** Wallet stakes itself via SENDER → registry.addStake. */
export function buildStakeTx(a: {
  registry: Address;
  wallet: Address;
  owner: Address;
  amount: bigint;
  unstakeDelaySec: number;
  nonce: bigint;
  maxFeePerGas: bigint;
}): FrameTx {
  return assemble({
    sender: a.wallet,
    nonceSeq: a.nonce,
    maxFeePerGas: a.maxFeePerGas,
    signer: a.owner,
    frames: [
      frame(profile, "VERIFY", {
        scope: "EXECUTION_AND_PAYMENT",
        target: null,
        execution: 70_000n,
      }),
      frame(profile, "SENDER", {
        target: a.registry,
        execution: 150_000n,
        state: 300_000n,
        value: a.amount,
        data: encodeFunctionData({
          abi: ADD_STAKE_ABI,
          functionName: "addStake",
          args: [a.unstakeDelaySec],
        }),
      }),
    ],
  });
}

export async function signFrameTx(tx: FrameTx, privateKey: Hex) {
  return signTx(profile, tx, privateKey);
}

export function frameTxHash(tx: FrameTx): Hex {
  return txHash(profile, tx);
}

export function frameToWire(tx: FrameTx) {
  return toWire(tx);
}

export type { FrameTx };
