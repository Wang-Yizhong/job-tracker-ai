import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

type Params = { params: { seriesId: string } };

// 可选：单个系列详情
export async function GET(_: Request, { params }: Params) {
  const token = cookies().get(cookieName)?.value;
  const session = token ? verifySessionValue(token) : null;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const series = await prisma.resumeSeries.findFirst({
    where: { id: params.seriesId, userId: session.uid },
    include: { versions: { orderBy: { uploadedAt: "desc" } }, activeVersion: true },
  });
  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(series);
}

// 设为默认版本：{ activeVersionId }
export async function PATCH(req: Request, { params }: Params) {
  const token = cookies().get(cookieName)?.value;
  const session = token ? verifySessionValue(token) : null;
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { activeVersionId } = await req.json();
  if (!activeVersionId || typeof activeVersionId !== "string") {
    return NextResponse.json({ error: "activeVersionId required" }, { status: 400 });
  }

  // 校验：version 属于该 series 且 series 属于当前用户
  const ok = await prisma.resumeVersion.findFirst({
    where: { id: activeVersionId, series: { id: params.seriesId, userId: session.uid } },
    select: { id: true },
  });
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.resumeSeries.update({
    where: { id: params.seriesId },
    data: { activeVersionId },
  });

  return NextResponse.json({ ok: true });
}
