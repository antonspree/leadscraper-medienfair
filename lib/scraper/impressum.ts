import { createHostThrottler } from "@/lib/utils/rate-limit";

const IMPRESSUM_PFADE = [
  "/impressum",
  "/impressum.html",
  "/impressum.htm",
  "/de/impressum",
  "/ueber-uns/impressum",
  "/recht/impressum",
  "/rechtliches/impressum",
  "/info/impressum",
  "/kontakt/impressum",
  "/datenschutz-impressum",
];

const fetchThrottled = createHostThrottler();

export async function findImpressum(baseUrl: string): Promise<string | null> {
  const base = new URL(baseUrl).origin;

  for (const pfad of IMPRESSUM_PFADE) {
    try {
      const res = await fetchThrottled(base + pfad, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const ct = res.headers.get("content-type") ?? "";
      if (res.ok && ct.includes("html")) {
        return base + pfad;
      }
    } catch {
      /* nächster Pfad */
    }
  }

  try {
    const res = await fetchThrottled(baseUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();

    const linkRegex = /href="([^"]*impressum[^"]*?)"/gi;
    const match = linkRegex.exec(html);
    if (match) {
      const href = match[1];
      if (href.startsWith("http")) return href;
      try {
        return new URL(href, base).href;
      } catch {
        return base + href.replace(/^\//, "/");
      }
    }
  } catch {
    /* */
  }

  return null;
}

export async function fetchImpressum(impressumUrl: string): Promise<string> {
  const res = await fetchThrottled(impressumUrl, {
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  let html = await res.text();

  html = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  const emailJsRegex =
    /var\s+name\s*=\s*"([^"]+)"[\s\S]*?var\s+domain\w*\s*=\s*"([^"]+)"/;
  const emailMatch = emailJsRegex.exec(html);
  if (emailMatch) {
    html = html.replace(emailJsRegex, `${emailMatch[1]}@${emailMatch[2]}`);
  }

  html = html
    .replace(/\s*\(at\)\s*/gi, "@")
    .replace(/\s*\[at\]\s*/gi, "@")
    .replace(/\s+@\s+/g, "@");

  html = html.replace(/\+49\s*/g, "0");

  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 3000);
}
