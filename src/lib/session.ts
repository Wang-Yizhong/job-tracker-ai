// lib/session.ts
import { createHmac, timingSafeEqual } from "crypto";

const ALG = "sha256";
const COOKIE_NAME = "jobtracker_session";
const MAX_AGE_SHORT = 60 * 60 * 4;         // 4小时
const MAX_AGE_LONG  = 60 * 60 * 24 * 30;   // 30天

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64").replace(/=+$/,"").replace(/\+/g,"-").replace(/\//g,"_");
}
function unb64url(input: string) {
  input = input.replace(/-/g,"+").replace(/_/g,"/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64");
}

function assertSecret() {
  if (!process.env.APP_SECRET) {
    throw new Error("APP_SECRET is not set");
  }
  return process.env.APP_SECRET!;
}

function sign(payloadB64: string) {
  const mac = createHmac(ALG, assertSecret());
  mac.update(payloadB64);
  return b64url(mac.digest());
}

export type SessionPayload = {
  uid: string; // user id
  iat: number; // issued at (unix seconds)
  exp: number; // expires at (unix seconds)
};

export function createSessionValue(p: SessionPayload) {
  const payloadB64 = b64url(JSON.stringify(p));
  const sig = sign(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionValue(value: string): SessionPayload | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  const expected = sign(payloadB64);
  try {
    const ok = timingSafeEqual(unb64url(sig), unb64url(expected));
    if (!ok) return null;
  } catch {
    return null; // 长度不同 timingSafeEqual 会抛异常
  }

  const payload = JSON.parse(unb64url(payloadB64).toString()) as SessionPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

// 在开发环境不要强制 Secure，否则 localhost 测试种不上 Cookie
export const cookieOptions = (remember?: boolean) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: remember ? MAX_AGE_LONG : MAX_AGE_SHORT,
});

export const cookieName = COOKIE_NAME;
