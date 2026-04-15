import { getServiceSupabase } from "@/lib/supabase";
import { discoverUrls } from "@/lib/scraper/discovery";
import { checkWebsiteQuality } from "@/lib/scraper/quality-check";
import { findImpressum, fetchImpressum } from "@/lib/scraper/impressum";
import { extractFromImpressum } from "@/lib/scraper/extractor";
import { discoveryMaxUrls, scrapeBatchSize, scrapeMaxRuntimeMs } from "@/lib/cron/config";

export async function runDiscoveryJob(): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  const supabase = getServiceSupabase();
  const runStart = Date.now();

  const { data: run, error: runErr } = await supabase
    .from("scraper_runs")
    .insert({ run_type: "discovery" })
    .select("id")
    .single();

  if (runErr || !run) {
    return {
      status: 500,
      body: {
        error: "Run konnte nicht gestartet werden",
        detail: runErr?.message,
      },
    };
  }

  try {
    const { urlsQueued } = await discoverUrls(supabase, discoveryMaxUrls());

    await supabase
      .from("scraper_runs")
      .update({
        finished_at: new Date().toISOString(),
        urls_found: urlsQueued,
      })
      .eq("id", run.id);

    return {
      status: 200,
      body: {
        ok: true,
        urls_found: urlsQueued,
        duration_ms: Date.now() - runStart,
      },
    };
  } catch (e) {
    await supabase
      .from("scraper_runs")
      .update({
        finished_at: new Date().toISOString(),
        urls_found: 0,
      })
      .eq("id", run.id);

    return {
      status: 500,
      body: { ok: false, error: String(e) },
    };
  }
}

export async function runScrapeJob(): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  const supabase = getServiceSupabase();
  const runStart = Date.now();
  const MAX_RUNTIME_MS = scrapeMaxRuntimeMs();
  const BATCH_SIZE = scrapeBatchSize();

  let leadsAdded = 0;
  let leadsFailed = 0;
  let urlsQualified = 0;

  const { data: run, error: runErr } = await supabase
    .from("scraper_runs")
    .insert({ run_type: "scrape" })
    .select("id")
    .single();

  if (runErr || !run) {
    return {
      status: 500,
      body: {
        error: "Run konnte nicht gestartet werden",
        detail: runErr?.message,
      },
    };
  }

  while (Date.now() - runStart < MAX_RUNTIME_MS) {
    const { data: items } = await supabase
      .from("scrape_queue")
      .select("id, url")
      .eq("status", "pending")
      .limit(BATCH_SIZE);

    if (!items?.length) break;

    await supabase
      .from("scrape_queue")
      .update({ status: "processing" })
      .in(
        "id",
        items.map((i) => i.id)
      );

    await Promise.allSettled(
      items.map(async (item) => {
        try {
          const { data: existing } = await supabase
            .from("leads")
            .select("id")
            .eq("url", item.url)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("scrape_queue")
              .update({
                status: "duplicate",
                processed_at: new Date().toISOString(),
              })
              .eq("id", item.id);
            return;
          }

          const quality = await checkWebsiteQuality(item.url);

          if (!quality.passes) {
            await supabase
              .from("scrape_queue")
              .update({
                status: "quality_fail",
                processed_at: new Date().toISOString(),
                error_msg: quality.issues.join(", "),
              })
              .eq("id", item.id);
            return;
          }

          urlsQualified += 1;

          const impressumUrl = await findImpressum(item.url);
          if (!impressumUrl) {
            await supabase
              .from("scrape_queue")
              .update({
                status: "failed",
                processed_at: new Date().toISOString(),
                error_msg: "Impressum nicht gefunden",
              })
              .eq("id", item.id);
            leadsFailed += 1;
            return;
          }

          const impressumText = await fetchImpressum(impressumUrl);
          const extracted = await extractFromImpressum(impressumText);

          if (!extracted) {
            await supabase
              .from("scrape_queue")
              .update({
                status: "failed",
                processed_at: new Date().toISOString(),
                error_msg: "Extraktion fehlgeschlagen",
              })
              .eq("id", item.id);
            leadsFailed += 1;
            return;
          }

          const { error: insErr } = await supabase.from("leads").insert({
            company_name: extracted.company_name,
            first_name: extracted.first_name,
            last_name: extracted.last_name,
            title: extracted.title,
            email: extracted.email,
            phone: extracted.phone,
            position: extracted.position,
            address: extracted.address,
            city: extracted.city,
            state: extracted.state,
            zip: extracted.zip,
            country: "Deutschland",
            branche:
              extracted.branche ??
              "Sanitär-, Heizungs- und Klimatechnik (SHK)",
            url: item.url,
            quality_issues: quality.issues,
            source_url: impressumUrl,
            website_age_years: quality.website_age_years,
          });

          if (insErr) {
            await supabase
              .from("scrape_queue")
              .update({
                status: "failed",
                processed_at: new Date().toISOString(),
                error_msg: insErr.message,
              })
              .eq("id", item.id);
            leadsFailed += 1;
            return;
          }

          await supabase
            .from("scrape_queue")
            .update({
              status: "done",
              processed_at: new Date().toISOString(),
            })
            .eq("id", item.id);

          leadsAdded += 1;
        } catch (err) {
          await supabase
            .from("scrape_queue")
            .update({
              status: "failed",
              processed_at: new Date().toISOString(),
              error_msg: String(err),
            })
            .eq("id", item.id);
          leadsFailed += 1;
        }
      })
    );
  }

  await supabase
    .from("scraper_runs")
    .update({
      finished_at: new Date().toISOString(),
      leads_added: leadsAdded,
      leads_failed: leadsFailed,
      urls_qualified: urlsQualified,
    })
    .eq("id", run.id);

  return {
    status: 200,
    body: {
      ok: true,
      leads_added: leadsAdded,
      leads_failed: leadsFailed,
      duration_ms: Date.now() - runStart,
    },
  };
}
