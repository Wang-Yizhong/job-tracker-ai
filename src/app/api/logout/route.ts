// src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookieName } from "@/lib/session";

export async function POST() {
  const res = NextResponse.json({ success: true });
  // 清空同名 cookie
  res.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return res;
}
