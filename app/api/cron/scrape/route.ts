import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { runScrapeJob } from "@/lib/cron/jobs";

/** Vercel Hobby: max. 60 s. Für längere Läufe Vercel Pro + Wert hier auf 300 erhöhen. */
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = requireCronAuth(req);
  if (denied) return denied;

  const { status, body } = await runScrapeJob();
  return NextResponse.json(body, { status });
}
