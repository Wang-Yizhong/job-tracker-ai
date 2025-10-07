// --- file: src/app/api/resumes/parse/route.ts
import { NextResponse } from "next/server";
import { getFileBufferByKey } from "@/lib/resume-storage";
import { extractTextFromFile, toStructuredResume } from "@/lib/parse-resume";

export const runtime = "nodejs";

// 可配置：允许的下载域名（避免 SSRF）。你的 Supabase 项目域名放这里。
const URL_WHITELIST = [
  "tyvshioiuupglckpvgxu.supabase.co",//dev
  "tysadejbjdmplxambrfq.supabase.co"//pro
];

const MAX_BYTES = 15 * 1024 * 1024; // 15MB 上限（可按需调整）
const FETCH_TIMEOUT_MS = 20_000;    // 20s 下载超时

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
    lower.endsWith(".pdf") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx");
  const ctOk =
    !contentType ||
    /application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/i.test(
      contentType
    );
  return extOk || ctOk;
}

// 安全读取 Body，限制体积
async function readBodyWithCap(res: Response, cap = MAX_BYTES): Promise<Buffer> {
  const reader = res.body?.getReader();
  if (!reader) {
    // 某些运行时不暴露 reader，退回 arrayBuffer（会一次性分配，仍需长度校验）
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

export async function POST(req: Request) {
  try {
    const { fileKey, filename, url } = await req.json();

    let buf: Buffer;
    let finalFilename = filename as string | undefined;

    if (url) {
      // --- 1) 仅允许白名单域名 ---
      let u: URL;
      try {
        u = new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }
      if (!isAllowedHost(u)) {
        return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
      }

      // --- 2) 先用 HEAD 看大小 & 类型（若服务端允许） ---
      try {
        const head = await fetch(url, { method: "HEAD", cache: "no-store" });
        const len = head.headers.get("content-length");
        const ct = head.headers.get("content-type");
        if (len && Number(len) > MAX_BYTES) {
          return NextResponse.json({ error: "File too large" }, { status: 413 });
        }
        // 文件名推断
        if (!finalFilename) {
          const disp = head.headers.get("content-disposition");
          const fromDisp = disp?.match(/filename\*?=.*?['"]?([^'"]+)['"]?$/i)?.[1];
          finalFilename = inferFilename(fromDisp || u.pathname);
        }
        // 类型/扩展名粗校验
        if (!looksLikeSupported(finalFilename!, ct)) {
          return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
        }
      } catch {
        // HEAD 失败不致命，继续走 GET
        if (!finalFilename) finalFilename = inferFilename(u.pathname);
      }

      // --- 3) 带超时的下载 + 大小上限 ---
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

      buf = await readBodyWithCap(r, MAX_BYTES);
    } else {
      // --- 4) 兼容旧用法：fileKey 读存储 ---
      if (!fileKey) {
        return NextResponse.json({ error: "缺少 fileKey 或 url" }, { status: 400 });
      }
      buf = await getFileBufferByKey(fileKey);
      if (!finalFilename) {
        // 从 key 推断文件名
        finalFilename = inferFilename(fileKey);
      }
      if (!looksLikeSupported(finalFilename)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
      }
    }

    if (!buf?.length) {
      return NextResponse.json({ error: "未读到文件内容" }, { status: 422 });
    }

    // --- 5) 解析文本 ---
    const text = await extractTextFromFile(buf, finalFilename || "resume");
    if (!text?.trim()) {
      return NextResponse.json({ error: "未能从文件中提取文本" }, { status: 422 });
    }

    // --- 6) 结构化 ---
    const data = toStructuredResume(text);
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("parse error:", err);
    const msg = typeof err?.message === "string" ? err.message : "解析失败";
    const code =
      /too large/i.test(msg) ? 413 :
      /timeout|aborted/i.test(msg) ? 504 :
      500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
