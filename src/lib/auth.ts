// src/lib/auth.ts
import { cookies } from "next/headers";
import {
  cookieName,
  verifySessionValue,
  type SessionPayload,
} from "@/lib/session";

/**
 * 读取并验证会话，返回完整 payload（uid/iat/exp）；失败返回 null
 * 说明：在某些 Next.js 配置里 cookies() 被推断为 Promise，因此这里统一用 async/await。
 */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies(); // ✅ 关键：await，避免 “Property 'get' does not exist on type 'Promise<...>'”
  const raw = jar.get(cookieName)?.value;
  if (!raw) return null;

  const payload = verifySessionValue(raw);
  return payload ?? null;
}

/** 兼容你原先的函数：仅返回 uid，失败返回 null（async 版） */
export async function requireUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.uid ?? null;
}

/** 严格版：无会话或无效直接抛 401，返回完整 payload（async 版） */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}

/** 若只需 uid 且未登录要直接 401，用这个（async 版） */
export async function requireUserIdOrThrow(): Promise<string> {
  const s = await requireSession();
  return s.uid;
}

/** 所有权校验：不匹配抛 403 */
export function ensureOwnership(ownerUserId: string, currentUserId: string): void {
  if (ownerUserId !== currentUserId) {
    throw new Response("Forbidden", { status: 403 });
  }
}

/**
 * 路由包装器：自动鉴权并把 session 传给处理函数
 * 用法：
 * export const POST = withAuth(async (req, session) => { ...; return NextResponse.json(...); });
 */
export function withAuth(
  handler: (req: Request, session: SessionPayload) => Response | Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const session = await requireSession(); // 未登录时抛 401
    return handler(req, session);
  };
}
