import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ seriesId: string }> }          // ✅ params 是 Promise
) {
  try {
    const { seriesId } = await ctx.params;               // ✅ await params
    const cookieStore = await cookies();                 // ✅ await cookies
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const series = await prisma.resumeSeries.findFirst({
      where: { id: seriesId, userId: session.uid },
      include: {
        versions: { orderBy: { uploadedAt: "desc" } },
        activeVersion: true,
      },
    });
    if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(series, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ seriesId: string }> }          // ✅ params 是 Promise
) {
  try {
    const { seriesId } = await ctx.params;               // ✅ await params
    const cookieStore = await cookies();                 // ✅ await cookies
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const fileKey: string | undefined = body.fileKey;
    const fileName: string | undefined = body.fileName || body.filename;
    const mimeType: string | undefined = body.mimeType;
    const fileSize: number | undefined = body.fileSize;
    const note: string | undefined = body.note;

    if (!fileKey || !fileName) {
      return NextResponse.json({ error: "Missing fileKey or fileName" }, { status: 400 });
    }

    // 归属校验
    const series = await prisma.resumeSeries.findFirst({
      where: { id: seriesId, userId: session.uid },
      select: { id: true },
    });
    if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
