import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const list = new URL(req.url).searchParams.get("list");

    if (list === "1") {
      const limit = Math.min(
        200,
        Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "80", 10))
      );
      const { data: items, error } = await supabase
        .from("scrape_queue")
        .select("id, url, source, city, status, created_at, error_msg")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ items: items ?? [] });
    }

    const { data: rows, error } = await supabase
      .from("scrape_queue")
      .select("status");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {
      pending: 0,
      processing: 0,
      done: 0,
      failed: 0,
      duplicate: 0,
      quality_fail: 0,
      too_new: 0,
    };

    for (const r of rows ?? []) {
      const s = r.status as string;
      counts[s] = (counts[s] ?? 0) + 1;
    }

    const { count: total } = await supabase
      .from("scrape_queue")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      counts,
      total: total ?? rows?.length ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json({ error: "url fehlt" }, { status: 400 });
    }

    let normalized = url;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    const { error } = await supabase.from("scrape_queue").insert({
      url: normalized,
      source: "manual",
      status: "pending",
    });

    if (error?.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
