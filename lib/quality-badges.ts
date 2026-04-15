/** Farb-Mapping für Qualitätssignale (Badges). */
export function qualityIssueClass(key: string): string {
  const k = key.toLowerCase();
  if (k.includes("https")) return "border-red-500/50 bg-red-500/10 text-red-300";
  if (k.includes("viewport")) return "border-orange-500/50 bg-orange-500/10 text-orange-200";
  if (k.includes("analytics")) return "border-amber-500/50 bg-amber-500/10 text-amber-200";
  if (k.includes("cookie")) return "border-yellow-500/50 bg-yellow-500/10 text-yellow-100";
  if (k.includes("cms")) return "border-purple-500/50 bg-purple-500/10 text-purple-200";
  if (k.includes("erreich")) return "border-zinc-500/50 bg-zinc-500/10 text-zinc-300";
  return "border-white/20 bg-white/5 text-zinc-300";
}
