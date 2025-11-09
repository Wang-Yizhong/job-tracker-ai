// --- file: src/app/api/positions/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { Api } from "@/lib/api/server";
import { updatePositionSchema } from "@/lib/validation/position";

export const runtime = "nodejs";

// 简单的 params 校验（保持原错误结构，用于 400）
const IdParams = z.object({ id: z.string().min(1, "Missing id") });

// GET /api/positions/[id]
export const GET = Api.handle(async (_req: NextRequest, ctx: { params: { id: string } }) => {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = IdParams.safeParse(ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { id } = parsed.data;

  const item = await prisma.position.findFirst({ where: { id, userId } });
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 保持原结构：直接返回 item
  return NextResponse.json(item);
});

// PUT /api/positions/[id]
export const PUT = Api.handle(async (req: NextRequest, ctx: { params: { id: string } }) => {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = IdParams.safeParse(ctx.params);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { id } = parsedId.data;

  const body = await req.json().catch(() => ({}));
  const parsedBody = updatePositionSchema.safeParse(body);
  if (!parsedBody.success) {
    // 保持原结构：flatten 到 error 字段，HTTP 400
    return NextResponse.json({ error: parsedBody.error.flatten() }, { status: 400 });
  }

  // 兼容老字段：url -> link（与列表/创建接口一致）
  const { url, ...rest } = parsedBody.data as any;
  const data = { ...rest, ...(url !== undefined ? { link: url } : {}) };

  const r = await prisma.position.updateMany({ where: { id, userId }, data });
  if (r.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.position.findFirst({ where: { id, userId } });
  // 保持原结构：直接返回 updated
  return NextResponse.json(updated);
});

// DELETE /api/positions/[id]
export const DELETE = Api.handle(async (_req: NextRequest, ctx: { params: { id: string } }) => {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = IdParams.safeParse(ctx.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { id } = parsed.data;

  const r = await prisma.position.deleteMany({ where: { id, userId } });
  if (r.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 保持原结构：{ ok: true }
  return NextResponse.json({ ok: true });
});
