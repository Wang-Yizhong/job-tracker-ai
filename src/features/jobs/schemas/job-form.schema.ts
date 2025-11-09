// --- file: src/features/jobs/schemas/job-form.schema.ts
import { z } from "zod";
import { JOB_STATUSES, type JobStatus } from "../types";

/**
 * Transform helper: convert empty string to undefined.
 */
const emptyToUndefined = (v: unknown) => {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length > 0 ? s : undefined;
};

/**
 * Job form validation schema.
 */
export const JobFormSchema = z.object({
  title: z.string().trim().min(1, "Titel darf nicht leer sein"),
  company: z.string().trim().min(1, "Firmenname darf nicht leer sein"),

  location: z.string().optional().transform(emptyToUndefined),

  link: z
    .string()
    .optional()
    .transform(emptyToUndefined)
    .pipe(z.string().url("Ungültige URL").optional()),

  status: z.enum(JOB_STATUSES as [JobStatus, ...JobStatus[]]).default("DRAFT"),

  appliedAt: z.string().optional().transform(emptyToUndefined),

  notes: z.string().optional().transform(emptyToUndefined),
});

/**
 * Important: separate input (raw form data) and output (parsed values)
 * to avoid React Hook Form + Zod type mismatch.
 */
export type JobFormInput = z.input<typeof JobFormSchema>;   // before transform
export type JobFormValues = z.output<typeof JobFormSchema>;  // after transform
