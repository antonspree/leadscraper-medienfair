"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  totalLeads: number;
  leadsToday: number;
  queuePending: number;
  successRate: number;
};

export function StatsCards({
  totalLeads,
  leadsToday,
  queuePending,
  successRate,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Gesamte Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-semibold text-[#22c55e] tabular-nums">
            {totalLeads}
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Neue Leads heute
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-semibold text-[#3b82f6] tabular-nums">
            {leadsToday}
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Queue ausstehend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-semibold text-zinc-400 tabular-nums">
            {queuePending}
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-[12px] border-white/10 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Erfolgsrate (letzte Runs)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-4xl font-semibold text-[#eab308] tabular-nums">
            {successRate}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
