import { NextResponse } from "next/server";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getServiceSupabase } from "@/lib/supabase";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { count: totalLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    const startBerlin = dayjs().tz("Europe/Berlin").startOf("day").toISOString();
    const { count: leadsToday } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startBerlin);

    const { data: queueRows } = await supabase
      .from("scrape_queue")
      .select("status");

    const queueCounts: Record<string, number> = {};
    for (const r of queueRows ?? []) {
      const s = r.status as string;
      queueCounts[s] = (queueCounts[s] ?? 0) + 1;
    }
    const pending = queueCounts["pending"] ?? 0;

    const { data: runs } = await supabase
      .from("scraper_runs")
      .select("*")
      .eq("run_type", "scrape")
      .order("started_at", { ascending: false })
      .limit(20);

    let successRate = 0;
    if (runs?.length) {
      const added = runs.reduce((a, r) => a + (r.leads_added ?? 0), 0);
      const failed = runs.reduce((a, r) => a + (r.leads_failed ?? 0), 0);
      const denom = added + failed;
      successRate = denom > 0 ? Math.round((added / denom) * 1000) / 10 : 0;
    }

    const since14 = dayjs().subtract(13, "day").startOf("day").toISOString();
    const { data: leads14 } = await supabase
      .from("leads")
      .select("created_at")
      .gte("created_at", since14);

    const byDay: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      byDay[d] = 0;
    }
    for (const row of leads14 ?? []) {
      const d = dayjs(row.created_at).format("YYYY-MM-DD");
      if (d in byDay) byDay[d] += 1;
    }

    const chart = Object.entries(byDay).map(([date, count]) => ({
      date,
      count,
    }));

    const { data: recentLeads } = await supabase
      .from("leads")
      .select(
        "id, company_name, city, email, quality_issues, created_at, url"
      )
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: lastRun } = await supabase
      .from("scraper_runs")
      .select("started_at, finished_at, run_type")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: processingCount } = await supabase
      .from("scrape_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "processing");

    return NextResponse.json({
      totalLeads: totalLeads ?? 0,
      leadsToday: leadsToday ?? 0,
      queuePending: pending,
      queueCounts,
      successRate,
      chart14d: chart,
      recentLeads: recentLeads ?? [],
      lastRun,
      processingCount: processingCount ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
