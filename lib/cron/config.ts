export function discoveryMaxUrls(): number {
  const n = parseInt(process.env.DISCOVERY_MAX_URLS ?? "2500", 10);
  if (Number.isNaN(n)) return 2500;
  return Math.max(100, Math.min(10000, n));
}

export function scrapeBatchSize(): number {
  const n = parseInt(process.env.SCRAPE_BATCH_SIZE ?? "15", 10);
  if (Number.isNaN(n)) return 15;
  return Math.max(3, Math.min(30, n));
}

export function scrapeMaxRuntimeMs(): number {
  const n = parseInt(process.env.SCRAPE_MAX_RUNTIME_MS ?? "58000", 10);
  if (Number.isNaN(n)) return 58_000;
  return Math.max(15_000, Math.min(58_000, n));
}
