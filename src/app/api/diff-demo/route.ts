import { NextResponse } from "next/server";
import { runDiffDemo } from "@/lib/deploy";
import { RpcError } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    let dailyLimitEth: string | number | undefined;
    let dailyLimitGwei: number | undefined;
    try {
      const body = (await request.json()) as {
        dailyLimitEth?: unknown;
        dailyLimitGwei?: unknown;
      };
      if (typeof body.dailyLimitEth === "number" || typeof body.dailyLimitEth === "string") {
        dailyLimitEth = body.dailyLimitEth;
      }
      if (typeof body.dailyLimitGwei === "number") {
        dailyLimitGwei = body.dailyLimitGwei;
      } else if (typeof body.dailyLimitGwei === "string") {
        dailyLimitGwei = Number(body.dailyLimitGwei);
      }
    } catch {
      // empty body is fine — demo uses default 0.001 ETH
    }
    const result = await runDiffDemo({ dailyLimitEth, dailyLimitGwei });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const code = e instanceof RpcError ? e.code : "ERROR";
    console.error("diff-demo failed", e);
    return NextResponse.json({ ok: false, code, message }, { status: 502 });
  }
}
