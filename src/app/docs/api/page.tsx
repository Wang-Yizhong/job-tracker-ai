// Server Component（不要 "use client"）
import SwaggerClient from "./SwaggerClient";

// 这些路由级配置只能放在 Server 组件/Route Handler 里
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ApiDocsPage() {
  return <SwaggerClient url="/api/v1/swagger" />;
}
