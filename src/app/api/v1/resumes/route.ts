// --- file: src/app/api/resumes/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { cookieName, verifySessionValue } from "@/lib/session";
import { Api } from "@/lib/api/server";

export const runtime = "nodejs";

// 最小 body 校验：title 必填；language 可选，规范为小写字符串
const CreateSchema = z.object({
  title: z.string().trim().min(1),
  language: z.string().trim().max(16).optional(),
});

// GET /api/resumes  → { items }
export const GET = Api.handle(async () => {
  try {
    const cookieStore = await cookies(); // 你的环境需要 await
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
});

// POST /api/resumes  → created（201）
export const POST = Api.handle(async (req: Request) => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const raw = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      // 保持原有错误文案
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    const { title, language } = parsed.data;

    const created = await prisma.resumeSeries.create({
      data: {
        userId: session.uid,
        title: title.trim(),
        language: language ? language.toLowerCase() : null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
});
