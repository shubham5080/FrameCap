import { NextResponse } from "next/server";
import { runDiffDemo } from "@/lib/deploy";
import { RpcError } from "@/lib/rpc";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    let dailyLimitGwei: number | undefined;
    try {
      const body = (await request.json()) as { dailyLimitGwei?: unknown };
      if (typeof body.dailyLimitGwei === "number") {
        dailyLimitGwei = body.dailyLimitGwei;
      } else if (typeof body.dailyLimitGwei === "string") {
        dailyLimitGwei = Number(body.dailyLimitGwei);
      }
    } catch {
      // empty body is fine — demo uses default 5 gwei
    }
    const result = await runDiffDemo({ dailyLimitGwei });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const code = e instanceof RpcError ? e.code : "ERROR";
    console.error("diff-demo failed", e);
    return NextResponse.json({ ok: false, code, message }, { status: 502 });
  }
}
