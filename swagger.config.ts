// --- file: src/swagger.config.ts
import { createSwaggerSpec } from "next-swagger-doc";

/**
 * 生成 OpenAPI 规范（/api/v1/swagger 用）
 * - 扫描目录：src/app/docs/api/v1（区分版本）
 * - servers.url 固定为 "/api" → 你的各 path 写成 "/v1/..." 即可
 */
export const getSwaggerSpec = () =>
  createSwaggerSpec({
    apiFolder: "src/app/docs/api",  
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Job Tracker API (v1)",
        version: "1.0.0",
        description:
          "OpenAPI documentation for Job Tracker (v1).\n" +
          "所有路径前缀为 `/v1/...`，服务于 Next.js App Router `/api/v1/...`。",
      },
      // ✅ 关键：如果你希望 URL = /api/v1/...，要这样写
      servers: [
        {
          url: "/api/v1",
          description: "Next.js App Router API v1 base",
        },
      ],
      components: {
        securitySchemes: {
          CSRF: {
            type: "apiKey",
            in: "header",
            name: "X-CSRF-Token",
            description: "CSRF token for mutating requests",
          },
        },
      },
    },
  });

export default getSwaggerSpec;
