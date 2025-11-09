"use client";
import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { JOB_STATUS_LABEL } from "@/features/jobs/types";

type StatusDatum = { status: string; count: number };
type StatusChartProps = {
  data?: StatusDatum[]; // ← optional，避免 undefined 报错
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#D1D5DB",
  SAVED: "#6B7280",
  APPLIED: "hsl(var(--primary))",
  INTERVIEW: "hsl(var(--accent))",
  OFFER: "hsl(var(--secondary))",
  REJECTED: "#E11D48",
  HIRED: "#10B981",
};

export default function StatusChart({ data = [] }: StatusChartProps) {
  const chartData = Array.isArray(data) ? data.filter(d => (d?.count ?? 0) > 0) : [];
  const total = chartData.reduce((s, d) => s + (Number(d.count) || 0), 0);

  return (
    <section className="relative rounded-xl border border-border bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold mb-2">Status-Verteilung</h2>

      {chartData.length === 0 ? (
        <div className="text-sm text-muted">Keine Daten verfügbar</div>
      ) : (
        <div className="relative h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={66}
                outerRadius={90}
                paddingAngle={4}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLOR[entry.status] ?? "#CBD5E1"}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }}
                formatter={(v, _n, p) =>
                  `${JOB_STATUS_LABEL[p?.payload?.status as keyof typeof JOB_STATUS_LABEL] ?? "—"}: ${v}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold leading-6">{total}</div>
              <div className="text-xs text-muted">Gesamt</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
