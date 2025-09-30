// app/api/verify-email/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeEmailVerifyToken } from "@/lib/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ token: z.string().min(10) });

export async function POST(req: Request) {
  try {
    const { token } = bodySchema.parse(await req.json());
    const r = await consumeEmailVerifyToken(token);
    console.log("[verify-email] result", r);
    if (!r.ok) return NextResponse.json(r, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[verify-email] error", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 400 });
  }
}
