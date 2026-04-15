"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { qualityIssueClass } from "@/lib/quality-badges";

export type RecentLeadRow = {
  id: string;
  company_name: string | null;
  city: string | null;
  email: string | null;
  quality_issues: string[] | null;
  created_at: string;
  url: string;
};

export function RecentLeads({ leads }: { leads: RecentLeadRow[] }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-zinc-900/50 p-4">
      <p className="mb-4 text-sm font-medium text-zinc-400">Letzte 10 Leads</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-400">Firma</TableHead>
              <TableHead className="text-zinc-400">Stadt</TableHead>
              <TableHead className="text-zinc-400">E-Mail</TableHead>
              <TableHead className="text-zinc-400">Qualität</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-zinc-500">
                  Noch keine Leads
                </TableCell>
              </TableRow>
            ) : (
              leads.map((l) => (
                <TableRow key={l.id} className="border-white/10">
                  <TableCell className="max-w-[180px] truncate font-medium text-white">
                    {l.company_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-zinc-300">{l.city ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-zinc-400">
                    {l.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(l.quality_issues)
                        ? l.quality_issues
                        : []
                      ).map((q) => (
                        <Badge
                          key={q}
                          variant="outline"
                          className={`rounded-[8px] text-[10px] ${qualityIssueClass(q)}`}
                        >
                          {q}
                        </Badge>
                      )) ?? "—"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
