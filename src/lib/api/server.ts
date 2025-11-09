import { NextResponse } from "next/server";

/** 统一业务错误 */
export class AppError extends Error {
  code: string; status: number; details?: unknown;
  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message); this.code = code; this.status = status; this.details = details;
  }
}

/** 成功/失败响应（与你的 axios 契约一致） */
const ok = <T>(data: T, status = 200) =>
  NextResponse.json({ ok: true, data }, { status });

const err = (code: string, message: string, status = 400, details?: unknown) =>
  NextResponse.json({ code, message, details }, { status });

/** 统一拦截：自动 try/catch、统一结构 */
function handle(fn: (...args: any[]) => Promise<Response | any>) {
  return async (...args: any[]): Promise<Response> => {
    try {
      const out = await fn(...args);
      if (out instanceof Response) return out;
      return ok(out);
    } catch (e: any) {
      if (e instanceof AppError) return err(e.code, e.message, e.status, e.details);
      const msg = typeof e?.message === "string" ? e.message : "Internal error";
      return err("SERVER_ERROR", msg, 500);
    }
  };
}

/** 常用错误工厂 */
const E = {
  Validation: (details?: unknown) => new AppError("VALIDATION_ERROR", "Invalid request", 422, details),
  Unauthorized: () => new AppError("UNAUTHORIZED", "Unauthorized", 401),
  Forbidden: () => new AppError("FORBIDDEN", "Forbidden", 403),
  NotFound: (msg = "Not found") => new AppError("NOT_FOUND", msg, 404),
  Conflict: (msg = "CONFLICT", ) => new AppError("CONFLICT", msg, 409),
  RateLimited: (msg = "Too Many Requests") => new AppError("RATE_LIMITED", msg, 429),
};

export const Api = { ok, err, handle, AppError, E };
