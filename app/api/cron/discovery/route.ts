import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { discoverUrls } from "@/lib/scraper/discovery";
import { requireCronAuth } from "@/lib/cron-auth";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = requireCronAuth(req);
  if (denied) return denied;

  const supabase = getServiceSupabase();
  const runStart = Date.now();

  const { data: run, error: runErr } = await supabase
    .from("scraper_runs")
    .insert({ run_type: "discovery" })
    .select("id")
    .single();

  if (runErr || !run) {
    return NextResponse.json(
      { error: "Run konnte nicht gestartet werden", detail: runErr?.message },
      { status: 500 }
    );
  }

  try {
    const { urlsQueued } = await discoverUrls(supabase, 500);

    await supabase
      .from("scraper_runs")
      .update({
        finished_at: new Date().toISOString(),
        urls_found: urlsQueued,
      })
      .eq("id", run.id);

    return NextResponse.json({
      ok: true,
      urls_found: urlsQueued,
      duration_ms: Date.now() - runStart,
    });
  } catch (e) {
    await supabase
      .from("scraper_runs")
      .update({
        finished_at: new Date().toISOString(),
        urls_found: 0,
      })
      .eq("id", run.id);

    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
