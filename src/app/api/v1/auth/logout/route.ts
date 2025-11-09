// --- file: src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookieName } from "@/lib/session";
import { Api } from "@/lib/api/server";

// 保持返回结构 { success: true }
export const POST = Api.handle(async () => {
  const res = NextResponse.json({ success: true });

  // 清空同名 cookie（立即过期）
  res.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return res;
});
