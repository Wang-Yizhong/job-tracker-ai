// --- file: src/app/api/positions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { createPositionSchema, listQuerySchema } from "@/lib/validation/position";

// 允许排序的字段白名单（避免任意字段注入）
const ORDERABLE_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "title",
  "company",
]);

// 将 sort 字符串解析为 Prisma 的 orderBy 对象
function parseOrderBy(sort?: string): Record<string, "asc" | "desc"> {
  const DEFAULT: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (!sort || !sort.trim()) return DEFAULT;

  const s = sort.trim();
  let field = "createdAt";
  let dir: "asc" | "desc" = "asc";

  // -createdAt / +createdAt
  if (s.startsWith("-") || s.startsWith("+")) {
    field = s.slice(1);
    dir = s.startsWith("-") ? "desc" : "asc";
  }
  // createdAt:desc / createdAt:asc
  else if (s.includes(":")) {
    const [f, d = "asc"] = s.split(":");
    field = f;
    dir = d.toLowerCase() === "desc" ? "desc" : "asc";
  }
  // createdAt desc / createdAt asc
  else if (s.includes(" ")) {
    const [f, d = "asc"] = s.split(/\s+/);
    field = f;
    dir = d.toLowerCase() === "desc" ? "desc" : "asc";
  }
  // 仅字段名
  else {
    field = s;
    dir = "asc";
  }

  // 白名单校验，非法则回退默认
  if (!ORDERABLE_FIELDS.has(field)) return DEFAULT;
  return { [field]: dir };
}

// 统一错误响应
function err(code: number, message: string, extra?: unknown) {
  return NextResponse.json(
    { code, message, ...(extra ? { extra } : {}) },
    { status: code, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return err(401, "Unauthorized");

    const { searchParams } = new URL(req.url);
    const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return err(400, "Invalid query", parsed.error.flatten());
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

    // 将 from/to（若为字符串）转为 Date（仅当可被解析）
    if (from || to) {
      const gte = from && !Number.isNaN(Date.parse(String(from))) ? new Date(String(from)) : undefined;
      const lte = to && !Number.isNaN(Date.parse(String(to))) ? new Date(String(to)) : undefined;
      if (gte || lte) {
        where.createdAt = {
          ...(gte ? { gte } : {}),
          ...(lte ? { lte } : {}),
        };
      }
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
          link: true,
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

    return NextResponse.json(
      {
        data: rows,
        total,
        pagination: { page: safePage, pageSize: safePageSize, total, totalPages },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    // prisma / 其他运行时错误
    return err(500, e?.message || "Server error");
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return err(401, "Unauthorized");

    const raw = await req.json();

    // 兼容老前端：若传了 url 而不是 link，则映射一次
    if (raw && typeof raw === "object" && raw.url && !raw.link) {
      raw.link = raw.url;
      delete raw.url;
    }

    const parsed = createPositionSchema.safeParse(raw);
    if (!parsed.success) {
      return err(400, "Invalid body", parsed.error.flatten());
    }

    // 归一化：把空串转 null；appliedAt 转 Date
    const payload = parsed.data as any;
    const normalize = <T extends string | null | undefined>(v: T) =>
      v === "" ? null : v;

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
        id: true,
        userId: true,
        title: true,
        company: true,
        location: true,
        link: true,
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

    // 返回 201 + 可选 Location
    return NextResponse.json(
      { data: created },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          // 可选：告诉客户端资源位置
          // Location: `/api/positions/${created.id}`,
        },
      }
    );
  } catch (e: any) {
    return err(500, e?.message || "Server error");
  }
}
