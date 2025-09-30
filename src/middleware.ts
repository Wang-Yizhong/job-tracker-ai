// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// 跟你的登录接口保持一致
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "jobtracker_session";

// 只匹配页面路由，避免 /api、静态资源
export const config = {
  matcher: ["/", "/auth", "/dashboard/:path*", "/verify"], // verify 可按需移除（通常公开）
};

// 如果你已经有 token 验签函数，换成你自己的实现；
// 没有的话先用“有 cookie 就当有效”的占位版本。
async function isSessionValid(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return Boolean(token);
  // 例如用 jose 验签：
  // const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
  // try { await jwtVerify(token!, secret); return true; } catch { return false; }
}

// 只在“目标路径 != 当前路径”时重定向，避免自跳转造成的循环
function redirectIfNeeded(req: NextRequest, toPath: string) {
  if (req.nextUrl.pathname === toPath) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = toPath;
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const valid = await isSessionValid(req);

  // 1) 根路径：按登录态分流（只跳一次）
  if (pathname === "/") {
    return redirectIfNeeded(req, valid ? "/dashboard" : "/auth");
  }

  // 2) 受保护：/dashboard/*
  if (pathname.startsWith("/dashboard")) {
    if (!valid) {
      // 未登录 → 去 /auth（只跳一次）
      return redirectIfNeeded(req, "/auth");
    }
    return NextResponse.next();
  }

  // 3) 已登录用户不应访问 /auth
  if (pathname === "/auth") {
    if (valid) {
      return redirectIfNeeded(req, "/dashboard");
    }
    return NextResponse.next(); // 未登录访问 /auth → 放行
  }

  // 4) 其它（如 /verify）放行
  return NextResponse.next();
}
