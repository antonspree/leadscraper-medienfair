"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  q: string;
  city: string;
  dateFrom: string;
  dateTo: string;
  onlyUnexported: boolean;
  onChange: (patch: Partial<{
    q: string;
    city: string;
    dateFrom: string;
    dateTo: string;
    onlyUnexported: boolean;
  }>) => void;
};

export function LeadFilters({
  q,
  city,
  dateFrom,
  dateTo,
  onlyUnexported,
  onChange,
}: Props) {
  return (
    <div className="grid gap-4 rounded-[12px] border border-white/10 bg-zinc-900/50 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2">
        <Label className="text-zinc-400">Suche</Label>
        <Input
          value={q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Firma, E-Mail, Stadt"
          className="rounded-[12px] border-white/10 bg-zinc-950"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-400">Stadt</Label>
        <Input
          value={city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="z. B. Köln"
          className="rounded-[12px] border-white/10 bg-zinc-950"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-400">Nur nicht exportiert</Label>
        <div className="flex h-10 items-center gap-2">
          <Checkbox
            id="unex"
            checked={onlyUnexported}
            onCheckedChange={(c) => onChange({ onlyUnexported: !!c })}
          />
          <label htmlFor="unex" className="text-sm text-zinc-300">
            exported_at ist leer
          </label>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-400">Datum von</Label>
        <Input
          type="datetime-local"
          value={dateFrom}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
          className="rounded-[12px] border-white/10 bg-zinc-950"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-400">Datum bis</Label>
        <Input
          type="datetime-local"
          value={dateTo}
          onChange={(e) => onChange({ dateTo: e.target.value })}
          className="rounded-[12px] border-white/10 bg-zinc-950"
        />
      </div>
    </div>
  );
}
