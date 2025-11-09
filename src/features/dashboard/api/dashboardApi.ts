// Unified Dashboard API caller (http + joinApiPath), aligned with jobsApi style.

import { http } from "@/lib/api/http";
import { joinApiPath } from "@/lib/api/config";

// Optional query params for future flexibility (range, custom dates, tz, recent limit).
export type DashboardQuery = {
  range?: "7d" | "30d" | "month" | "quarter" | "year" | "custom";
  from?: string;  // YYYY-MM-DD
  to?: string;    // YYYY-MM-DD
  tz?: string;    // e.g. "Europe/Berlin"
  limit?: number; // recentJobs size (default 3 on server)
};

function buildQuery(params: DashboardQuery = {}) {
  const q = new URLSearchParams();
  if (params.range) q.set("range", params.range);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.tz) q.set("tz", params.tz);
  if (typeof params.limit === "number") q.set("limit", String(params.limit));
  return q.toString();
}

/** GET /api/v1/dashboard -> { stats, statusDistribution, trend, recentJobs } */
export async function getDashboard(params?: DashboardQuery) {
  const qs = buildQuery(params ?? {});
  // Your http interceptor returns resp.data directly.
  return http.get(joinApiPath(`/dashboard${qs ? `?${qs}` : ""}`));
}
