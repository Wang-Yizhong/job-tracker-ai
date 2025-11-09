// --- file: src/app/api/v1/resumes/upload/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer, RESUME_BUCKET } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { verifySessionValue, cookieName } from "@/lib/session";
import { prisma } from "@/lib/prisma"; // ← Prisma 客户端

export const runtime = "nodejs";

// 统一返回格式
function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}
function fail(code: number, message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status: code }
  );
}

// 允许的类型 / 大小
const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// 可选语言字段
const BodySchema = z.object({
  language: z.string().trim().min(1).max(10).regex(/^[a-zA-Z-]+$/).optional(),
});

function safeExt(name: string): string {
  const parts = name.split(".");
  if (parts.length < 2) return "bin";
  const raw = parts.pop() || "bin";
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return clean || "bin";
}

export async function POST(req: Request) {
  try {
    // 1) 鉴权
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return fail(401, "UNAUTHORIZED");
    const userId = session.uid;

    // 2) 表单 & 校验
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const languageRaw = (form.get("language") as string | null) ?? undefined;

    if (!file) return fail(400, "No file");
    if (!ALLOWED.has(file.type)) return fail(415, "UNSUPPORTED_MEDIA_TYPE");
    if (file.size > MAX_SIZE) return fail(413, "PAYLOAD_TOO_LARGE");

    const parsed = BodySchema.safeParse({ language: languageRaw });
    if (!parsed.success) return fail(400, "Invalid language");
    const language = parsed.data.language ? parsed.data.language.toLowerCase() : null;

    // 3) 上传到存储（Supabase）
    const ext = safeExt(file.name);
    const langPart = language ? `${language}/` : "";
    const storageKey = `${userId}/${langPart}${randomUUID()}.${ext}`;

    const supabase = supabaseServer();
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(storageKey, bytes, { contentType: file.type, upsert: false });

    if (uploadErr) return fail(500, "STORAGE_UPLOAD_FAILED", uploadErr.message);

    // 4) DB 落库：找到/创建系列 → 创建版本 →（如无激活版本则设为新版本）
    const titleFallback = language === "en" ? "English CV" : "Lebenslauf";

    const result = await prisma.$transaction(async (tx) => {
      // 4.1 找已有系列（按 userId + language）
      let series = await tx.resumeSeries.findFirst({
        where: { userId, language: language ?? undefined },
        orderBy: { updatedAt: "desc" },
      });

      // 4.2 没有就创建一个系列
      if (!series) {
        series = await tx.resumeSeries.create({
          data: {
            userId,
            title: titleFallback,
            language: language ?? undefined,
          },
        });
      }

      // 4.3 创建一个版本
      const version = await tx.resumeVersion.create({
        data: {
          seriesId: series.id,
          fileKey: storageKey,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          // uploadedAt 有默认 now()
        },
      });

      // 4.4 若系列还没有 activeVersionId，则把新版本设为激活
      if (!series.activeVersionId) {
        series = await tx.resumeSeries.update({
          where: { id: series.id },
          data: { activeVersionId: version.id },
        });
      } else {
        // 触发 updatedAt（让列表排序及时变化）
        await tx.resumeSeries.update({
          where: { id: series.id },
          data: { updatedAt: new Date() },
        });
      }

      return { series, version };
    });

    // 5) 返回契约数据（前端可直接显示 & 刷新历史）
    return ok({
      resumeId: result.series.id,
      versionId: result.version.id,
      fileName: file.name,
      mime: file.type,
      size: file.size,
      uploadedAt: result.version.uploadedAt.toISOString?.() ?? new Date().toISOString(),
      fileKey: storageKey,
      language: language ?? null,
    });
  } catch (e: any) {
    return fail(500, "INTERNAL", e?.message ?? "Upload failed");
  }
}
