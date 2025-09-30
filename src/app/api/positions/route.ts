// --- file: src/app/api/positions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createPositionSchema, listQuerySchema } from "@/lib/validation/position";

// 将 sort 字符串解析为 Prisma 的 orderBy 对象
function parseOrderBy(sort?: string): Record<string, "asc" | "desc"> {
  const DEFAULT: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (!sort || !sort.trim()) return DEFAULT;

  const s = sort.trim();

  // 1) -createdAt / +createdAt
  if (s.startsWith("-") || s.startsWith("+")) {
    const field = s.slice(1);
    const dir: "asc" | "desc" = s.startsWith("-") ? "desc" : "asc";
    return { [field]: dir };
  }

  // 2) createdAt:desc / createdAt:asc
  if (s.includes(":")) {
    const [field, dirRaw] = s.split(":");
    const dir: "asc" | "desc" = dirRaw?.toLowerCase() === "desc" ? "desc" : "asc";
    return { [field]: dir };
  }

  // 3) createdAt desc / createdAt asc
  if (s.includes(" ")) {
    const [field, dirRaw] = s.split(/\s+/);
    const dir: "asc" | "desc" = dirRaw?.toLowerCase() === "desc" ? "desc" : "asc";
    return { [field]: dir };
  }

  // 4) 仅字段名
  return { [s]: "asc" };
}

export async function GET(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { page, pageSize, sort, q, status, source, from, to, tag } = parsed.data;

  // 过滤条件
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

  // 将 from/to（若为字符串）转为 Date
  if (from || to) {
    const gte = from ? new Date(from as unknown as string) : undefined;
    const lte = to ? new Date(to as unknown as string) : undefined;
    where.createdAt = {
      ...(gte ? { gte } : {}),
      ...(lte ? { lte } : {}),
    };
  }

  // tags（PostgreSQL JSONB）
  if (tag) {
    where.tags = { has: tag };
  }

  // 排序
  const orderBy = parseOrderBy(sort);

  // 分页
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(100, Math.max(1, Number(pageSize) || 10));
  const skip = (safePage - 1) * safePageSize;

  // 查询
  const [total, rows] = await Promise.all([
    prisma.position.count({ where }),
    prisma.position.findMany({
      where,
      orderBy,
      skip,
      take: safePageSize,
      select: {
        id: true,
        userId: true,
        title: true,
        company: true,
        location: true,
        link: true,            // ✅ 明确选择 link
        source: true,
        status: true,
        priority: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        appliedAt: true,
        notes: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  return NextResponse.json({
    data: rows,
    total,
    pagination: { page: safePage, pageSize: safePageSize, total, totalPages },
  });
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json();

  // 兼容老前端：若传了 url 而不是 link，则映射一次
  if (raw && typeof raw === "object" && raw.url && !raw.link) {
    raw.link = raw.url;
    delete raw.url;
  }

  const parsed = createPositionSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 归一化：把空串转 null；appliedAt 转 Date
  const payload = parsed.data as any;
  const normalize = <T extends string | null | undefined>(v: T) =>
    v === "" ? null : v;

  const data = {
    title: payload.title,
    company: payload.company,
    location: normalize(payload.location),
    link: normalize(payload.link), // ✅ 使用 link
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
      id: true,
      userId: true,
      title: true,
      company: true,
      location: true,
      link: true,            // ✅ 返回 link
      source: true,
      status: true,
      priority: true,
      salaryMin: true,
      salaryMax: true,
      currency: true,
      appliedAt: true,
      notes: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
