"use client";
import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type TrendChartProps = { data: { date: string; count: number }[] };

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold mb-2">Neue Positionen (30 Tage)</h2>
      {(!data || data.length === 0) ? (
        <div className="text-sm text-muted">Keine Daten verfügbar</div>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v) => `Datum: ${v}`}
                formatter={(v) => [`${v}`, "Neue"]}
                contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }}
              />
              <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
