import { NextResponse } from "next/server";
import { bootstrapFirstAdmittedTx } from "@/lib/chain";
import { RpcError } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST() {
  try {
    const result = await bootstrapFirstAdmittedTx();
    // Do not return the private key to the browser in production demos;
    // keep address + explorer proof only for the UI.
    return NextResponse.json({
      ok: true,
      address: result.address,
      funded: result.funded,
      faucetTxHash: result.faucetTxHash,
      txHash: result.txHash,
      explorerUrl: result.explorerUrl,
      balanceWei: result.balanceWei,
      blockNumber: result.blockNumber,
      framesOk: result.framesOk,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const code = e instanceof RpcError ? e.code : "ERROR";
    return NextResponse.json({ ok: false, code, message }, { status: 502 });
  }
}
