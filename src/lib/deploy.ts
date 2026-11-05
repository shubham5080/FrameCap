import fs from "node:fs";
import path from "node:path";
import {
  encodeDeployData,
  encodeFunctionData,
  type Abi,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { parseEther } from "viem";
import { config } from "./config";
import { rpc } from "./rpc";
import {
  fundFromFaucet,
  getBalance,
  getNonce,
  sendFrameTx,
  waitMined,
} from "./chain";
import {
  buildStakeTx,
  buildWalletTx,
  frameTxHash,
  signFrameTx,
} from "./hegota";

const DEPLOY_GAS = 6_000_000n;
const LEGACY_GAS_PRICE = 2_000_000n; // 0.002 gwei

type Artifact = { abi: Abi; bytecode: Hex };

function loadArtifact(name: "QuotaLedger" | "QuotaWallet"): Artifact {
  const file = path.join(
    process.cwd(),
    "contracts",
    "artifacts",
    `${name}.json`,
  );
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as Artifact;
  return raw;
}

async function sendLegacy(
  privateKey: Hex,
  tx: { to: Address | null; value?: bigint; data?: Hex; gas?: bigint },
): Promise<Hex> {
  const account = privateKeyToAccount(privateKey);
  const nonce = Number(
    await rpc<string>("eth_getTransactionCount", [
      account.address,
      "pending",
    ]),
  );
  const raw = await account.signTransaction({
    chainId: config.chainId,
    nonce,
    to: tx.to,
    value: tx.value ?? 0n,
    data: tx.data ?? "0x",
    gas: tx.gas ?? 250_000n,
    gasPrice: LEGACY_GAS_PRICE,
    type: "legacy",
  });
  return rpc<Hex>("eth_sendRawTransaction", [raw]);
}

async function deployContract(
  privateKey: Hex,
  name: "QuotaLedger" | "QuotaWallet",
  args: unknown[] = [],
  value = 0n,
): Promise<Address> {
  const { abi, bytecode } = loadArtifact(name);
  const data = encodeDeployData({ abi, bytecode, args });
  const hash = await sendLegacy(privateKey, {
    to: null,
    data,
    value,
    gas: DEPLOY_GAS,
  });
  const receipt = await waitMined(hash);
  if (receipt.status !== "0x1" || !receipt.contractAddress) {
    throw new Error(`Deploy ${name} failed: ${hash}`);
  }
  return receipt.contractAddress as Address;
}

export type MempoolVerdict = {
  accepted: boolean;
  message?: string;
  rule?: string;
};

async function attemptSend(
  send: () => Promise<unknown>,
): Promise<MempoolVerdict & { txHash?: Hex }> {
  try {
    const txHash = (await send()) as Hex | undefined;
    return {
      accepted: true,
      txHash: typeof txHash === "string" ? txHash : undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    let rule = "UNKNOWN";
    if (/StorageReadNonSender/i.test(message)) rule = "STO";
    else if (/unstaked/i.test(message)) rule = "STO";
    else if (/BannedOpcode/i.test(message)) rule = "OP-011";
    else if (/OverQuota|0xf11d2a44/i.test(message)) rule = "QUOTA";
    return { accepted: false, message, rule };
  }
}

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

async function getStake(address: Address): Promise<bigint> {
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
  if (body.length < 64) return 0n;
  return BigInt(`0x${body.slice(0, 64)}`);
}

export type DiffDemoResult = {
  owner: Address;
  ledger: Address;
  wallet: Address;
  dailyLimitWei: string;
  quotaProbe: Hex;
  canonical: MempoolVerdict;
  altBeforeStake: MempoolVerdict;
  stakeTxHash: Hex;
  stakeAmountWei: string;
  altAfterStake: MempoolVerdict & { txHash?: Hex; explorerUrl?: string };
  overQuota: MempoolVerdict;
  explorerBase: string;
};

/** Full FrameCap spine: deploy → set quota → canonical ❌ → alt unstaked ❌ → stake → alt ✅ → over-quota ❌ */
export async function runDiffDemo(opts?: {
  dailyLimitGwei?: number;
}): Promise<DiffDemoResult> {
  const privateKey = generatePrivateKey();
  const owner = privateKeyToAccount(privateKey);
  const stakeWei = parseEther(config.stakeEth);
  const limitGwei =
    opts?.dailyLimitGwei && opts.dailyLimitGwei > 0
      ? opts.dailyLimitGwei
      : 5;

  let bal = await getBalance(owner.address);
  if (bal < config.minBalanceWei) {
    await fundFromFaucet(owner.address);
    bal = await getBalance(owner.address);
  }

  const ledger = await deployContract(privateKey, "QuotaLedger");
  // Fund wallet creation value so it can stake + pay gas later.
  const wallet = await deployContract(
    privateKey,
    "QuotaWallet",
    [owner.address, ledger],
    parseEther("0.05"),
  );

  const dailyLimit = BigInt(Math.floor(limitGwei)) * 1_000_000_000n;
  const setData = encodeFunctionData({
    abi: loadArtifact("QuotaLedger").abi,
    functionName: "setDailyLimit",
    args: [wallet, dailyLimit],
  });
  const setHash = await sendLegacy(privateKey, {
    to: ledger,
    data: setData,
    gas: 500_000n,
  });
  const setReceipt = await waitMined(setHash);
  if (setReceipt.status !== "0x1") {
    throw new Error(`setDailyLimit reverted: ${setHash}`);
  }

  // Probe: ask for 1 gwei spend via VERIFY data (16-byte uint128).
  const requested = 1_000_000_000n;
  const quotaProbe =
    `0x${requested.toString(16).padStart(32, "0")}` as Hex;

  const buildProbe = async (spendWei: bigint) => {
    const nonce = await getNonce(wallet);
    return signFrameTx(
      buildWalletTx({
        wallet,
        owner: owner.address,
        to: config.recipient,
        value: config.transferWei,
        nonce,
        maxFeePerGas: config.maxFeePerGasWei,
        verifyData: quotaProbe,
        ledger,
        spendWei,
      }),
      privateKey,
    );
  };

  // Pre-stake probe: VERIFY foreign read only (no recordSpend) so we isolate admission.
  const probe1 = await signFrameTx(
    buildWalletTx({
      wallet,
      owner: owner.address,
      to: config.recipient,
      value: config.transferWei,
      nonce: await getNonce(wallet),
      maxFeePerGas: config.maxFeePerGasWei,
      verifyData: quotaProbe,
    }),
    privateKey,
  );

  const canonical = await attemptSend(async () => {
    const { encodeTx } = await import("@forshtat/hegota-support/tx");
    const { profile } = await import("./hegota");
    const raw = encodeTx(profile, probe1);
    await rpc("eth_sendRawTransaction", [raw]);
  });

  const altBeforeStake = await attemptSend(() => sendFrameTx(probe1));
  // Live gateway may admit unstaked STO; if it does, wait so the nonce clears before stake.
  if (altBeforeStake.accepted && altBeforeStake.txHash) {
    await waitMined(altBeforeStake.txHash);
  }

  // Stake (clean VERIFY — empty data)
  const stakeTx = await signFrameTx(
    buildStakeTx({
      registry: config.stakingRegistry,
      wallet,
      owner: owner.address,
      amount: stakeWei,
      unstakeDelaySec: config.unstakeDelaySec,
      nonce: await getNonce(wallet),
      maxFeePerGas: config.maxFeePerGasWei,
    }),
    privateKey,
  );
  const stakeTxHash = await sendFrameTx(stakeTx);
  await waitMined(stakeTxHash);
  const stakeAmountWei = (await getStake(wallet)).toString();

  // After stake: admit + persist spend via ledger.recordSpend in a SENDER frame.
  const probe2 = await buildProbe(requested);
  let altAfterStake: DiffDemoResult["altAfterStake"];
  try {
    const txHash = await sendFrameTx(probe2);
    await waitMined(txHash);
    altAfterStake = {
      accepted: true,
      txHash,
      explorerUrl: `${config.explorerUrl.replace(/\/$/, "")}/tx/${txHash}`,
    };
  } catch (e) {
    altAfterStake = {
      accepted: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }

  // Over-quota: request more than remaining (limit 5 gwei, already spent 1)
  const overRequest = dailyLimit; // always above remaining after the 1 gwei spend
  const overData = `0x${overRequest.toString(16).padStart(32, "0")}` as Hex;
  const overTx = await signFrameTx(
    buildWalletTx({
      wallet,
      owner: owner.address,
      to: config.recipient,
      value: config.transferWei,
      nonce: await getNonce(wallet),
      maxFeePerGas: config.maxFeePerGasWei,
      verifyData: overData,
      ledger,
      spendWei: overRequest,
    }),
    privateKey,
  );
  const overQuota = await attemptSend(() => sendFrameTx(overTx));

  return {
    owner: owner.address,
    ledger,
    wallet,
    dailyLimitWei: dailyLimit.toString(),
    quotaProbe,
    canonical,
    altBeforeStake,
    stakeTxHash,
    stakeAmountWei,
    altAfterStake,
    overQuota,
    explorerBase: config.explorerUrl,
  };
}

export { frameTxHash };
