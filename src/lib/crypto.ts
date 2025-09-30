import { randomBytes, createHash } from "crypto";
import argon2 from "argon2";

export async function hashPassword(pw: string) {
  return argon2.hash(pw, { type: argon2.argon2id });
}
export async function verifyPassword(hash: string, pw: string) {
  return argon2.verify(hash, pw);
}

export function createRawToken(bytes = 32) {
  return randomBytes(bytes).toString("hex"); // 明文（仅邮件/开发返回）
}
export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex"); // 入库
}