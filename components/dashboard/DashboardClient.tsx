"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { LeadsChart } from "@/components/dashboard/LeadsChart";
import { RecentLeads, type RecentLeadRow } from "@/components/dashboard/RecentLeads";
import { QueueDonut } from "@/components/dashboard/QueueDonut";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/de";

dayjs.extend(relativeTime);
dayjs.locale("de");

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Laden fehlgeschlagen");
  return r.json();
});

type StatsPayload = {
  totalLeads: number;
  leadsToday: number;
  queuePending: number;
  queueCounts: Record<string, number>;
  successRate: number;
  chart14d: { date: string; count: number }[];
  recentLeads: RecentLeadRow[];
  lastRun: { started_at: string; finished_at: string | null; run_type: string } | null;
  processingCount: number;
};

function formatAgo(iso: string | null) {
  if (!iso) return "—";
  return dayjs(iso).fromNow();
}

export function DashboardClient() {
  const [manualUrl, setManualUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { data, error, isLoading, mutate } = useSWR<StatsPayload>(
    "/api/stats",
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: true }
  );

  const live = useMemo(() => {
    if (!data) return false;
    const recentRun =
      data.lastRun &&
      dayjs().diff(dayjs(data.lastRun.started_at), "minute") < 2;
    return (data.processingCount ?? 0) > 0 || !!recentRun;
  }, [data]);

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl.trim() }),
      });
      setManualUrl("");
      await mutate();
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        Statistiken konnten nicht geladen werden. Prüfe Supabase-Umgebungsvariablen.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 rounded-[12px] bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-[12px] bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Aktueller Stand · Auto-Refresh alle 30 Sekunden
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-[12px] border border-white/10 bg-zinc-900/80 px-3 py-2">
            <span
              className={`relative flex h-2.5 w-2.5 ${live ? "" : "opacity-40"}`}
            >
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-40 ${live ? "" : "hidden"}`}
              />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
            </span>
            <span className="text-sm text-zinc-300">
              {live ? "Scraper aktiv" : "Bereit"}
            </span>
          </div>
          <div className="text-sm text-zinc-500">
            Letzter Run:{" "}
            <span className="font-mono text-zinc-300">
              {formatAgo(data.lastRun?.started_at ?? null)}
            </span>
          </div>
        </div>
      </div>

      <StatsCards
        totalLeads={data.totalLeads}
        leadsToday={data.leadsToday}
        queuePending={data.queuePending}
        successRate={data.successRate}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LeadsChart data={data.chart14d} />
        </div>
        <QueueDonut counts={data.queueCounts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentLeads leads={data.recentLeads} />
        <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm font-medium text-zinc-400">Quick Actions</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="/api/leads/export?only_new=true"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "rounded-[12px] bg-[#22c55e] text-black hover:bg-[#16a34a]"
                )}
              >
                Neue Leads exportieren
              </a>
              <a
                href="/api/leads/export"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "rounded-[12px] bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                )}
              >
                Alle Leads exportieren
              </a>
            </div>
            <form onSubmit={addManual} className="space-y-2">
              <label className="text-xs text-zinc-500">URL manuell hinzufügen</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://beispiel-shk.de"
                  className="rounded-[12px] border-white/10 bg-zinc-950"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="outline"
                  className="rounded-[12px] border-white/20"
                >
                  {submitting ? "…" : "Hinzufügen"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
