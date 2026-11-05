import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import {
  encodeDeployData,
  encodeFunctionData,
  parseEther,
} from "viem";
import { getProfile } from "@forshtat/hegota-support/profiles";
import {
  frame,
  newTx,
  secp256k1Placeholder,
  signTx,
  encodeTx,
} from "@forshtat/hegota-support/tx";
import { toWire } from "@forshtat/hegota-support/rpc";
import fs from "node:fs";

const GATEWAY = "https://altmempoolgateway.forshtat.com/rpc";
const profile = getProfile("ethrex-eip8141-tracer");
const REGISTRY = "0xd51c04d7a0b01124e84de152f4e56d9eecb22d2f";
const RECIPIENT = "0x8943545177806ED17B9F23F0a21ee5948eCaa776";

async function rpc(method, params = []) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) {
    const err = new Error(body.error.message);
    err.code = body.error.code;
    err.data = body.error.data;
    throw err;
  }
  return body.result;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitMined(hash) {
  for (let i = 0; i < 60; i++) {
    const r = await rpc("eth_getTransactionReceipt", [hash]);
    if (r) return r;
    await sleep(2000);
  }
  throw new Error("not mined " + hash);
}

const ledgerArt = JSON.parse(
  fs.readFileSync("contracts/artifacts/QuotaLedger.json", "utf8"),
);
const walletArt = JSON.parse(
  fs.readFileSync("contracts/artifacts/QuotaWallet.json", "utf8"),
);

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);
console.log("owner", account.address);

await rpc("skandha_explorer_faucet", [account.address]).then((r) =>
  waitMined(r.txHash),
);

async function legacy(data, value = 0n, gas = 6_000_000n) {
  const nonce = Number(
    await rpc("eth_getTransactionCount", [account.address, "pending"]),
  );
  const raw = await account.signTransaction({
    chainId: 1337,
    nonce,
    to: null,
    value,
    data,
    gas,
    gasPrice: 2_000_000n,
    type: "legacy",
  });
  const hash = await rpc("eth_sendRawTransaction", [raw]);
  const receipt = await waitMined(hash);
  console.log("deploy status", receipt.status, receipt.contractAddress);
  return receipt.contractAddress;
}

const ledger = await legacy(
  encodeDeployData({
    abi: ledgerArt.abi,
    bytecode: ledgerArt.bytecode,
    args: [],
  }),
);
const wallet = await legacy(
  encodeDeployData({
    abi: walletArt.abi,
    bytecode: walletArt.bytecode,
    args: [account.address, ledger],
  }),
  parseEther("0.05"),
);
console.log({ ledger, wallet });

const setData = encodeFunctionData({
  abi: ledgerArt.abi,
  functionName: "setDailyLimit",
  args: [wallet, 5_000_000_000n],
});
{
  const nonce = Number(
    await rpc("eth_getTransactionCount", [account.address, "pending"]),
  );
  const raw = await account.signTransaction({
    chainId: 1337,
    nonce,
    to: ledger,
    data: setData,
    gas: 500_000n,
    gasPrice: 2_000_000n,
    type: "legacy",
  });
  const hash = await rpc("eth_sendRawTransaction", [raw]);
  const receipt = await waitMined(hash);
  console.log("setDailyLimit", receipt.status);
}

const rem = await rpc("eth_call", [
  {
    to: ledger,
    data: encodeFunctionData({
      abi: ledgerArt.abi,
      functionName: "remaining",
      args: [wallet],
    }),
  },
  "latest",
]);
console.log("remaining eth_call", rem, BigInt(rem).toString());

const nonce = BigInt(
  await rpc("eth_getTransactionCount", [wallet, "latest"]),
);
const requested = 1_000_000_000n;
const verifyData = `0x${requested.toString(16).padStart(32, "0")}`;
const unsigned = newTx({
  chainId: 1337,
  sender: wallet,
  nonceSeq: nonce,
  signatures: [secp256k1Placeholder(profile, account.address)],
  fees: { maxFeePerGas: 2_000_000_000n },
  frames: [
    frame(profile, "VERIFY", {
      scope: "EXECUTION_AND_PAYMENT",
      target: null,
      execution: 70_000n,
      data: verifyData,
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

console.log("\n--- canonical eth_sendRawTransaction ---");
try {
  const raw = encodeTx(profile, signed);
  console.log(await rpc("eth_sendRawTransaction", [raw]));
} catch (e) {
  console.log("REJECT", e.message);
}

console.log("\n--- alt eth_sendFrameTransaction ---");
try {
  console.log(await rpc("eth_sendFrameTransaction", [toWire(signed)]));
} catch (e) {
  console.log("REJECT", e.message);
}
