import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { runDiscoveryJob } from "@/lib/cron/jobs";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = requireCronAuth(req);
  if (denied) return denied;

  const { status, body } = await runDiscoveryJob();
  return NextResponse.json(body, { status });
}
