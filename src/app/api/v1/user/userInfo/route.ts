// --- file: src/app/api/user/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifySessionValue, cookieName } from "@/lib/session";
import { Api } from "@/lib/api/server";

export const GET = Api.handle(async () => {
  try {
    // 你的环境下 cookies() 需要 await
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
  } catch (err: any) {
    console.error("userInfo error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 }
    );
  }
});
