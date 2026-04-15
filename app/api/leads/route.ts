import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10))
    );
    const offset = (page - 1) * limit;
    const city = searchParams.get("city")?.trim();
    const q = searchParams.get("q")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const onlyUnexported = searchParams.get("onlyUnexported") === "true";
    const idsParam = searchParams.get("ids");

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (city) query = query.ilike("city", `%${city}%`);
    if (onlyUnexported) query = query.is("exported_at", null);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo);
    if (q) {
      const safe = q.replace(/,/g, " ");
      const term = `%${safe}%`;
      query = query.or(
        `company_name.ilike.${term},email.ilike.${term},city.ilike.${term}`
      );
    }
    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length) query = query.in("id", ids);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      leads: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id fehlt" }, { status: 400 });
    }

    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
