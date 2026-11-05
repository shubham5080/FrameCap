import { NextResponse } from "next/server";
import type { Address } from "viem";
import { isAddress } from "viem";
import { config } from "@/lib/config";
import { formatStakeEth, getStakeInfo } from "@/lib/stake";
import { RpcError } from "@/lib/rpc";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("address") ?? "";
  if (!isAddress(raw)) {
    return NextResponse.json(
      { ok: false, message: "Pass ?address=0x… (valid checksum or hex address)" },
      { status: 400 },
    );
  }
  try {
    const info = await getStakeInfo(raw as Address);
    const minStakeWei = BigInt("10000000000000000"); // 0.01 ETH workshop floor
    return NextResponse.json({
      ok: true,
      address: raw,
      registry: config.stakingRegistry,
      amountWei: info.amountWei.toString(),
      amountEth: formatStakeEth(info.amountWei),
      unstakeDelaySec: info.unstakeDelaySec,
      withdrawTime: info.withdrawTime,
      isStaked: info.amountWei >= minStakeWei && info.withdrawTime === 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const code = e instanceof RpcError ? e.code : "ERROR";
    return NextResponse.json({ ok: false, code, message }, { status: 502 });
  }
}
