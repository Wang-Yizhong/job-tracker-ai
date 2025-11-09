// --- file: src/app/api/v1/jobs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { Api } from "@/lib/api/server";
import { parseJson, parseQuery } from "@/lib/validation/zod";
import { createPositionSchema, listQuerySchema } from "@/lib/validation/position";

// 允许排序的字段白名单（避免任意字段注入）
const ORDERABLE_FIELDS = new Set(["createdAt", "updatedAt", "title", "company"]);

// 将 sort 字符串解析为 Prisma 的 orderBy 对象
function parseOrderBy(sort?: string): Record<string, "asc" | "desc"> {
  const DEFAULT: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (!sort || !sort.trim()) return DEFAULT;

  const s = sort.trim();
  let field = "createdAt";
  let dir: "asc" | "desc" = "asc";

  if (s.startsWith("-") || s.startsWith("+")) {
    field = s.slice(1);
    dir = s.startsWith("-") ? "desc" : "asc";
  } else if (s.includes(":")) {
    const [f, d = "asc"] = s.split(":");
    field = f;
    dir = d.toLowerCase() === "desc" ? "desc" : "asc";
  } else if (s.includes(" ")) {
    const [f, d = "asc"] = s.split(/\s+/);
    field = f;
    dir = d.toLowerCase() === "desc" ? "desc" : "asc";
  } else {
    field = s;
    dir = "asc";
  }

  if (!ORDERABLE_FIELDS.has(field)) return DEFAULT;
  return { [field]: dir };
}

/**
 * GET /api/positions
 * 保持原结构：{ data: rows, total, pagination }
 */
export const GET = Api.handle(async (req: Request) => {
  const userId = await requireUserId();
  if (!userId) throw Api.E.Unauthorized();

  const { page, pageSize, sort, q, status, source, from, to, tag } = parseQuery(
    req.url,
    listQuerySchema
  );

  // where 过滤
  const where: any = { userId };
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status;
  if (source) where.source = { contains: source, mode: "insensitive" };

  if (from || to) {
    const gte = from && !Number.isNaN(Date.parse(String(from))) ? new Date(String(from)) : undefined;
    const lte = to && !Number.isNaN(Date.parse(String(to))) ? new Date(String(to)) : undefined;
    if (gte || lte) where.createdAt = { ...(gte ? { gte } : {}), ...(lte ? { lte } : {}) };
  }
  if (tag) where.tags = { has: tag };

  const orderBy = parseOrderBy(sort);
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const skip = (safePage - 1) * safePageSize;

  const [total, rows] = await Promise.all([
    prisma.position.count({ where }),
    prisma.position.findMany({
      where,
      orderBy,
      skip,
      take: safePageSize,
      select: {
        id: true, userId: true, title: true, company: true, location: true,
        link: true, source: true, status: true, priority: true,
        salaryMin: true, salaryMax: true, currency: true, appliedAt: true,
        notes: true, tags: true, createdAt: true, updatedAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  // ⚠️ 使用 NextResponse 保持原结构，不引入 { ok:true, data }
  const res = NextResponse.json(
    {
      data: rows,
      total,
      pagination: { page: safePage, pageSize: safePageSize, total, totalPages },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
  return res;
});

/**
 * POST /api/positions
 * 保持原结构：{ data: created }（201）
 */
export const POST = Api.handle(async (req: Request) => {
  const userId = await requireUserId();
  if (!userId) throw Api.E.Unauthorized();

  // 兼容老前端：若传了 url 而不是 link
  const raw = await req.json().catch(() => ({} as any));
  if (raw && typeof raw === "object" && raw.url && !raw.link) {
    raw.link = raw.url;
    delete raw.url;
  }

  const payload = await parseJson(
    new Request(req.url, { method: req.method, headers: req.headers, body: JSON.stringify(raw) }),
    createPositionSchema
  );

  const normalize = <T extends string | null | undefined>(v: T) => (v === "" ? null : v);

  const data = {
    title: payload.title,
    company: payload.company,
    location: normalize(payload.location),
    link: normalize(payload.link),
    source: normalize(payload.source),
    status: payload.status,
    priority: payload.priority ?? null,
    salaryMin: payload.salaryMin ?? null,
    salaryMax: payload.salaryMax ?? null,
    currency: normalize(payload.currency),
    appliedAt: payload.appliedAt ? new Date(payload.appliedAt) : null,
    notes: normalize(payload.notes),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    userId,
  };

  const created = await prisma.position.create({
    data,
    select: {
      id: true, userId: true, title: true, company: true, location: true,
      link: true, source: true, status: true, priority: true,
      salaryMin: true, salaryMax: true, currency: true, appliedAt: true,
      notes: true, tags: true, createdAt: true, updatedAt: true,
    },
  });

  const res = NextResponse.json(
    { data: created },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" /*, Location: `/api/positions/${created.id}` */ },
    }
  );
  return res;
});
