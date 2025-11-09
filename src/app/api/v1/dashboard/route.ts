import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { Api } from "@/lib/api/server";
import { DashboardDataSchema } from "@/features/dashboard/schemas/dashboard.schema";
import { JOB_STATUSES } from "@/features/jobs/types";
import { toDateString } from "@/utils/date";

type TrendRow = { date: string | Date | null; count: number | string | null };

function orderStatusDistribution(raw: { status: string; _count: { _all: number } }[]) {
  const map = new Map<string, number>();
  for (const r of raw) map.set(r.status, r._count._all);
  return JOB_STATUSES.map((status) => ({ status, count: map.get(status) ?? 0 }));
}

/** GET /api/v1/dashboard */
export const GET = Api.handle(async () => {
  const userId = await requireUserId();
  if (!userId) throw Api.E.Unauthorized();

  // 1) stats + distribution
  const total = await prisma.position.count({ where: { userId } });
  const grouped = await prisma.position.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const stats = {
    total,
    saved: grouped.find((s) => s.status === "SAVED")?._count._all ?? 0,
    applied: grouped.find((s) => s.status === "APPLIED")?._count._all ?? 0,
    interview: grouped.find((s) => s.status === "INTERVIEW")?._count._all ?? 0,
    offers: grouped.find((s) => s.status === "OFFER")?._count._all ?? 0,
    hired: grouped.find((s) => s.status === "HIRED")?._count._all ?? 0,
  };

  const statusDistribution = orderStatusDistribution(grouped);

  // 2) trend (last 30 days by createdAt)
  const trendRaw = await prisma.$queryRaw<TrendRow[]>`
    SELECT DATE("createdAt") AS date, COUNT(*)::int AS count
    FROM "Position"
    WHERE "userId" = ${userId}
      AND "createdAt" > NOW() - INTERVAL '30 days'
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") ASC
  `;
  const trend = trendRaw.map((t) => ({
    date: toDateString(t.date),
    count: Number(t.count) || 0,
  }));

  // 3) recent jobs (latest 3)
  const recent = await prisma.position.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, title: true, company: true, status: true, createdAt: true },
  });
  const recentJobs = recent.map((r) => ({
    id: r.id,
    title: r.title,
    company: r.company,
    status: r.status,
    createdAt: toDateString(r.createdAt),
  }));

  const payload = { stats, statusDistribution, trend, recentJobs };
  const data = DashboardDataSchema.parse(payload);

  return NextResponse.json(data, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
});
