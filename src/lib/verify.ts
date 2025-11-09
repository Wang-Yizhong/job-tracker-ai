import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const EMAIL_VERIFY = "EMAIL_VERIFY";
const DEFAULT_EXPIRES_HOURS = 24;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// 生成 URL-safe 明文 token
function generateToken() {
  return crypto.randomBytes(32).toString("base64url"); // base64url 避免 +/= 符号
}

export type VerifyConsumeResult =
  | { ok: true }
  | { ok: false; code: "TOKEN_NOT_FOUND" | "TOKEN_EXPIRED" };

/**
 * 签发邮箱验证 token
 */
export async function issueEmailVerifyToken(
  userId: string,
  opts?: { hours?: number }
): Promise<string> {
  const hours = opts?.hours ?? DEFAULT_EXPIRES_HOURS;

  // // 删除旧 token
  await prisma.verificationToken.deleteMany({
    where: { userId, type: EMAIL_VERIFY },
  });

  const raw = generateToken();
  const hash = sha256(raw);
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

  await prisma.verificationToken.create({
    data: { userId, hash, type: EMAIL_VERIFY, expiresAt },
  });

  return raw; // 返回明文，拼到邮件链接里
}

/**
 * 消费邮箱验证 token
 */
export async function consumeEmailVerifyToken(rawToken: string): Promise<VerifyConsumeResult> {
  // 🔑 这里补上 sha256
  const hash = sha256(rawToken);
console.log(hash,'看看对的上不');
  const rec = await prisma.verificationToken.findFirst({
    where: { hash, type: EMAIL_VERIFY },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!rec) return { ok: false, code: "TOKEN_NOT_FOUND" };

  if (rec.expiresAt.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { id: rec.id } });
    return { ok: false, code: "TOKEN_EXPIRED" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: rec.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { id: rec.id } }),
  ]);

  return { ok: true };
}
