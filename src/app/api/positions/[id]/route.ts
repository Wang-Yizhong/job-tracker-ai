// --- file: src/app/api/positions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { updatePositionSchema } from "@/lib/validation/position";

export const runtime = "nodejs";

type Ctx = { params: Record<string, string> };

// 读单条
export async function GET(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const item = await prisma.position.findFirst({
    where: { id, userId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

// 更新
export async function PUT(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const parsed = updatePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 后端字段统一：如果有 url 字段则映射到 link
  const { url, ...rest } = parsed.data as any;
  const data = { ...rest, ...(url !== undefined ? { link: url } : {}) };

  const r = await prisma.position.updateMany({
    where: { id, userId },
    data,
  });

  if (r.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 返回更新后的对象（再查一次）
  const updated = await prisma.position.findFirst({ where: { id, userId } });
  return NextResponse.json(updated);
}

// 删除
export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const r = await prisma.position.deleteMany({ where: { id, userId } });
  if (r.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
