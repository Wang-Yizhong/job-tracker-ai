import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { z } from "zod";


const bulkDeleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1) });


export async function DELETE(req: Request) {
const userId = await requireUserId();
if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


const body = await req.json();
const parsed = bulkDeleteSchema.safeParse(body);
if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });


const { ids } = parsed.data;
const result = await prisma.position.deleteMany({ where: { id: { in: ids }, userId } });
return NextResponse.json({ deleted: result.count });
}