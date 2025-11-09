// src/app/api/v1/login/route.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";
import { createSessionValue } from "@/lib/session";
import { Api } from "@/lib/api/server";                 // ✅ 统一拦截/响应
import { parseJson } from "@/lib/validation/zod";       // ✅ Zod 校验助手

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "jobtracker_session";

// Zod schema（把 email 统一转小写）
const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password required"),
  rememberMe: z.boolean().optional(),
});
export type LoginDto = z.infer<typeof LoginSchema>;

// 用统一拦截器包裹，自动 try/catch + 统一错误结构
export const POST = Api.handle(async (req: Request) => {
  // ① Zod 校验（失败会抛出 VALIDATION_ERROR，并被 Api.handle 收敛）
  const { email, password, rememberMe } = await parseJson(req, LoginSchema);

  // ② 查用户并校验密码
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Api.AppError("INVALID_CREDENTIALS", "Invalid credentials", 401);

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) throw new Api.AppError("INVALID_CREDENTIALS", "Invalid credentials", 401);

  if (!user.emailVerified) {
    throw new Api.AppError("EMAIL_NOT_VERIFIED", "Email not verified", 403);
  }

  // ③ 生成会话并设置 Cookie
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4); // 30d or 4h
  const token = createSessionValue({ uid: user.id, iat: now, exp });

  // 用 Api.ok 生成 NextResponse，再设置 cookie
  const res = Api.ok({ id: user.id, email: user.email }); // 前端 axios 会拿到 {id,email}
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4,
  });
  return res;
});
