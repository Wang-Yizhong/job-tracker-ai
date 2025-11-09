import { createSwaggerSpec } from "next-swagger-doc";

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
      servers: [{ url: "/api/v1", description: "Next.js App Router API v1 base" }],
      components: {
        securitySchemes: {
          CSRF: { type: "apiKey", in: "header", name: "X-CSRF-Token" },
        },
      },
    },
  });

export default getSwaggerSpec;
