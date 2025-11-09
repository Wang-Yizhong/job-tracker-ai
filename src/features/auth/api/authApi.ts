// --- file: src/features/auth/api/authApi.ts
import { http } from "@/lib/api/http";
import { joinApiPath } from "@/lib/api/config";

// DTOs（可与后端 zod 对齐）
export type LoginDto = { email: string; password: string; rememberMe?: boolean };
export type RegisterDto = { email: string; password: string };
export type ResendVerifyDto = { email: string };
export type VerifyEmailDto = { token: string };

export type MeResp =
  | { user: { id: string; email: string } }
  | { user: null };

const base = {
  auth: (p = "") => joinApiPath(`/auth${p}`),
  user: (p = "") => joinApiPath(`/user${p}`),
  security: (p = "") => joinApiPath(`/security${p}`),
};

// 首次写操作前，如无 csrf，可显式调用；如果你的 http 拦截器会自动拉取，也可不暴露
export async function getCsrf() {
  return http.get<{ ok: true }>(base.security("/csrf"));
}

export async function login(payload: LoginDto) {
  // 服务端通过 Set-Cookie 发会话；这里返回 { ok, id, email }（按你的后端）
  return http.post<{ ok: true; id: string; email: string }>(
    base.auth("/login"),
    payload
  );
}

export async function logout() {
  // 返回 { success: true }；服务端同时清 cookie
  return http.post<{ success: true }>(base.auth("/logout"), {});
}

export async function register(payload: RegisterDto) {
  // 可能是 { ok:true, emailSent:true } 或 { ok:true, alreadyVerified:true }
  return http.post<{ ok: true; emailSent?: boolean; alreadyVerified?: boolean }>(
    base.auth("/register"),
    payload
  );
}

export async function resendVerify(payload: ResendVerifyDto) {
  // 统一返回 200，可能是 {ok:true,emailSent:true} / {ok:true,alreadyVerified:true} / {_devHint:"user_not_found"}
  return http.post<
    | { ok: true; emailSent?: boolean; alreadyVerified?: boolean }
    | { ok: true; _devHint?: string }
  >(base.auth("/resend-verify"), payload);
}


export type VerifyEmailResp =
  | { ok: true }
  | { ok: false; code?: "TOKEN_NOT_FOUND" | "TOKEN_EXPIRED" | "INVALID_TOKEN"; error?: string };

/** POST /api/v1/auth/verify-email  */
export async function verifyEmail(payload: VerifyEmailDto) {
  // http 拦截器已处理 CSRF/错误提示；这里保持最薄
  return http.post<VerifyEmailResp>(joinApiPath("/auth/verify-email"), payload);
}

export async function getCurrentUser() {
  // GET /api/v1/user/userInfo
  return http.get<MeResp>(base.user("/userInfo"));
}
