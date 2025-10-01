// --- file: src/app/api/resumes/[seriesId]/activate/route.ts
import type { NextRequest, RouteContext } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

/**
 * POST /api/resumes/:seriesId/activate
 * body: { versionId: string }
 * 将指定 version 设为该系列的 activeVersionId
 */
export async function POST(
  req: NextRequest,
  { params }: RouteContext<{ seriesId: string }>
) {
  try {
    const cookieStore = await cookies(); // Next 15 路由里使用 await OK
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { versionId } = await req.json();
    const { seriesId } = params;

    if (!versionId || typeof versionId !== "string") {
      return NextResponse.json({ error: "versionId required" }, { status: 400 });
    }

    // 校验：version 属于该 series，且 series 属于当前用户
    const exists = await prisma.resumeVersion.findFirst({
      where: {
        id: versionId,
        seriesId,
        series: { userId: session.uid },
      },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // 更新 activeVersionId（这里默认你在 Prisma 中允许用 {id, userId} 作为唯一 where；否则可以先 findFirst 再用 update）
    const updated = await prisma.resumeSeries.update({
      where: { id: seriesId, userId: session.uid },
      data: { activeVersionId: versionId },
      include: {
        activeVersion: true,
        versions: { orderBy: { uploadedAt: "desc" } },
      },
    });

    return NextResponse.json({ ok: true, series: updated }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
