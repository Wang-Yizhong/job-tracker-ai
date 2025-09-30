// --- file: src/app/api/resumes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies(); // ✅ 必须 await
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const items = await prisma.resumeSeries.findMany({
      where: { userId: session.uid },
      orderBy: { updatedAt: "desc" },
      include: {
        versions: { orderBy: { uploadedAt: "desc" }, take: 50 },
        activeVersion: true,
      },
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies(); // ✅ 必须 await
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { title, language } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    const created = await prisma.resumeSeries.create({
      data: {
        userId: session.uid,
        title: title.trim(),
        language: language ? String(language).toLowerCase() : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
