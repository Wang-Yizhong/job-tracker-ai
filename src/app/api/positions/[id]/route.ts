// --- file: src/app/api/positions/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { updatePositionSchema } from "@/lib/validation/position";

export const runtime = "nodejs";

// GET /api/positions/[id]
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;             // 👈 await
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const item = await prisma.position.findFirst({ where: { id, userId } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(item);
}

// PUT /api/positions/[id]
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;             // 👈 await
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const body = await req.json();
  const parsed = updatePositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { url, ...rest } = parsed.data as any;
  const data = { ...rest, ...(url !== undefined ? { link: url } : {}) };

  const r = await prisma.position.updateMany({ where: { id, userId }, data });
  if (r.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.position.findFirst({ where: { id, userId } });
  return NextResponse.json(updated);
}

// DELETE /api/positions/[id]
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;             // 👈 await
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const r = await prisma.position.deleteMany({ where: { id, userId } });
  if (r.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
