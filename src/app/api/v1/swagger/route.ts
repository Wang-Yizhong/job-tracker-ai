// --- file: src/app/api/v1/swagger/route.ts
import { NextResponse } from "next/server";
import getSwaggerSpec from "../../../../../swagger.config";

// ✅ 明确禁止静态化，避免构建期执行
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const spec = getSwaggerSpec();
  return NextResponse.json(spec);
}
