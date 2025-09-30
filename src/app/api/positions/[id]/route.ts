// --- file: src/app/api/positions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { updatePositionSchema } from "@/lib/validation/position";

type Ctx = { params: { id: string } };

// 读单条（可选）
export async function GET(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.position.findFirst({
    where: { id: params.id, userId },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item); // 或 { data: item }
}

// 更新
export async function PUT(req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updatePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 如果你的 DB 字段是 link 而前端传 url，这里做一次映射；若已统一成 url，可删除这段。
  const { url, ...rest } = parsed.data as any;
  const data = { ...rest, ...(url !== undefined ? { link: url } : {}) };

  try {
    const updated = await prisma.position.update({
      where: { id: params.id, /* 如果有复合唯一键可加 userId */ },
      data,
    });
    return NextResponse.json(updated); // 前端的 fetchJSON<Job> 期望直接是对象
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// 删除
export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.position.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
