import { NextResponse } from "next/server";
import { getSwaggerSpec } from "../../../../../swagger.config"; // 注意相对路径

export const runtime = "nodejs";

export async function GET() {
  const spec = getSwaggerSpec();
  return NextResponse.json(spec);
}
