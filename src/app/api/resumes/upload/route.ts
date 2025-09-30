import { NextResponse } from "next/server";
import { supabaseServer, RESUME_BUCKET } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { verifySessionValue, cookieName } from "@/lib/session";

export const runtime = "nodejs";

const ALLOWED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const language = (form.get("language") as string | null) || null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 });

    const cookieStore = await cookies();                   // ✅ await
    const token = cookieStore.get(cookieName)?.value;
    const session = token ? verifySessionValue(token) : null;
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const userId = session.uid;

    const arrayBuf = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";

    // e.g. userId/en/<uuid>.pdf
    const langPart = language ? `${language.toLowerCase()}/` : "";
    const key = `${userId}/${langPart}${randomUUID()}.${ext}`;

    const supabase = supabaseServer();
    const { error: uploadErr } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(key, bytes, { contentType: file.type, upsert: false });
    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, fileKey: key, mimeType: file.type });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
