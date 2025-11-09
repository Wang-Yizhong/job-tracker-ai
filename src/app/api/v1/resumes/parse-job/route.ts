import { NextResponse } from "next/server";
import { parseJobText } from "@/utils/job/parse";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text || typeof text !== "string" || text.trim().length < 30) {
    return NextResponse.json({ error: "JD text too short" }, { status: 400 });
  }
  const parsed = parseJobText(text);
  return NextResponse.json(parsed);
}