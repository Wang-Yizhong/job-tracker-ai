// --- file: src/app/api/resumes/sign/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { supabaseServer, RESUME_BUCKET } from "@/lib/supabase";
import { verifySessionValue, cookieName } from "@/lib/session";
import { Api } from "@/lib/api/server";

// 最小 body 校验：fileKey 必填，downloadName 可选
const BodySchema = z.object({
  fileKey: z.string().trim().min(1, "Invalid fileKey"),
  downloadName: z.string().trim().optional(),
});

export const POST = Api.handle(async (req: Request) => {
  try {
    // 1) 解析 + 校验（保持原 400 错误语义）
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid fileKey" }, { status: 400 });
    }
    const { fileKey, downloadName } = parsed.data;

    // 2) 认证（与你现有逻辑一致；当前环境下 cookies() 需要 await）
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 3) 用户隔离：fileKey 必须以 uid 开头（如 "uid/xxx.docx"）
    if (!fileKey.startsWith(session.uid)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4) 生成签名 URL（10 分钟有效）
    const supabase = supabaseServer();
    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      // v2 客户端第三个参数支持 { download?: string }
      .createSignedUrl(fileKey, 60 * 10, downloadName ? { download: downloadName } : undefined as any);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5) 返回结构保持不变
    const filename = fileKey.split("/").pop() || "resume.docx";
    return NextResponse.json({ url: data.signedUrl, filename });
  } catch (e: any) {
    // 兜底保持原结构
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
});
