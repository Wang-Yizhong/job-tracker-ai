// --- file: src/app/api/resumes/[seriesId]/versions/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

// GET /api/resumes/[seriesId]/versions
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await ctx.params; // ✅ await
    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }

    // ✅ cookies() 需要 await
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

    return NextResponse.json(series, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

// POST /api/resumes/[seriesId]/versions
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await ctx.params; // ✅ await
    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }

    // ✅ cookies() 需要 await
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const fileKey = body["fileKey"] as string | undefined;
    const fileName =
      (body["fileName"] as string | undefined) ??
      (body["filename"] as string | undefined);
    const mimeType = body["mimeType"] as string | undefined;
    const fileSize = body["fileSize"] as number | undefined;
    const note = body["note"] as string | undefined;

    if (!fileKey || !fileName) {
      return NextResponse.json(
        { error: "Missing fileKey or fileName" },
        { status: 400 }
      );
    }

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

    await prisma.resumeSeries.update({
      where: { id: seriesId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
