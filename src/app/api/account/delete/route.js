import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; // 假设有一个方法获取当前用户

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    // 删除用户的所有相关数据（职位、简历等）
    await prisma.position.deleteMany({ where: { userId: user.id } });
    await prisma.resume.deleteMany({ where: { userId: user.id } });

    // 最后删除用户本身
    await prisma.user.delete({ where: { id: user.id } });

    // 清除 Cookie / Session
    const res = NextResponse.json({ success: true });
    res.cookies.set("jobtracker_session", "", { maxAge: 0 });
    return res;
  } catch (err: any) {
    console.error("Account delete error:", err);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
