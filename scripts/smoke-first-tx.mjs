/**
 * Smoke: faucet (if needed) → self-relay Frame tx → explorer URL.
 * Run: node --experimental-strip-types  OR  npx tsx  — here we use compiled via next/node ESM from src via dynamic import after building isn't needed;
 * instead call the same helpers via a tiny inline reimplementation using hegota-support.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { getProfile } from "@forshtat/hegota-support/profiles";
import {
  frame,
  newTx,
  secp256k1Placeholder,
  signTx,
  txHash,
} from "@forshtat/hegota-support/tx";
import { toWire } from "@forshtat/hegota-support/rpc";

const GATEWAY = "https://altmempoolgateway.forshtat.com/rpc";
const CHAIN_ID = 1337;
const RECIPIENT = "0x8943545177806ED17B9F23F0a21ee5948eCaa776";
const EXPLORER = "https://explorer.altmempool.wtf";
const profile = getProfile("ethrex-eip8141-tracer");

async function rpc(method, params = []) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitMined(hash, timeoutSec = 120) {
  const deadline = Date.now() + timeoutSec * 1000;
  while (Date.now() < deadline) {
    const r = await rpc("eth_getTransactionReceipt", [hash]);
    if (r) return r;
    await sleep(2000);
  }
  throw new Error(`not mined: ${hash}`);
}

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);
console.log("address", account.address);

let bal = BigInt(await rpc("eth_getBalance", [account.address, "latest"]));
console.log("balance", bal.toString());
if (bal < 10n ** 17n) {
  const { txHash: faucetHash } = await rpc("skandha_explorer_faucet", [
    account.address,
  ]);
  console.log("faucet", faucetHash);
  await waitMined(faucetHash);
  bal = BigInt(await rpc("eth_getBalance", [account.address, "latest"]));
  console.log("balance after faucet", bal.toString());
}

const nonce = BigInt(
  await rpc("eth_getTransactionCount", [account.address, "latest"]),
);
const unsigned = newTx({
  chainId: CHAIN_ID,
  sender: account.address,
  nonceSeq: nonce,
  signatures: [secp256k1Placeholder(profile)],
  fees: { maxFeePerGas: 2_000_000_000n },
  frames: [
    frame(profile, "VERIFY", {
      scope: "EXECUTION_AND_PAYMENT",
      target: null,
      execution: 30_000n,
    }),
    frame(profile, "SENDER", {
      target: RECIPIENT,
      execution: 50_000n,
      state: 200_000n,
      value: 1_000_000_000n,
    }),
  ],
});
const signed = await signTx(profile, unsigned, pk);
const expected = txHash(profile, signed);
console.log("expected hash", expected);
const hash = await rpc("eth_sendFrameTransaction", [toWire(signed)]);
console.log("submitted", hash);
const receipt = await waitMined(hash);
console.log(
  JSON.stringify(
    {
      txHash: hash,
      status: receipt.status,
      block: Number(receipt.blockNumber),
      frames: receipt.frameReceipts?.length ?? 0,
      explorer: `${EXPLORER}/tx/${hash}`,
    },
    null,
    2,
  ),
);
