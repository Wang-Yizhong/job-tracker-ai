import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeEmailVerifyToken } from "@/lib/verify";
import { Api } from "@/lib/api/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ token: z.string().min(10) });

export const POST = Api.handle(async (req: Request) => {
  try {
    // 解析 + 校验（保持 400 语义）
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    console.log(parsed,'ss');
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 400 }
      );
    }
    const { token } = parsed.data;

    // 消费验证令牌
    const r = await consumeEmailVerifyToken(token);
    console.log("[verify-email] result", r);

    if (!r.ok) {
      // 业务失败：复用下游的结构与信息
      return NextResponse.json(r, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[verify-email] error", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 400 }
    );
  }
});
