function gapMs(): number {
  const n = parseInt(process.env.RATE_LIMIT_HOST_MS ?? "200", 10);
  if (Number.isNaN(n)) return 200;
  return Math.max(50, Math.min(500, n));
}

/** Pause zwischen Requests zur selben Domain (Standard 200 ms, `RATE_LIMIT_HOST_MS` 50–500). */
export function createHostThrottler() {
  const lastByHost = new Map<string, number>();

  return async function throttledFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const href =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    let hostname: string;
    try {
      hostname = new URL(href).hostname;
    } catch {
      return fetch(input, init);
    }
    const now = Date.now();
    const last = lastByHost.get(hostname) ?? 0;
    const wait = Math.max(0, gapMs() - (now - last));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastByHost.set(hostname, Date.now());
    return fetch(input, init);
  };
}
