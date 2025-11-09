import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { Api } from "@/lib/api/server";
import { parseJson } from "@/lib/validation/zod";

// 这里先用最小约束：非空字符串
const BulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "至少提供一个 id"),
});

export const DELETE = Api.handle(async (req: Request) => {
  const userId = await requireUserId();
  if (!userId) throw Api.E.Unauthorized();

  const { ids } = await parseJson(req, BulkDeleteSchema);

  const result = await prisma.position.deleteMany({
    where: { id: { in: ids }, userId },
  });

  return { deleted: result.count };
});
