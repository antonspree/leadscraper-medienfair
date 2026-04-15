"use client";

import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = {
  id: string;
  url: string;
  source: string;
  city: string | null;
  status: string;
  created_at: string;
  error_msg: string | null;
};

export default function QueuePage() {
  const { data, error, isLoading } = useSWR<{ items: Item[] }>(
    "/api/queue?list=1&limit=100",
    fetcher,
    { refreshInterval: 30_000 }
  );

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Queue</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Letzte Einträge · Auto-Refresh 30s
        </p>
      </div>

      {error ? (
        <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          Queue konnte nicht geladen werden.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-white/10 bg-zinc-900/40">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">URL</TableHead>
                <TableHead className="text-zinc-400">Quelle</TableHead>
                <TableHead className="text-zinc-400">Stadt</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400">Erstellt</TableHead>
                <TableHead className="text-zinc-400">Fehler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-zinc-500">
                    Laden…
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-zinc-500">
                    Keine Einträge
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it) => (
                  <TableRow
                    key={it.id}
                    className="border-white/10 [content-visibility:auto]"
                  >
                    <TableCell className="max-w-[220px] truncate font-mono text-xs text-zinc-300">
                      {it.url}
                    </TableCell>
                    <TableCell className="text-zinc-400">{it.source}</TableCell>
                    <TableCell className="text-zinc-300">{it.city ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-[8px] border-white/20 capitalize"
                      >
                        {it.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-zinc-500">
                      {dayjs(it.created_at).format("DD.MM.YYYY HH:mm")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-red-300/90">
                      {it.error_msg ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
