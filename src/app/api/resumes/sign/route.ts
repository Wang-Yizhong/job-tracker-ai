// --- file: src/app/api/resumes/sign/route.ts
import { NextResponse } from "next/server";
import { supabaseServer, RESUME_BUCKET } from "@/lib/supabase";
import { cookies } from "next/headers";
import { verifySessionValue, cookieName } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { fileKey, downloadName } = await req.json();

    if (typeof fileKey !== "string" || !fileKey.trim()) {
      return NextResponse.json({ error: "Invalid fileKey" }, { status: 400 });
    }

    const token = cookies().get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // 用户隔离：fileKey 必须以 uid 开头（如 "uid/xxx.docx"）
    if (!fileKey.startsWith(session.uid)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = supabaseServer();

    // 10 分钟有效；如需强制下载文件名，可传 downloadName
    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      // v2 客户端支持第三个参数 { download?: string }
      .createSignedUrl(fileKey, 60 * 10, downloadName ? { download: downloadName } : undefined as any);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 从 fileKey 提取原始文件名（最后一段）
    const filename = fileKey.split("/").pop() || "resume.docx";

    // 为了前端方便，直接返回 filename
    return NextResponse.json({ url: data.signedUrl, filename });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
