// --- file: src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar";
import SummaryCard from "../../components/SummaryCard";
import type { JobStatus } from "../../components/StatusBadge";
import api from "@/lib/axios";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/** ========= Types ========= */
export type Job = {
  id: string;
  title: string;
  company: string;
  status: JobStatus | string;
  appliedAt?: string | null; // ISO
  createdAt: string; // ISO
};

const STATUS_LABEL: Record<JobStatus, string> = {
  wishlist: "Merkliste",
  applied: "Beworben",
  interview: "Interview",
  offer: "Angebot",
  rejected: "Abgelehnt",
  accepted: "Angenommen",
};

/** 用你的主题色： */
const STATUS_COLORS: Record<JobStatus, string> = {
  wishlist: "#94a3b8", // muted slate（灰度）
  applied: "#4F46E5",  // primary
  interview: "#06B6D4",// secondary
  offer: "#F59E0B",    // accent
  rejected: "#EF4444",
  accepted: "#10B981", // 适度的通过色
};

function normalizeStatus(s: string): JobStatus | null {
  const v = (s || "").toLowerCase();
  if (["wishlist", "saved", "draft"].includes(v)) return "wishlist";
  if (v === "applied") return "applied";
  if (v === "interview") return "interview";
  if (v === "offer") return "offer";
  if (v === "rejected") return "rejected";
  if (["accepted", "hired"].includes(v)) return "accepted";
  return null;
}

/** ---------- 日期工具（UTC，防时区漂移） ---------- */
const fmtYmd = (d: Date) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const parseISO = (s?: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const toDayKey = (iso: string) => {
  const d = parseISO(iso);
  if (!d) return null;
  return fmtYmd(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
};

const toWeekKey = (iso: string) => {
  const d = parseISO(iso);
  if (!d) return null;
  const base = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = base.getUTCDay(); // 0..6
  const diff = day === 0 ? -6 : 1 - day; // 周一起
  base.setUTCDate(base.getUTCDate() + diff);
  return fmtYmd(base);
};

type GroupBy = "week" | "day";

/** --------- Loading（整块卡片） --------- */
function LoadingPanel() {
  return (
    <div className="mt-6 h-[420px] w-full rounded-2xl border border-border bg-white shadow-sm flex flex-col items-center justify-center">
      <div className="relative h-12 w-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 opacity-20 border-primary" />
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin border-primary" />
      </div>
      <div className="text-sm text-muted">Daten werden geladen …</div>
    </div>
  );
}

/** --------- 自定义环形图中心总数 --------- */
const DonutCenter = ({ total }: { total: number }) => (
  <g>
    <text
      x="50%"
      y="48%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-[#111827]"
      style={{ fontWeight: 700, fontSize: 22 }}
    >
      {total}
    </text>
    <text
      x="50%"
      y="60%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-[#6B7280]"
      style={{ fontSize: 12 }}
    >
      Gesamt
    </text>
  </g>
);

/** --------- 自定义 Tooltip 格式化 --------- */
const formatTooltipValue = (v: any) => `${v}`;
const formatTooltipLabel = (v: string) => v;

/** ======================================= */
export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("week");
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    (async () => {
      if (!mounted) return;
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get("/positions", { signal: controller.signal });

        // 注意：axios 拦截器已返回 payload，这里不要使用 res.data
        const payload: any = res;
        const list: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];

        const cleaned = list
          .map((j: any) => {
            const st = normalizeStatus(String(j?.status));
            return st ? { ...j, status: st } : null;
          })
          .filter(Boolean);

        if (!mounted) return;
        setJobs(cleaned as Job[]);
      } catch (e: any) {
        const isCanceled =
          e?.code === "ERR_CANCELED" ||
          e?.name === "CanceledError" ||
          e?.name === "AbortError" ||
          e?.message === "canceled";
        if (isCanceled) return;

        if (!mounted) return;
        setErr(e?.message || "Fehler beim Laden der Daten.");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  /** 顶部统计 */
  const counts = useMemo(() => {
    const c: Record<JobStatus, number> = {
      wishlist: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      accepted: 0,
    };
    jobs.forEach((j) => {
      const st = normalizeStatus(String(j.status));
      if (st) c[st] = (c[st] ?? 0) + 1;
    });
    return c;
  }, [jobs]);

  const pieData = useMemo(
    () =>
      (Object.keys(counts) as JobStatus[])
        .map((key) => ({ name: STATUS_LABEL[key], value: counts[key], key }))
        .filter((d) => d.value > 0),
    [counts]
  );

  const total = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData]
  );

  /** 趋势图：按周/按天，使用 appliedAt || createdAt，补全空档 */
  const lineData = useMemo(() => {
    const getKey = groupBy === "week" ? toWeekKey : toDayKey;

    const dated = jobs
      .map((j) => j.appliedAt ?? j.createdAt)
      .map((s) => ({ raw: s, key: s ? getKey(s) : null }))
      .filter((x): x is { raw: string; key: string } => Boolean(x.key));

    if (dated.length === 0) return [];

    const bucket: Record<string, number> = {};
    dated.forEach(({ key }) => (bucket[key] = (bucket[key] ?? 0) + 1));

    const allKeys = Object.keys(bucket).sort();
    const first = parseISO(allKeys[0])!;
    const last = parseISO(allKeys[allKeys.length - 1])!;
    const stepDays = groupBy === "week" ? 7 : 1;

    const cursor = new Date(first);
    const series: { key: string; count: number }[] = [];
    while (cursor <= last) {
      const key = fmtYmd(cursor);
      series.push({ key, count: bucket[key] ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + stepDays);
    }

    return series.map(({ key, count }) => ({
      label: key,
      count,
    }));
  }, [jobs, groupBy]);

  /** ------------------- UI ------------------- */
  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <Topbar title="Übersicht" />

        {/* 主面板容器：白底、细边框、圆角、阴影（中间留白） */}
        <div className="mx-auto max-w-6xl p-4 md:p-6">
          <div className="rounded-2xl border border-border bg-white shadow-sm p-4 md:p-6">
            {/* 顶部指标 */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <SummaryCard title="Gesamt" value={jobs.length} />
              <SummaryCard title="Merkliste" value={counts.wishlist} />
              <SummaryCard title="Beworben" value={counts.applied} />
              <SummaryCard title="Interview" value={counts.interview} />
              <SummaryCard title="Angebot" value={counts.offer} />
              <SummaryCard title="Angenommen" value={counts.accepted} />
            </div>

            {/* 加载 / 错误 / 内容 */}
            {loading ? (
              <LoadingPanel />
            ) : err ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {err}
              </div>
            ) : jobs.length === 0 ? (
              // 空白状态
              <button
                onClick={() => router.push("/jobs")}
                className="mt-6 w-full rounded-2xl border border-border bg-white p-0 shadow-sm overflow-hidden text-left group focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                aria-label="Noch keine Bewerbungen – Jetzt starten"
              >
                <div className="relative w-full aspect-[21/9]">
                  <Image
                    src="/img/empty-apply-abstract.svg"
                    alt="Noch keine Bewerbungen – Bewerbung starten"
                    fill
                    className="object-cover object-[center_45%] transition-transform duration-300 group-hover:scale-[1.02]"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-white/30 to-white/10" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <h2 className="mb-2 text-2xl md:text-3xl font-semibold text-foreground">
                      Noch keine Bewerbungen
                    </h2>
                    <p className="mb-5 hidden md:block text-sm md:text-base text-muted max-w-xl">
                      Starte deine erste Bewerbung und verfolge deinen
                      Fortschritt effizient 🚀
                    </p>
                    <span className="inline-flex items-center rounded-2xl px-5 py-3 bg-primary text-white font-medium shadow hover:opacity-95 active:opacity-90">
                      Bewerbung starten
                    </span>
                  </div>
                </div>
              </button>
            ) : (
              // 图表区域
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* 环形图 */}
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="mb-3 text-sm text-muted">Status-Verteilung</div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={96}
                          paddingAngle={2}
                          isAnimationActive={false}
                        >
                          {pieData.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={STATUS_COLORS[entry.key as JobStatus]}
                              stroke="#fff"
                              strokeWidth={1}
                            />
                          ))}
                          <DonutCenter total={total} />
                        </Pie>
                        <Tooltip
                          formatter={formatTooltipValue}
                          labelFormatter={formatTooltipLabel}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 自定义图例（更商务） */}
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {pieData.map((d) => {
                      const pct = total ? Math.round((d.value / total) * 100) : 0;
                      return (
                        <div key={d.key} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: STATUS_COLORS[d.key as JobStatus] }}
                            />
                            <span className="text-foreground">{d.name}</span>
                          </span>
                          <span className="tabular-nums text-muted">
                            {d.value} · {pct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 折线图 */}
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm text-muted">
                      Bewerbungstrend ({groupBy === "week" ? "pro Woche" : "pro Tag"})
                    </div>

                    {/* Segmented Control */}
                    <div className="inline-flex rounded-xl border border-border bg-white p-1 text-xs">
                      <button
                        onClick={() => setGroupBy("week")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          groupBy === "week"
                            ? "bg-gray-200 text-foreground"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Woche
                      </button>
                      <button
                        onClick={() => setGroupBy("day")}
                        className={`px-2.5 py-1 rounded-lg transition ${
                          groupBy === "day"
                            ? "bg-gray-200 text-foreground"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Tag
                      </button>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="label"
                          stroke="#9CA3AF"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          allowDecimals={false}
                          stroke="#9CA3AF"
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Anzahl Bewerbungen"
                          stroke="#4F46E5"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
