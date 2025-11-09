// --- file: src/app/api/resumes/[seriesId]/versions/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";
import { Api } from "@/lib/api/server";

export const runtime = "nodejs";

// params 与 body 的最小校验
const ParamsSchema = z.object({ seriesId: z.string().min(1) });
const BodySchema = z.object({
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  note: z.string().optional(),
});

// 兼容 ctx.params 可能是 Promise 的情况
async function readParams<T>(maybePromise: T | Promise<T>): Promise<T> {
  return (maybePromise as any)?.then ? await (maybePromise as Promise<T>) : (maybePromise as T);
}

// GET /api/resumes/[seriesId]/versions
export const GET = Api.handle(async (_req: NextRequest, ctx: { params: { seriesId: string } } | { params: Promise<{ seriesId: string }> }) => {
  try {
    const { seriesId } = ParamsSchema.parse(await readParams((ctx as any).params));

    // 认证（保持你的原逻辑与返回结构）
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const series = await prisma.resumeSeries.findFirst({
      where: { id: seriesId, userId: session.uid },
      include: {
        versions: { orderBy: { uploadedAt: "desc" } },
        activeVersion: true,
      },
    });
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 保持原结构：直接返回 series 对象
    return NextResponse.json(series, { status: 200 });
  } catch (e: any) {
    // 保持原 500 结构
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
});

// POST /api/resumes/[seriesId]/versions
export const POST = Api.handle(async (req: NextRequest, ctx: { params: { seriesId: string } } | { params: Promise<{ seriesId: string }> }) => {
  try {
    const { seriesId } = ParamsSchema.parse(await readParams((ctx as any).params));

    // 认证（保持你的原逻辑与返回结构）
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 读取并兼容老字段：filename → fileName
    const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (raw && typeof raw === "object" && (raw as any).filename && !(raw as any).fileName) {
      (raw as any).fileName = (raw as any).filename;
      delete (raw as any).filename;
    }

    const { fileKey, fileName, mimeType, fileSize, note } = BodySchema.parse(raw);

    // 归属校验
    const series = await prisma.resumeSeries.findFirst({
      where: { id: seriesId, userId: session.uid },
      select: { id: true },
    });
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const version = await prisma.resumeVersion.create({
      data: {
        seriesId,
        fileKey,
        fileName,
        mimeType: mimeType ?? null,
        fileSize: typeof fileSize === "number" ? fileSize : null,
        note: note ?? null,
      },
    });

    // 触发系列更新时间
    await prisma.resumeSeries.update({
      where: { id: seriesId },
      data: { updatedAt: new Date() },
    });

    // 保持原结构：直接返回 version 对象（201）
    return NextResponse.json(version, { status: 201 });
  } catch (e: any) {
    // 保持原 500 结构
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
});
