import type { NextRequest } from "next/server";
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
  req: NextRequest,
  ctx: { params: Promise<{ seriesId: string }> } // ✅ 保持 Promise 形式
) {
  try {
    // ✅ 你当前 Next 版本里 cookies() 返回 Promise，需要 await
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ✅ params 是 Promise，解构时也要 await
    const { seriesId } = await ctx.params;
    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }

    const { versionId } = await req.json();
    if (!versionId || typeof versionId !== "string") {
      return NextResponse.json({ error: "versionId required" }, { status: 400 });
    }

    // 校验 version 归属
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
