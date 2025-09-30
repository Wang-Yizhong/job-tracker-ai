// app/api/resend-verify/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueEmailVerifyToken } from "@/lib/verify";
// 和 register 使用同一个函数/签名，避免分叉
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(req: Request) {
  try {
    const { email } = bodySchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    // 生产可返回 200 以防枚举，但开发期建议带 hint
    if (!user) {
      return NextResponse.json({ ok: true, _devHint: "user_not_found" });
    }
    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const token = await issueEmailVerifyToken(user.id);
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "ISSUE_TOKEN_FAILED" },
        { status: 500 }
      );
    }

    // 与 register 完全一致的调用方式（对象参数）
    const result = await sendVerificationEmail({ to: email, token });
    console.log("[resend-verify] send ok", {
      email,
      providerResult: result,
      tokenPreview: token.slice(0, 8),
    });

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (e: any) {
    console.error("[resend-verify] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR" },
      { status: 500 }
    );
  }
}
