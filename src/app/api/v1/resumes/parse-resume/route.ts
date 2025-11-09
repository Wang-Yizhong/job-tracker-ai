// --- file: src/app/api/v1/resumes/parse-resume/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { Api } from "@/lib/api/server";
import { extractTextFromFile, toStructuredResume } from "@/lib/parse-resume";

export const runtime = "nodejs";

// 可配置：允许的下载域名（避免 SSRF）。你的 Supabase 项目域名放这里。
const URL_WHITELIST = [
  "tyvshioiuupglckpvgxu.supabase.co", // dev
  "tysadejbjdmplxambrfq.supabase.co", // pro
];

const MAX_BYTES = 15 * 1024 * 1024; // 15MB 上限
const FETCH_TIMEOUT_MS = 20_000;    // 20s 下载超时

// body 校验：必须有 url，其他字段可选
const BodySchema = z.object({
  url: z.string().url("Invalid URL"),
  filename: z.string().optional(),
});

function isAllowedHost(u: URL) {
  return URL_WHITELIST.includes(u.hostname);
}

function inferFilename(input?: string) {
  if (!input) return "resume";
  const n = decodeURIComponent(input.split("?")[0]).split("/").pop() || "resume";
  return n;
}

function looksLikeSupported(name: string, contentType?: string | null) {
  const lower = name.toLowerCase();
  const extOk =
    lower.endsWith(".pdf") || lower.endsWith(".doc") || lower.endsWith(".docx");
  const ctOk =
    !contentType ||
    /application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/i.test(
      contentType
    );
  return extOk || ctOk;
}

async function readBodyWithCap(res: Response, cap = MAX_BYTES): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) {
    const ab = await res.arrayBuffer();
    if (ab.byteLength > cap) throw new Error("File too large");
    return Buffer.from(ab);
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > cap) {
        reader.cancel().catch(() => {});
        throw new Error("File too large");
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks);
}

// ────────────────────────────────────────────────
// ✅ 统一使用 URL 下载简历进行解析
// ────────────────────────────────────────────────
export const POST = Api.handle(async (req: Request) => {
  try {
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues?.[0]?.message || "Invalid request body";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { url, filename } = parsed.data;
    let finalFilename = filename;

    // 1) 校验白名单域名
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }
    if (!isAllowedHost(u)) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    // 2) HEAD 预检（类型 / 大小）
    try {
      const head = await fetch(url, { method: "HEAD", cache: "no-store" });
      const len = head.headers.get("content-length");
      const ct = head.headers.get("content-type");
      if (len && Number(len) > MAX_BYTES) {
        return NextResponse.json({ error: "File too large" }, { status: 413 });
      }
      if (!finalFilename) {
        const disp = head.headers.get("content-disposition");
        const fromDisp = disp?.match(/filename\*?=.*?['"]?([^'"]+)['"]?$/i)?.[1];
        finalFilename = inferFilename(fromDisp || u.pathname);
      }
      if (!looksLikeSupported(finalFilename!, ct)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
      }
    } catch {
      if (!finalFilename) finalFilename = inferFilename(u.pathname);
    }

    // 3) 下载文件（带超时）
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    const r = await fetch(url, { cache: "no-store", signal: ac.signal });
    clearTimeout(timer);

    if (!r.ok) {
      return NextResponse.json({ error: `Download failed: ${r.status}` }, { status: 400 });
    }

    const ct = r.headers.get("content-type");
    if (!looksLikeSupported(finalFilename!, ct)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    }

    const buf = await readBodyWithCap(r, MAX_BYTES);
    if (!buf?.length) {
      return NextResponse.json({ error: "File empty or unreadable" }, { status: 422 });
    }

    // 4) 提取文本
    const text = await extractTextFromFile(buf, finalFilename || "resume");
    if (!text?.trim()) {
      return NextResponse.json({ error: "No text extracted from file" }, { status: 422 });
    }

    // 5) 结构化解析
    const data = toStructuredResume(text);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("parse error:", err);
    const msg = typeof err?.message === "string" ? err.message : "解析失败";
    const code =
      /too large/i.test(msg)
        ? 413
        : /timeout|aborted/i.test(msg)
        ? 504
        : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
});
