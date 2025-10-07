// lib/http.ts
import { NextResponse } from "next/server";

function toInit(init?: number | ResponseInit): ResponseInit | undefined {
  return typeof init === "number" ? { status: init } : init;
}

export function json(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, toInit(init));
}

export type CookieOpts = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge?: number;
};

export function setCookie(res: NextResponse, name: string, value: string, opts: CookieOpts) {
  res.cookies.set(name, value, opts);
  return res;
}
