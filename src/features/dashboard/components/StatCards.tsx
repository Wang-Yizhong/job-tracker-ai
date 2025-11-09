"use client";
import * as React from "react";
import { JOB_STATUS_LABEL, JOB_STATUS_CLS } from "@/features/jobs/types";

type StatCardsProps = {
  stats?: Record<string, number>; // ✅ optional
};

export default function StatCards({ stats = {} }: StatCardsProps) { // ✅ fallback {}
  const items = [
    {
      key: "total",
      label: "Gesamt",
      value: stats.total ?? 0,
      cls: "border-border text-foreground bg-background",
    },
    {
      key: "APPLIED",
      label: JOB_STATUS_LABEL.APPLIED,
      value: stats.applied ?? 0,
      cls: JOB_STATUS_CLS.APPLIED,
    },
    {
      key: "INTERVIEW",
      label: JOB_STATUS_LABEL.INTERVIEW,
      value: stats.interview ?? 0,
      cls: JOB_STATUS_CLS.INTERVIEW,
    },
    {
      key: "HIRED",
      label: JOB_STATUS_LABEL.HIRED,
      value: stats.hired ?? 0,
      cls: JOB_STATUS_CLS.HIRED,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.key}
          className={`h-[76px] rounded-xl border shadow-sm flex flex-col items-center justify-center text-center ${it.cls}`}
        >
          <div className="text-2xl font-bold leading-6">{it.value}</div>
          <div className="text-xs text-muted mt-1">{it.label}</div>
        </div>
      ))}
    </section>
  );
}
