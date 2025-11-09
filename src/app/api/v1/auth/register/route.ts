// --- file: src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { issueEmailVerifyToken } from "@/lib/verify";
import { sendVerificationEmail } from "@/lib/email";
import { Api } from "@/lib/api/server";
import { parseJson } from "@/lib/validation/zod";

export const runtime = "nodejs";          // 避免 Edge 限制
export const dynamic = "force-dynamic";   // 禁止缓存

// Zod 校验
const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = Api.handle(async (req: Request) => {
  // ① 解析并校验 body（失败将由 Api.handle 统一返回 422 VALIDATION_ERROR）
  const { email, password } = await parseJson(req, schema);

  // ② 查找或创建用户（不改变 Prisma）
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, passwordHash: await hashPassword(password) },
    });
  }

  // ③ 已验证：保持原成功结构
  if (user.emailVerified) {
    const body: any = { ok: true, alreadyVerified: true };
    if (process.env.NODE_ENV !== "production") {
      body.devNote = "用户已验证，未重发 token";
    }
    return NextResponse.json(body);
  }

  // ④ 颁发验证 token 并发送邮件（失败将被 Api.handle 收敛为 500）
  const raw = await issueEmailVerifyToken(user.id); // 假设返回字符串
  console.log("[register] issue token ok", {
    userId: user.id,
    email,
    tokenPreview: raw?.slice(0, 8),
  });

  await sendVerificationEmail({ to: email, token: raw });
  console.log("[register] send mail ok", { email });

  // ⑤ 保持原成功结构
  return NextResponse.json({ ok: true, emailSent: true });
});
