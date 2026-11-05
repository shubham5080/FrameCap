import { NextResponse } from "next/server";
import { probeGateway } from "@/lib/chain";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await probeGateway();
  return NextResponse.json({
    ...health,
    config: {
      gatewayUrl: config.gatewayUrl,
      explorerUrl: config.explorerUrl,
      profileId: config.profileId,
      stakingRegistry: config.stakingRegistry,
    },
  });
}
