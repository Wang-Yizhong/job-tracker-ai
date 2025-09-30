// --- file: src/app/api/resumes/[seriesId]/activate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

/**
 * POST /api/resumes/:seriesId/activate
 * body: { versionId: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Record<string, string> }   // ✅ 内联类型，别用别名/接口
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const seriesId = params?.seriesId;
    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }

    const { versionId } = await req.json();
    if (!versionId || typeof versionId !== "string") {
      return NextResponse.json({ error: "versionId required" }, { status: 400 });
    }

    // 校验：version 属于该 series，且 series 属于当前用户
    const exists = await prisma.resumeVersion.findFirst({
      where: { id: versionId, seriesId, series: { userId: session.uid } },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // 防越权更新
    const r = await prisma.resumeSeries.updateMany({
      where: { id: seriesId, userId: session.uid },
      data: { activeVersionId: versionId, updatedAt: new Date() },
    });
    if (r.count === 0) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    const updated = await prisma.resumeSeries.findFirst({
      where: { id: seriesId, userId: session.uid },
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
