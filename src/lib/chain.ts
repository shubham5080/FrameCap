import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { parseEther, type Address, type Hex } from "viem";
import { config, explorerTxUrl } from "./config";
import { rpc, RpcError } from "./rpc";
import {
  buildSelfRelayTx,
  frameToWire,
  frameTxHash,
  signFrameTx,
  type FrameTx,
} from "./hegota";
import { findFundedKey, rememberFundedKey } from "./wallet-bank";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type GatewayHealth = {
  ok: boolean;
  chainId: number;
  clientVersion: string | null;
  explorer: Record<string, unknown> | null;
  faucetEnabled: boolean;
  error?: string;
};

export async function probeGateway(): Promise<GatewayHealth> {
  try {
    const [chainHex, clientVersion, explorer] = await Promise.all([
      rpc<string>("eth_chainId"),
      rpc<string>("web3_clientVersion").catch(() => null),
      rpc<Record<string, unknown>>("skandha_explorer_info").catch(() => null),
    ]);
    const chainId = Number(chainHex);
    return {
      ok: chainId === config.chainId,
      chainId,
      clientVersion,
      explorer,
      faucetEnabled: Boolean(explorer?.faucetEnabled),
    };
  } catch (e) {
    return {
      ok: false,
      chainId: 0,
      clientVersion: null,
      explorer: null,
      faucetEnabled: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function getBalance(address: Address): Promise<bigint> {
  return BigInt(await rpc<string>("eth_getBalance", [address, "latest"]));
}

export async function getNonce(address: Address): Promise<bigint> {
  return BigInt(
    await rpc<string>("eth_getTransactionCount", [address, "latest"]),
  );
}

export async function fundFromFaucet(to: Address): Promise<Hex> {
  let result: { txHash: Hex };
  try {
    result = await rpc<{ txHash: Hex }>("skandha_explorer_faucet", [to]);
  } catch (e) {
    const msg = e instanceof RpcError ? e.message : String(e);
    throw new Error(`Faucet refused ${to}: ${msg}`);
  }
  const receipt = await waitMined(result.txHash);
  if (receipt.status !== "0x1") {
    throw new Error(`Funding transfer ${result.txHash} reverted`);
  }
  return result.txHash;
}

export function isFaucetEmptyError(message: string): boolean {
  return /faucet is empty|Faucet refused/i.test(message);
}

/**
 * Ensure an account can pay for Diff (deploy + stake).
 * Order: wallet bank → faucet → optional FRAMECAP_FUNDER_KEY.
 */
export async function ensureFundedPrivateKey(minWei: bigint): Promise<{
  privateKey: Hex;
  fundedVia: "faucet" | "wallet-bank" | "funder-key";
}> {
  // 1) Reuse a previously funded key if it still has ETH
  const recycled = await findFundedKey(minWei);
  if (recycled) {
    return { privateKey: recycled, fundedVia: "wallet-bank" };
  }

  // 2) Fresh key + faucet
  const fresh = generatePrivateKey();
  const account = privateKeyToAccount(fresh);

  try {
    await fundFromFaucet(account.address);
    const bal = await getBalance(account.address);
    if (bal >= minWei) {
      rememberFundedKey(fresh);
      return { privateKey: fresh, fundedVia: "faucet" };
    }
    throw new Error(
      `Faucet funded ${account.address} but balance ${bal} < ${minWei}`,
    );
  } catch (e) {
    const faucetMsg = e instanceof Error ? e.message : String(e);

    // 3) Optional funder key (app secret FRAMECAP_FUNDER_KEY)
    const funder =
      process.env.FRAMECAP_FUNDER_KEY?.trim() ||
      process.env.FRAMECAP_OWNER_KEY?.trim();
    if (funder && /^0x[0-9a-fA-F]{64}$/.test(funder)) {
      const funderKey = funder as Hex;
      const from = privateKeyToAccount(funderKey);
      const funderBal = await getBalance(from.address);
      if (funderBal > minWei + parseEther("0.01")) {
        const nonce = Number(
          await rpc<string>("eth_getTransactionCount", [
            from.address,
            "pending",
          ]),
        );
        const raw = await from.signTransaction({
          chainId: config.chainId,
          nonce,
          to: account.address,
          value: minWei,
          gas: 100_000n,
          gasPrice: 2_000_000n,
          type: "legacy",
        });
        const hash = await rpc<Hex>("eth_sendRawTransaction", [raw]);
        await waitMined(hash);
        rememberFundedKey(fresh);
        return { privateKey: fresh, fundedVia: "funder-key" };
      }
    }

    throw new Error(faucetMsg);
  }
}

export async function waitMined(
  hash: Hex,
  timeoutSec = config.txTimeoutSec,
): Promise<Record<string, unknown> & { status?: string; frameReceipts?: { status: string }[] }> {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const r = await rpc<
      | (Record<string, unknown> & {
          status?: string;
          frameReceipts?: { status: string }[];
        })
      | null
    >("eth_getTransactionReceipt", [hash]);
    if (r) return r;
    await sleep(2000);
  }
  throw new Error(`Transaction ${hash} not mined within ${timeoutSec}s`);
}

export async function sendFrameTx(tx: FrameTx): Promise<Hex> {
  return rpc<Hex>("eth_sendFrameTransaction", [frameToWire(tx)]);
}

export async function sendRawFrameTx(tx: FrameTx): Promise<Hex> {
  const { encodeTx } = await import("@forshtat/hegota-support/tx");
  const { profile } = await import("./hegota");
  const raw = encodeTx(profile, tx);
  return rpc<Hex>("eth_sendRawTransaction", [raw]);
}

export type FirstAdmittedResult = {
  address: Address;
  /** Only returned server-side for demo; never expose in public logs long-term. */
  privateKey: Hex;
  faucetTxHash: Hex | null;
  txHash: Hex;
  explorerUrl: string;
  funded: boolean;
  balanceWei: string;
  blockNumber: number | null;
  framesOk: number;
};

/** Create key, faucet if needed, send first self-relay Frame tx on alt mempool. */
export async function bootstrapFirstAdmittedTx(opts?: {
  privateKey?: Hex;
  recipient?: Address;
}): Promise<FirstAdmittedResult> {
  const privateKey = opts?.privateKey ?? generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  const recipient = (opts?.recipient ?? config.recipient) as Address;

  let funded = false;
  let faucetTxHash: Hex | null = null;
  let balance = await getBalance(account.address);
  if (balance < config.minBalanceWei) {
    faucetTxHash = await fundFromFaucet(account.address);
    balance = await getBalance(account.address);
    funded = true;
  }

  const nonce = await getNonce(account.address);
  const unsigned = buildSelfRelayTx({
    from: account.address,
    to: recipient,
    value: config.transferWei,
    nonce,
    maxFeePerGas: config.maxFeePerGasWei,
  });
  const signed = await signFrameTx(unsigned, privateKey);
  const expectedHash = frameTxHash(signed);
  const txHash = await sendFrameTx(signed);
  const receipt = await waitMined(txHash);
  const framesOk = (receipt.frameReceipts ?? []).filter(
    (f) => f.status === "0x1",
  ).length;
  if (receipt.status !== "0x1") {
    throw new Error(`Frame tx ${txHash} mined but reverted`);
  }

  return {
    address: account.address,
    privateKey,
    faucetTxHash,
    txHash: txHash || expectedHash,
    explorerUrl: explorerTxUrl(txHash),
    funded,
    balanceWei: balance.toString(),
    blockNumber: receipt.blockNumber
      ? Number(receipt.blockNumber)
      : null,
    framesOk,
  };
}

export { config };
