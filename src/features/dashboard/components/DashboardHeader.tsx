"use client";
import * as React from "react";
import { RotateCw } from "lucide-react";

type DashboardHeaderProps = {
  title?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export default function DashboardHeader({
  title = "Willkommen zurück!",
  onRefresh,
  refreshing,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-border">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-white hover:bg-secondary/80 transition disabled:opacity-50"
      >
        <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        Aktualisieren
      </button>
    </header>
  );
}
