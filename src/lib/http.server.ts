// src/lib/http.server.ts
import { NextResponse } from "next/server";

export type ApiOk<T = unknown> = { ok: true; data: T };
export type ApiErr = { ok: false; code: string; message: string; details?: unknown };

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}
export function err(code: string, message: string, init?: number | ResponseInit, details?: unknown) {
  const status = typeof init === "number" ? init : (init as ResponseInit | undefined)?.status ?? 400;
  return NextResponse.json<ApiErr>({ ok: false, code, message, details }, { ...(typeof init === "number" ? { status: init } : init) });
}

export const created = <T>(data: T) => ok<T>(data, 201);
export const noContent = () => new NextResponse(null, { status: 204 });

export type CookieOpts = {
  httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none"; path?: string; maxAge?: number; domain?: string;
};
export function setCookie(res: NextResponse, name: string, value: string, opts: CookieOpts = {}) {
  res.cookies.set(name, value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", ...opts });
  return res;
}

export class AppError extends Error {
  status: number; code: string; details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message); this.status = status; this.code = code; this.details = details;
  }
}

export async function handleRoute<T>(fn: () => Promise<NextResponse<T>>) {
  try { return await fn(); }
  catch (e: any) {
    if (e instanceof AppError) return err(e.code, e.message, e.status, e.details);
    console.error("[UNHANDLED]", e);
    return err("SERVER_ERROR", "Serverfehler. Bitte später erneut versuchen.", 500);
  }
}
