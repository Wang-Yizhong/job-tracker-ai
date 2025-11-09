// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookieName as SESSION_COOKIE_NAME } from "@/lib/session";

const CSRF_COOKIE = "csrf";

// 只匹配页面 & API，静态资源走默认链路
export const config = {
  matcher: ["/", "/auth", "/dashboard/:path*", "/verify", "/api/:path*"],
};
// —— 工具：设置安全响应头（浏览器侧加固）——
function setSecurityHeaders(res: NextResponse) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://api.resend.com",
    "frame-ancestors 'none'",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  return res;
}

// —— 工具：站内重定向（保留查询串，避免循环）——
function sameSiteRedirect(req: NextRequest, toPath: string) {
  if (req.nextUrl.pathname === toPath) return NextResponse.next();
  if (toPath.startsWith("http:") || toPath.startsWith("https:") || toPath.startsWith("//")) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = toPath;
  url.search = req.nextUrl.search; // 保留 ?query
  return NextResponse.redirect(url);
}

// —— 快速“存在性”判断（不做验签；真正验签在后端）——
function hasSessionCookie(req: NextRequest) {
  return Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);
}

// —— 写接口 CSRF 校验（Double-Submit：header 对比 cookie）——
function assertCsrfForWrite(req: NextRequest) {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return;
  const header = req.headers.get("x-csrf-token");
  const cookie = req.cookies.get(CSRF_COOKIE)?.value;
  if (!header || !cookie || header !== cookie) {
    return new NextResponse(null, { status: 403 });
  }
  return undefined;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) API：先做写方法 CSRF，再统一加安全头
  if (pathname.startsWith("/api/")) {
    const csrfBlock = assertCsrfForWrite(req);
    if (csrfBlock) return csrfBlock;
    return setSecurityHeaders(NextResponse.next());
  }

  // 2) 页面：根据会话 Cookie 是否存在做分流（不验签）
  const loggedIn = hasSessionCookie(req);

  if (pathname === "/") {
    return setSecurityHeaders(sameSiteRedirect(req, loggedIn ? "/dashboard" : "/auth"));
  }

  if (pathname.startsWith("/dashboard")) {
    if (!loggedIn) {
      const res = sameSiteRedirect(req, "/auth");
      res.headers.set("Cache-Control", "no-store");
      return setSecurityHeaders(res);
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return setSecurityHeaders(res);
  }

  if (pathname === "/auth") {
    if (loggedIn) {
      const res = sameSiteRedirect(req, "/dashboard");
      res.headers.set("Cache-Control", "no-store");
      return setSecurityHeaders(res);
    }
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store");
    return setSecurityHeaders(res);
  }

  // 3) 其它公共页面（如 /verify）放行但加安全头
  return setSecurityHeaders(NextResponse.next());
}
