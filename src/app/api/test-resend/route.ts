import { NextResponse } from "next/server";
import { resend } from "@/lib/email";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function GET() {
try {
const { data, error } = await resend.emails.send({
from: process.env.RESEND_FROM || "Acme <onboarding@resend.dev>",
to: ["j371959@gmail.com"],
subject: "Hello from Job Tracker",
html: "<p>It works!</p>",
});
if (error) throw error;
return NextResponse.json({ ok: true, data });
} catch (e: any) {
console.error("[_test-resend] error", e);
return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
}
}