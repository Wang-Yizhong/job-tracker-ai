import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  const token = randomUUID();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("csrf", token, {
    httpOnly: false,      // 前端 JS 需要读取
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",   // 防第三方上下文携带
    path: "/",
    maxAge: 60 * 60,      // 1 小时（可按需缩短/轮换）
  });
  return res;
}
