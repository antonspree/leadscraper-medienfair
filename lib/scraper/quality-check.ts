/** Mindestanzahl erkannte Mängel (1–5). `QUALITY_MIN_ISSUES=1` erhöht die Lead-Schlagzahl. */
function getMinQualityIssues(): number {
  const v = parseInt(process.env.QUALITY_MIN_ISSUES ?? "2", 10);
  if (Number.isNaN(v)) return 2;
  return Math.max(1, Math.min(5, v));
}

export interface QualityResult {
  passes: boolean;
  issues: string[];
  loadTimeMs?: number;
  website_age_years: number | null;
}

/** Grobe Schätzung aus Copyright/Jahr im HTML (optional). */
export function estimateWebsiteAgeYears(html: string): number | null {
  const yearMatch = html.match(/©\s*(20\d{2})/i) || html.match(/Copyright\s*(20\d{2})/i);
  if (yearMatch) {
    const y = parseInt(yearMatch[1], 10);
    const cy = new Date().getFullYear();
    if (y >= 1995 && y <= cy) return Math.max(0, cy - y);
  }
  return null;
}

export async function checkWebsiteQuality(url: string): Promise<QualityResult> {
  const issues: string[] = [];

  try {
    const startTime = Date.now();
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
      },
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });

    const loadTime = Date.now() - startTime;
    const html = await res.text();

    if (!url.startsWith("https://")) {
      issues.push("kein_https");
    }

    if (!html.includes("viewport")) {
      issues.push("kein_viewport");
    }

    const cookieBannerSignals = ["cookie", "Cookie", "DSGVO", "Datenschutz", "consent"];
    if (!cookieBannerSignals.some((s) => html.includes(s))) {
      issues.push("kein_cookie");
    }

    const analyticsSignals = [
      "google-analytics",
      "googletagmanager",
      "gtag(",
      "UA-",
      "G-",
      "analytics.js",
      "matomo",
      "plausible",
    ];
    if (!analyticsSignals.some((s) => html.includes(s))) {
      issues.push("kein_analytics");
    }

    const oldCmsSignals = [
      "wp-content/themes",
      "Joomla!",
      "TYPO3",
      'generator" content="WordPress 3',
      'generator" content="WordPress 4',
    ];
    if (oldCmsSignals.some((s) => html.includes(s))) {
      issues.push("veraltetes_cms");
    }

    const minIssues = getMinQualityIssues();
    const passes = issues.length >= minIssues;

    return {
      passes,
      issues,
      loadTimeMs: loadTime,
      website_age_years: estimateWebsiteAgeYears(html),
    };
  } catch {
    return { passes: false, issues: ["nicht_erreichbar"], website_age_years: null };
  }
}
