import { z } from "zod";

export const StatusEnum = z.enum([
  "DRAFT",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "HIRED",
]);

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

export const createPositionSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),

  location: z.preprocess(emptyToUndef, z.string().optional()),
  link: z.preprocess(emptyToUndef, z.string().url().optional()),

  source: z.preprocess(emptyToUndef, z.string().optional()),

  status: StatusEnum.default("SAVED").optional(),

  // 数值：表单会传字符串，这里统一强制转换；空值 -> undefined
  priority: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().min(1).max(5).optional()
  ),
  salaryMin: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().nonnegative().optional()
  ),
  salaryMax: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().nonnegative().optional()
  ),

  currency: z.preprocess(emptyToUndef, z.string().optional()),

  // 日期：空值允许，字符串强转 Date
  appliedAt: z.preprocess(
    emptyToUndef,
    z.coerce.date().optional()
  ),

  notes: z.preprocess(emptyToUndef, z.string().optional()),

  tags: z.array(z.string()).optional().default([]),
});

export const updatePositionSchema = createPositionSchema.partial();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default("-createdAt"), // 支持你API里的解析
  q: z.preprocess(emptyToUndef, z.string().optional()),
  status: StatusEnum.optional(),
  source: z.preprocess(emptyToUndef, z.string().optional()),
  from: z.preprocess(emptyToUndef, z.coerce.date().optional()), // createdAt >= from
  to: z.preprocess(emptyToUndef, z.coerce.date().optional()),   // createdAt <= to
  tag: z.preprocess(emptyToUndef, z.string().optional()),
});
