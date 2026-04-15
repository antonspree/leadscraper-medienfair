import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

function csvEscape(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(req.url);
    const onlyNew = searchParams.get("only_new") === "true";
    const idsParam = searchParams.get("ids");

    let query = supabase.from("leads").select("*").order("created_at", {
      ascending: false,
    });

    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length) query = query.in("id", ids);
    } else if (onlyNew) {
      query = query.is("exported_at", null);
    }

    const { data: leads, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      "Company Name",
      "URL",
      "First Name",
      "Last Name",
      "Title",
      "Contact Email",
      "Contact Phone",
      "Contact Position",
      "Address 1",
      "City",
      "State",
      "Zip",
      "Country",
      "Branche",
    ];

    const rows =
      leads?.map((l) => {
        const phoneCell =
          l.phone != null && l.phone !== ""
            ? `'${String(l.phone).replace(/"/g, '""')}`
            : "";
        return [
          csvEscape(l.company_name),
          csvEscape(l.url),
          csvEscape(l.first_name),
          csvEscape(l.last_name),
          csvEscape(l.title),
          csvEscape(l.email),
          phoneCell ? `"${phoneCell}"` : '""',
          csvEscape(l.position),
          csvEscape(l.address),
          csvEscape(l.city),
          csvEscape(l.state),
          csvEscape(l.zip),
          csvEscape(l.country),
          csvEscape(l.branche),
        ].join(",");
      }) ?? [];

    const csv = [headers.join(","), ...rows].join("\n");

    const exportedIds = leads?.map((l) => l.id) ?? [];

    if (onlyNew && exportedIds.length > 0) {
      await supabase.from("leads").update({ exported_at: new Date().toISOString() }).in("id", exportedIds);
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
