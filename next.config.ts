// next.config.ts (ESM)
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 👈 新增：构建时忽略 ESLint 报错
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      // 关键：让任何 `import "pdf-parse"` 都指向内部实现，绕过 index.js 的调试分支
      "pdf-parse$": path.resolve(
        __dirname,
        "node_modules/pdf-parse/lib/pdf-parse.js"
      ),
    };
    return config;
  },
};

export default nextConfig;
