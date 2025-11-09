import { z, ZodIssue } from "zod";
import { Api } from "@/lib/api/server";

/** 常用原子校验器 */
export const zStr = z.string();
export const zTrim = zStr.trim();
export const nonEmpty = (msg = "Required") => zTrim.min(1, msg);
export const zEmail = zTrim.email("Invalid email");
export const zURL = zTrim.url("Invalid URL");
export const zISODate = zTrim.refine(v => !Number.isNaN(Date.parse(v)), "Invalid ISO date");
export const zUUID = zTrim.uuid("Invalid UUID");
// 如用 cuid2 可替换
export const zCUID = zTrim.regex(/^c[a-z0-9]{24,32}$/i, "Invalid CUID");

/** 通用分页/搜索 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: zTrim.optional(),
  sort: zTrim.optional(),
});

/** 详情 id（按你的主键类型调整 UUID/CUID）*/
export const ParamsIdSchema = z.object({ id: zUUID.or(zCUID) });

/** Zod 错误 → 简洁 details */
export function zodDetails(issues: ZodIssue[]) {
  return issues.map(i => ({ path: i.path.join("."), message: i.message, code: i.code }));
}

/** 解析 JSON Body */
export async function parseJson<T extends z.ZodTypeAny>(req: Request, schema: T) {
  const raw = await req.json().catch(() => null);
  const rst = schema.safeParse(raw);
  if (!rst.success) throw Api.E.Validation({ issues: zodDetails(rst.error.issues) });
  return rst.data as z.infer<T>;
}

/** 解析 URL 查询 */
export function parseQuery<T extends z.ZodTypeAny>(url: string, schema: T) {
  const u = new URL(url, "http://localhost");
  const obj: Record<string, any> = {};
  u.searchParams.forEach((v, k) => { obj[k] = v; });
  const rst = schema.safeParse(obj);
  if (!rst.success) throw Api.E.Validation({ issues: zodDetails(rst.error.issues) });
  return rst.data as z.infer<T>;
}

/** 解析 params（ctx.params） */
export function parseParams<T extends z.ZodTypeAny>(params: unknown, schema: T) {
  const rst = schema.safeParse(params);
  if (!rst.success) throw Api.E.Validation({ issues: zodDetails(rst.error.issues) });
  return rst.data as z.infer<T>;
}
