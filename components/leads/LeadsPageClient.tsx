"use client";

import useSWR from "swr";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useMemo, useRef, useState } from "react";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { qualityIssueClass } from "@/lib/quality-badges";
import { Trash2 } from "lucide-react";
import dayjs from "dayjs";

type Lead = {
  id: string;
  company_name: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  quality_issues: string[] | null;
  created_at: string;
  exported_at: string | null;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Fehler beim Laden");
    return r.json();
  });

const columnHelper = createColumnHelper<Lead>();

const rowGridClass =
  "grid w-full grid-cols-[40px_minmax(96px,1fr)_minmax(72px,0.7fr)_minmax(120px,1fr)_minmax(88px,0.8fr)_minmax(160px,1.2fr)_minmax(104px,0.9fr)_48px] items-center gap-2 px-3 py-2 text-sm";

export function LeadsPageClient() {
  const [q, setQState] = useState("");
  const [city, setCity] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [onlyUnexported, setOnlyUnexported] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("limit", "200");
    p.set("page", "1");
    if (q.trim()) p.set("q", q.trim());
    if (city.trim()) p.set("city", city.trim());
    if (onlyUnexported) p.set("onlyUnexported", "true");
    if (dateFrom) p.set("dateFrom", new Date(dateFrom).toISOString());
    if (dateTo) p.set("dateTo", new Date(dateTo).toISOString());
    return p.toString();
  }, [q, city, dateFrom, dateTo, onlyUnexported]);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/leads?${query}`,
    fetcher,
    { keepPreviousData: true }
  );

  const leads: Lead[] = data?.leads ?? [];

  const onFilterChange = useCallback(
    (patch: Partial<{
      q: string;
      city: string;
      dateFrom: string;
      dateTo: string;
      onlyUnexported: boolean;
    }>) => {
      if (patch.q !== undefined) setQState(patch.q);
      if (patch.city !== undefined) setCity(patch.city);
      if (patch.dateFrom !== undefined) setDateFrom(patch.dateFrom);
      if (patch.dateTo !== undefined) setDateTo(patch.dateTo);
      if (patch.onlyUnexported !== undefined) setOnlyUnexported(patch.onlyUnexported);
    },
    []
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Alle"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Zeile"
          />
        ),
      }),
      columnHelper.accessor("company_name", {
        header: "Firma",
        cell: (i) => i.getValue() ?? "—",
      }),
      columnHelper.accessor("city", {
        header: "Stadt",
        cell: (i) => i.getValue() ?? "—",
      }),
      columnHelper.accessor("email", {
        header: "E-Mail",
        cell: (i) => (
          <span className="block max-w-full truncate">{i.getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("phone", {
        header: "Telefon",
        cell: (i) => i.getValue() ?? "—",
      }),
      columnHelper.accessor("quality_issues", {
        header: "Qualität",
        cell: (i) => {
          const issues = i.getValue() as string[] | null;
          return (
            <div className="flex max-w-full flex-wrap gap-1">
              {issues?.map((x) => (
                <Badge
                  key={x}
                  variant="outline"
                  className={`rounded-[8px] text-[10px] ${qualityIssueClass(x)}`}
                >
                  {x}
                </Badge>
              )) ?? "—"}
            </div>
          );
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Datum",
        cell: (i) => dayjs(i.getValue() as string).format("DD.MM.YYYY HH:mm"),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-[12px] text-zinc-400 hover:text-red-400"
            onClick={async () => {
              await fetch(`/api/leads?id=${row.original.id}`, { method: "DELETE" });
              await mutate();
            }}
            aria-label="Löschen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      }),
    ],
    [mutate]
  );

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const tableRows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 56,
    overscan: 12,
  });

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((r) => r.original.id);

  async function exportSelected() {
    if (!selectedIds.length) return;
    const url = `/api/leads/export?ids=${encodeURIComponent(selectedIds.join(","))}`;
    window.open(url, "_blank");
  }

  if (error) {
    return (
      <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 p-6 text-red-200">
        Leads konnten nicht geladen werden.
      </div>
    );
  }

  const headerGroup = table.getHeaderGroups()[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Leads</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Filter, Suche und Export — bis zu 200 Treffer, virtualisierte Zeilen
        </p>
      </div>

      <LeadFilters
        q={q}
        city={city}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onlyUnexported={onlyUnexported}
        onChange={onFilterChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-[12px] bg-[#22c55e] text-black hover:bg-[#16a34a]"
          disabled={!selectedIds.length}
          onClick={exportSelected}
        >
          Ausgewählte exportieren ({selectedIds.length})
        </Button>
        <a
          href="/api/leads/export?only_new=true"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "inline-flex rounded-[12px] bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          )}
        >
          Neue exportieren (alle)
        </a>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[min(70vh,720px)] overflow-auto rounded-[12px] border border-white/10 bg-zinc-900/40"
      >
        <div
          className={cn(rowGridClass, "sticky top-0 z-10 border-b border-white/10 bg-zinc-900/95 text-xs font-medium text-zinc-400 backdrop-blur")}
        >
          {headerGroup?.headers.map((h) => (
            <div key={h.id} className="py-2">
              {h.isPlaceholder
                ? null
                : flexRender(h.column.columnDef.header, h.getContext())}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-zinc-500">Laden…</div>
        ) : tableRows.length === 0 ? (
          <div className="p-6 text-sm text-zinc-500">Keine Leads</div>
        ) : (
          <div
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((vi) => {
              const row = tableRows[vi.index];
              return (
                <div
                  key={row.id}
                  data-index={vi.index}
                  ref={rowVirtualizer.measureElement}
                  className={cn(
                    rowGridClass,
                    "absolute left-0 top-0 w-full border-b border-white/5 text-zinc-200"
                  )}
                  style={{
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="min-w-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
