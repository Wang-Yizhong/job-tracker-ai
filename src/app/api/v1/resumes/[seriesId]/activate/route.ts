// --- file: src/app/api/resumes/[seriesId]/activate/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";
import { Api } from "@/lib/api/server";

export const runtime = "nodejs";

/**
 * POST /api/resumes/:seriesId/activate
 * body: { versionId: string }
 * 返回结构保持不变：
 *  - 401: { error: "Not authenticated" }
 *  - 400: { error: "Missing seriesId" } | { error: "versionId required" }
 *  - 404: { error: "Version not found" } | { error: "Series not found" }
 *  - 200: { ok: true, series: ... }
 *  - 500: { error: "Failed" }
 */
export const POST = Api.handle(async (req: NextRequest, ctx: { params: { seriesId: string } } | { params: Promise<{ seriesId: string }> }) => {
  try {
    // 1) 会话校验（保持你原有逻辑与返回结构）
    const cookieStore = await cookies(); // 你的工程里使用 await，这里保持一致
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2) 兼容同步/异步 params
    const rawParams: any = (ctx as any)?.params;
    const params = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams;

    // 3) params 校验（保持原有 400 文案）
    const ParamsSchema = z.object({ seriesId: z.string().min(1) });
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }
    const { seriesId } = parsedParams.data;

    // 4) body 校验（保持原有 400 文案）
    const BodySchema = z.object({ versionId: z.string().min(1) });
    const json = await req.json().catch(() => null);
    const parsedBody = BodySchema.safeParse(json);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "versionId required" }, { status: 400 });
    }
    const { versionId } = parsedBody.data;

    // 5) 校验归属：version 必须存在且归属于该 series 且该 series 属于当前用户
    const exists = await prisma.resumeVersion.findFirst({
      where: { id: versionId, seriesId, series: { userId: session.uid } },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // 6) 防越权更新（updateMany + where 带 userId）
    const r = await prisma.resumeSeries.updateMany({
      where: { id: seriesId, userId: session.uid },
      data: { activeVersionId: versionId, updatedAt: new Date() },
    });
    if (r.count === 0) {
      return NextResponse.json({ error: "Series not found" }, { status: 404 });
    }

    // 7) 查询并返回（结构保持不变）
    const updated = await prisma.resumeSeries.findFirst({
      where: { id: seriesId, userId: session.uid },
      include: {
        activeVersion: true,
        versions: { orderBy: { uploadedAt: "desc" } },
      },
    });

    return NextResponse.json({ ok: true, series: updated }, { status: 200 });
  } catch (e: any) {
    // 兜底保持原 500 结构
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
});
