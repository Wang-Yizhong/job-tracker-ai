// --- file: src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/crypto";


export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

type CreateUserBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CreateUserBody | null;
  const email = (body?.email ?? "").trim();
  const password = body?.password ?? "";
  const rawName = (body?.name ?? "").trim();

  if (!email || !password) {
    return NextResponse.json(
      { error: "email & password required" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);
  const name = rawName || email.split("@")[0];

  try {
    const created = await prisma.user.create({
      data: { email, name, passwordHash }, // ✅ 补上必填的 passwordHash
    });
    // 返回必要字段即可
    return NextResponse.json(
      { id: created.id, email: created.email, name: created.name },
      { status: 201 }
    );
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: e?.message ?? "Create failed" },
      { status: 400 }
    );
  }
}
