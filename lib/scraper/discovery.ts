import type { SupabaseClient } from "@supabase/supabase-js";
import { createHostThrottler } from "@/lib/utils/rate-limit";
import staedteRaw from "@/lib/data/staedte.json";

export const SUCHBEGRIFFE = [
  "Sanitär Heizung",
  "Klempner",
  "Heizungsbauer",
  "SHK Betrieb",
  "Installateur Heizung",
];

export const STAEDTE = staedteRaw as string[];

function normalizeUrl(u: string): string {
  try {
    const x = new URL(u);
    x.hash = "";
    x.search = "";
    let out = x.href;
    if (out.endsWith("/")) out = out.slice(0, -1);
    return out;
  } catch {
    return u.trim();
  }
}

/** Keine Verzeichnisse, Portale, CDNs, Ads, Consent-Loader — nur echte Firmen-Webauftritte. */
const BLOCKED_HOST_FRAGMENTS = [
  "gelbeseiten.de",
  "dasoertliche.de",
  "cylex.de",
  "yelp.de",
  "facebook.com",
  "instagram.com",
  "google.com",
  "linkedin.com",
  "xing.com",
  "google.de",
  "wikipedia.org",
  "youtube.com",
  "consentmanager",
  "cookiebot.com",
  "onetrust.com",
  "doubleclick.net",
  "googlesyndication.com",
  "googleadservices.com",
  "pubads.g.doubleclick",
  "pagead2.googlesyndication",
  "amazon-adsystem.com",
  "adnxs.com",
  "outbrain.com",
  "taboola.com",
  "t-online.de",
  "golocal.de",
  "dastelefonbuch.de",
  "telefonbuch.de",
  "11880.de",
  "11880.com",
  "klicktel.de",
  "dtme.de",
  "h5v.eu",
  "oertliche.h5v",
  "whatsapp.com",
  "wa.me",
  "maps.google",
  "gstatic.com",
  "googleapis.com",
  "schema.org",
  "w3.org",
  "twitter.com",
  "x.com",
  "pinterest.",
  "tiktok.com",
  "bing.com",
  "yahoo.com",
  "amazon.de",
  "ebay.de",
  "paypal.com",
  "stripe.com",
  "trustarc.com",
  "usercentrics.eu",
];

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/i.test(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOST_FRAGMENTS.some((b) => host.includes(b))) return false;
    if (host.split(".").length < 2) return false;
    const path = parsed.pathname.toLowerCase();
    if (path.includes("/delivery/cmp") || path.includes("consentmanager.net")) return false;
    return true;
  } catch {
    return false;
  }
}

async function scrapeGelbeSeiten(
  begriff: string,
  stadt: string,
  fetchT: typeof fetch
): Promise<string[]> {
  const url = `https://www.gelbeseiten.de/suche/${encodeURIComponent(begriff)}/${encodeURIComponent(stadt)}`;

  try {
    const res = await fetchT(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });

    const html = await res.text();
    const websiteRegex =
      /href="(https?:\/\/(?!www\.gelbeseiten)[^"]+)"[^>]*>.*?Webseite/g;
    const urls: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = websiteRegex.exec(html)) !== null) {
      const cleanUrl = match[1].split("?")[0];
      if (isValidUrl(cleanUrl)) urls.push(normalizeUrl(cleanUrl));
    }

    return Array.from(new Set(urls));
  } catch {
    return [];
  }
}

/** Links zu externen Webseiten aus Trefferlisten heuristisch extrahieren. */
function extractExternalSiteUrls(html: string, domainMustNotInclude: string): string[] {
  const urls: string[] = [];
  const re = /href="(https?:\/\/[^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const u = m[1].split(/[?#]/)[0];
    if (!u || !isValidUrl(u)) continue;
    try {
      const h = new URL(u).hostname.toLowerCase();
      if (h.includes(domainMustNotInclude)) continue;
    } catch {
      continue;
    }
    urls.push(normalizeUrl(u));
  }
  return Array.from(new Set(urls)).slice(0, 80);
}

async function scrapeDasOertliche(
  begriff: string,
  stadt: string,
  fetchT: typeof fetch
): Promise<string[]> {
  const url = `https://www.dasoertliche.de/?form_name=search_nat&b=${encodeURIComponent(begriff)}&c=${encodeURIComponent(stadt)}`;
  try {
    const res = await fetchT(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    return extractExternalSiteUrls(html, "dasoertliche");
  } catch {
    return [];
  }
}

async function scrapeCylex(
  begriff: string,
  stadt: string,
  fetchT: typeof fetch
): Promise<string[]> {
  const url = `https://www.cylex.de/suche?what=${encodeURIComponent(begriff)}&where=${encodeURIComponent(stadt)}`;
  try {
    const res = await fetchT(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    return extractExternalSiteUrls(html, "cylex");
  } catch {
    return [];
  }
}

async function insertQueueUrl(
  supabase: SupabaseClient,
  url: string,
  source: "gelbeseiten" | "dasoertliche" | "cylex",
  city: string
): Promise<boolean> {
  const { error } = await supabase.from("scrape_queue").insert({
    url: normalizeUrl(url),
    source,
    city,
    status: "pending",
  });
  if (error?.code === "23505") return false;
  if (error) {
    console.error("queue insert", error.message);
    return false;
  }
  return true;
}

export async function discoverUrls(
  supabase: SupabaseClient,
  maxPerRun = 500
): Promise<{ urlsQueued: number; termIndex: number; cityIndex: number }> {
  const fetchT = createHostThrottler();

  const { data: stateRow, error: stateErr } = await supabase
    .from("discovery_state")
    .select("term_index, city_index")
    .eq("id", 1)
    .single();

  let termIndex = stateRow?.term_index ?? 0;
  let cityIndex = stateRow?.city_index ?? 0;
  if (stateErr) {
    termIndex = 0;
    cityIndex = 0;
  }

  if (termIndex >= SUCHBEGRIFFE.length) termIndex = 0;
  if (cityIndex >= STAEDTE.length) cityIndex = 0;

  let urlsQueued = 0;
  const maxSteps = Math.min(5000, Math.max(800, maxPerRun * 3));
  let steps = 0;

  while (urlsQueued < maxPerRun && steps < maxSteps) {
    steps += 1;
    const begriff = SUCHBEGRIFFE[termIndex % SUCHBEGRIFFE.length];
    const stadt = STAEDTE[cityIndex % STAEDTE.length];

    const [g, d, c] = await Promise.all([
      scrapeGelbeSeiten(begriff, stadt, fetchT),
      scrapeDasOertliche(begriff, stadt, fetchT),
      scrapeCylex(begriff, stadt, fetchT),
    ]);

    const batches: { url: string; source: "gelbeseiten" | "dasoertliche" | "cylex" }[] = [
      ...g.map((url) => ({ url, source: "gelbeseiten" as const })),
      ...d.map((url) => ({ url, source: "dasoertliche" as const })),
      ...c.map((url) => ({ url, source: "cylex" as const })),
    ];

    for (const item of batches) {
      if (urlsQueued >= maxPerRun) break;
      if (!isValidUrl(item.url)) continue;
      const ok = await insertQueueUrl(supabase, item.url, item.source, stadt);
      if (ok) urlsQueued++;
    }

    cityIndex += 1;
    if (cityIndex >= STAEDTE.length) {
      cityIndex = 0;
      termIndex += 1;
      if (termIndex >= SUCHBEGRIFFE.length) {
        termIndex = 0;
      }
    }

    await supabase
      .from("discovery_state")
      .upsert(
        {
          id: 1,
          term_index: termIndex,
          city_index: cityIndex,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
  }

  return { urlsQueued, termIndex, cityIndex };
}
