import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";
import { issueEmailVerifyToken } from "@/lib/verify";
import { sendVerificationEmail } from "@/lib/email";


export const runtime = "nodejs"; // 避免 Edge 限制
export const dynamic = "force-dynamic"; // 禁止缓存


const schema = z.object({
email: z.string().trim().toLowerCase().email(),
password: z.string().min(8),
});


export async function POST(req: Request) {
try {
const { email, password } = schema.parse(await req.json());


let user = await prisma.user.findUnique({ where: { email } });
if (!user) {
user = await prisma.user.create({
data: { email, passwordHash: await hashPassword(password) },
});
}


if (user.emailVerified) {
const body: any = { ok: true, alreadyVerified: true };
if (process.env.NODE_ENV !== "production") body.devNote = "用户已验证，未重发 token";
return NextResponse.json(body);
}


const raw = await issueEmailVerifyToken(user.id); // 假设返回字符串 token；若返回对象，请相应调整
console.log("[register] issue token ok", { userId: user.id, email, tokenPreview: raw?.slice(0, 8) });


await sendVerificationEmail({ to: email, token: raw });
console.log("[register] send mail ok", { email });


return NextResponse.json({ ok: true, emailSent: true });
} catch (err: any) {
console.error("[register] error", err);
return NextResponse.json({ error: err?.message || "注册失败" }, { status: 400 });
}
}