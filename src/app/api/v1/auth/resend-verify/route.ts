// --- file: src/app/api/resend-verify/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { issueEmailVerifyToken } from "@/lib/verify";
import { sendVerificationEmail } from "@/lib/email";
import { Api } from "@/lib/api/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const POST = Api.handle(async (req: Request) => {
  try {
    // 1) 解析 + 校验（保持你原有结构：校验失败 → { ok:false, error }）
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "INVALID_EMAIL", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    // 2) 查用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    });

    // 生产可返回 200 以防枚举，这里保持你的行为
    if (!user) {
      return NextResponse.json({ ok: true, _devHint: "user_not_found" });
    }
    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    // 3) 签发 token
    const token = await issueEmailVerifyToken(user.id);
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "ISSUE_TOKEN_FAILED" },
        { status: 500 }
      );
    }

    // 4) 发信（与 register 保持一致）
    const result = await sendVerificationEmail({ to: email, token });
    console.log("[resend-verify] send ok", {
      email,
      providerResult: result,
      tokenPreview: token.slice(0, 8),
    });

    // 5) 成功结构不变
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (e: any) {
    console.error("[resend-verify] error:", e);
    // 统一兜底，结构不变
    return NextResponse.json(
      { ok: false, error: e?.message ?? "ERROR" },
      { status: 500 }
    );
  }
});
