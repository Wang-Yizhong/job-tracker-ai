// src/app/api/login/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/crypto";
import { createSessionValue } from "@/lib/session"; // 只负责生成 token 字符串

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "jobtracker_session";

export async function POST(req: Request) {
  const { email, password, rememberMe } = schema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 });

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return NextResponse.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 });

  if (!user.emailVerified) {
    return NextResponse.json({ error: { code: "EMAIL_NOT_VERIFIED" } }, { status: 403 });
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + (rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4); // 30d or 4h
  const token = createSessionValue({ uid: user.id, iat: now, exp });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4,
    // 注意：一般不要随便设置 domain，除非你非常确定，多数情况下会导致写不进去
  });
  return res;
}
