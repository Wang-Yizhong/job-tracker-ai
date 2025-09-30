import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, cookieName } from "@/lib/session";

export async function GET() {
  try {
    // Next.js App Router dev 模式下，cookies() 需要 await
    const jar = await cookies();
    const token = jar.get(cookieName)?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = verifySessionValue(token);
    if (!payload?.uid) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.uid },
      select: { id: true, email: true }, // 只返回最小必要字段
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("userInfo error:", err);
    return NextResponse.json({ error: "Failed to fetch user info" }, { status: 500 });
  }
}
