import { NextResponse } from "next/server";
import { resend } from "@/lib/email";

// 指定运行时和渲染策略
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 检查关键环境变量
    if (!process.env.RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY");
    }

    if (!process.env.MAIL_FROM) {
      throw new Error("Missing MAIL_FROM");
    }

    const from = process.env.MAIL_FROM; // ✅ 改成 MAIL_FROM
    const to = ["j371959@gmail.com"];

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Hello from Job Tracker 🚀",
      html: "<p>It works! ✅</p>",
    });

    if (error) {
      console.error("[_test-resend] Resend API error:", JSON.stringify(error, null, 2));
      throw new Error(error.message || "Failed to send test email");
    }

    console.log("[_test-resend] Email queued:", data);
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("[_test-resend] Exception:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
