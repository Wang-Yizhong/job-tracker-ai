// src/app/api/.../route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

type Ctx = { params: Record<string, string> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const seriesId = params?.seriesId;
    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }

    const cookieStore = cookies(); // ✅ 同步
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

export async function POST(req: Request, { params }: Ctx) {
  try {
    const seriesId = params?.seriesId;
    if (!seriesId) {
      return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });
    }

    const cookieStore = cookies(); // ✅ 同步
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
