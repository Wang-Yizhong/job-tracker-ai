// lib/session.ts
import { createHmac, timingSafeEqual } from "crypto";

/** ---------- 可调常量（有默认值，也可用环境变量覆盖） ---------- */

// Cookie 名称：默认生产用 jobtracker_prod_session，开发用 jobtracker_session
export const COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ??
  (process.env.NODE_ENV === "production"
    ? "jobtracker_prod_session"
    : "jobtracker_session");

// 生产环境 Cookie 的 Domain（同域名下所有子域可用）
export const COOKIE_DOMAIN =
  process.env.SESSION_COOKIE_DOMAIN ??
  (process.env.NODE_ENV === "production" ? ".job-tracker.ink" : undefined);

// 有效期：短期 4h，长期 30d
const MAX_AGE_SHORT = 60 * 60 * 4;
const MAX_AGE_LONG = 60 * 60 * 24 * 30;

// HMAC 算法
const ALG = "sha256";

/** ---------- Base64URL helpers ---------- */
function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function unb64url(input: string) {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

/** ---------- Secret 处理：兼容多环境变量 ---------- */
function getSecret(): string {
  const secret =
    process.env.APP_SECRET || process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error("APP_SECRET/JWT_SECRET/AUTH_SECRET is not set");
  return secret;
}

function sign(payloadB64: string) {
  const mac = createHmac(ALG, getSecret());
  mac.update(payloadB64);
  return b64url(mac.digest());
}

/** ---------- 会话结构 ---------- */
export type SessionPayload = {
  uid: string; // user id
  iat: number; // issued at (unix seconds)
  exp: number; // expires at (unix seconds)
};

/** 按“记住我”生成 payload（可选） */
export function issueSessionPayload(uid: string, remember?: boolean): SessionPayload {
  const now = Math.floor(Date.now() / 1000);
  const ttl = remember ? MAX_AGE_LONG : MAX_AGE_SHORT;
  return { uid, iat: now, exp: now + ttl };
}

export function createSessionValue(p: SessionPayload) {
  const payloadB64 = b64url(JSON.stringify(p));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

/** 校验并解析会话值；失败返回 null */
export function verifySessionValue(value: string): SessionPayload | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expected = sign(payloadB64);

  // 先比较长度，不等直接失败；相等再常量时间比较，避免 timingSafeEqual 抛错
  const sigBuf = unb64url(sig);
  const expBuf = unb64url(expected);
  if (sigBuf.length !== expBuf.length) return null;

  try {
    const ok = timingSafeEqual(sigBuf, expBuf);
    if (!ok) return null;
  } catch {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(unb64url(payloadB64).toString()) as SessionPayload;
  } catch {
    return null;
  }

  // 过期判断（允许 30s 轻微时钟偏差的话，可改成 payload.exp + 30）
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

/** ---------- Cookie 选项（生产自动 Secure + Domain + Lax） ---------- */
export const cookieOptions = (remember?: boolean) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: remember ? MAX_AGE_LONG : MAX_AGE_SHORT,
  // 线上多域或 www/裸域切换时务必加 domain，确保都能读到
  domain: COOKIE_DOMAIN,
});

/** 为兼容你现有的导入名称 */
export const cookieName = COOKIE_NAME;
