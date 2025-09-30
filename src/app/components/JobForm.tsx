"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export type JobStatus =
  | "DRAFT"
  | "SAVED"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "HIRED";

const schema = z.object({
  title: z.string().trim().min(1, "Titel darf nicht leer sein"),
  company: z.string().trim().min(1, "Firmenname darf nicht leer sein"),
  location: z.string().optional().or(z.literal("")),
  link: z.string().url("Ungültige URL").optional().or(z.literal("")),
  status: z
    .enum(["DRAFT", "SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "HIRED"])
    .default("DRAFT"),
  appliedAt: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

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
  } = useForm<JobFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      link: "",              // ✅ 使用 link
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
        link: initialValues.link ?? "", // ✅ 回填 link
        status: (initialValues.status as JobStatus) ?? "DRAFT",
        appliedAt: (initialValues.appliedAt ?? "").slice(0, 10),
        notes: initialValues.notes ?? "",
      });
    }
  }, [initialValues, reset]);

  const onValid = (values: JobFormValues) => {
    const normalized: JobFormValues = {
      ...values,
      title: values.title.trim(),
      company: values.company.trim(),
      location: (values.location ?? "").trim(),
      link: (values.link ?? "").trim(),
      appliedAt: (values.appliedAt ?? "").trim(),
      notes: (values.notes ?? "").trim(),
    };
    return onSubmit(normalized);
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
          {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-muted">Firma *</span>
          <input
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            placeholder="ACME GmbH"
            {...register("company")}
          />
          {errors.company && <p className="text-xs text-rose-600">{errors.company.message}</p>}
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
          {errors.link && <p className="text-xs text-rose-600">{errors.link.message}</p>}
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-muted">Status *</span>
          <select
            className="rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
            {...register("status")}
          >
            {(
              ["DRAFT","SAVED","APPLIED","INTERVIEW","OFFER","REJECTED","HIRED"] as JobStatus[]
            ).map(s => (
              <option value={s} key={s}>{statusLabel[s]}</option>
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
          {isSubmitting ? (mode === "edit" ? "Aktualisieren…" : "Speichern…") : (mode === "edit" ? "Aktualisieren" : "Speichern")}
        </button>
      </div>
    </form>
  );
}
