import crypto from "crypto";

/** Prüft das App-Passwort (timing-safe bei gleicher Länge). `ADMIN_PASSWORD` in Env setzen. */
export function verifyAdminPassword(plain: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || plain.length === 0) return false;
  try {
    const a = Buffer.from(plain, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
}
