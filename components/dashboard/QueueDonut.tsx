"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  pending: "#71717a",
  processing: "#3b82f6",
  done: "#22c55e",
  failed: "#ef4444",
  duplicate: "#a1a1aa",
  quality_fail: "#f97316",
  too_new: "#eab308",
};

type Props = {
  counts: Record<string, number>;
};

export function QueueDonut({ counts }: Props) {
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="h-[260px] rounded-[12px] border border-white/10 bg-zinc-900/50 p-4">
      <p className="mb-2 text-sm font-medium text-zinc-400">Queue-Status</p>
      {data.length === 0 ? (
        <p className="pt-12 text-center text-sm text-zinc-500">Keine Einträge</p>
      ) : (
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`c-${index}`}
                  fill={COLORS[entry.name] ?? "#52525b"}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#18181b",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
