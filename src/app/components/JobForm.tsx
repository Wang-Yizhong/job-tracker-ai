// --- file: src/components/JobForm.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/** 单一真源：状态列表 */
const STATUSES = [
  "DRAFT",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "HIRED",
] as const;
export type JobStatus = (typeof STATUSES)[number];

/** 工具：把空串规范为 undefined，避免后端出现 "" */
const emptyToUndef = (v: unknown) => {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
};

const schema = z.object({
  title: z.string().trim().min(1, "Titel darf nicht leer sein"),
  company: z.string().trim().min(1, "Firmenname darf nicht leer sein"),

  // 可选字段：允许空串输入，但最终转成 undefined
  location: z.string().optional().transform(emptyToUndef),

  // 若存在则校验为 URL；空串会被转成 undefined
  link: z
    .string()
    .optional()
    .transform(emptyToUndef)
    .pipe(z.string().url("Ungültige URL").optional()),

  status: z.enum(STATUSES).default("DRAFT"),
  appliedAt: z.string().optional().transform(emptyToUndef), // "YYYY-MM-DD" or undefined
  notes: z.string().optional().transform(emptyToUndef),
});

// ✅ 导出 schema（可被 API/校验共享）
export const jobFormSchema = schema;

// ✅ 关键：导出表单值类型（命名导出）
export type JobFormValues = z.infer<typeof schema>;

const statusLabel: Record<JobStatus, string> = {
  DRAFT: "Entwurf",
  SAVED: "Gespeichert",
  APPLIED: "Beworben",
  INTERVIEW: "Interview",
  OFFER: "Angebot",
  REJECTED: "Abgelehnt",
  HIRED: "Eingestellt",
};

export default function JobForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialValues?: Partial<JobFormValues>;
  onSubmit: (values: JobFormValues) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      company: "",
      location: "", // 允许空串；提交时会被 transform 成 undefined
      link: "",
      status: "DRAFT",
      appliedAt: "",
      notes: "",
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        title: initialValues.title ?? "",
        company: initialValues.company ?? "",
        location: initialValues.location ?? "",
        link: initialValues.link ?? "",
        status: (initialValues.status as JobStatus) ?? "DRAFT",
        appliedAt: (initialValues.appliedAt ?? "").slice(0, 10),
        notes: initialValues.notes ?? "",
      });
    }
  }, [initialValues, reset]);

const onValid = (raw: z.input<typeof schema>) => {
  const parsed = schema.parse(raw); // 应用 trim/transform，得到输出类型
  return onSubmit({
    ...parsed,
    title: parsed.title.trim(),
    company: parsed.company.trim(),
  });
};

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm text-muted">Titel *</span>
          <input
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Frontend Developer"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-rose-600">{errors.title.message}</p>
          )}
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-muted">Firma *</span>
          <input
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="ACME GmbH"
            {...register("company")}
          />
          {errors.company && (
            <p className="text-xs text-rose-600">{errors.company.message}</p>
          )}
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-muted">Ort</span>
          <input
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Stuttgart / Remote"
            {...register("location")}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-muted">Link zur Stelle</span>
          <input
            type="url"
            inputMode="url"
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="https://..."
            {...register("link")}
          />
          {errors.link && (
            <p className="text-xs text-rose-600">{errors.link.message}</p>
          )}
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-muted">Status *</span>
          <select
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            {...register("status")}
          >
            {STATUSES.map((s) => (
              <option value={s} key={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-muted">Bewerbungsdatum</span>
          <input
            type="date"
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            {...register("appliedAt")}
          />
        </label>
      </div>

      <label className="grid gap-1">
        <span className="text-sm text-muted">Stellenbeschreibung</span>
        <textarea
          rows={4}
          className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
          placeholder="Interviewer, Tech-Stack, Fortschritt …"
          {...register("notes")}
        />
      </label>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border px-4 py-2 text-foreground/70 hover:bg-background"
          >
            Abbrechen
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground shadow hover:opacity-90"
        >
          {isSubmitting
            ? mode === "edit"
              ? "Aktualisieren…"
              : "Speichern…"
            : mode === "edit"
            ? "Aktualisieren"
            : "Speichern"}
        </button>
      </div>
    </form>
  );
}
