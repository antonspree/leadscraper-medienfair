const GAP_MS = 200;

/** 200 ms Pause zwischen Requests zur selben Domain (pro Aufruf/Kontext neu instanziieren). */
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
    const wait = Math.max(0, GAP_MS - (now - last));
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    lastByHost.set(hostname, Date.now());
    return fetch(input, init);
  };
}
