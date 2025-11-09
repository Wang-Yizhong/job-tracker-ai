// --- file: src/features/jobs/components/JobForm.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  JobFormSchema,
  type JobFormInput,
  type JobFormValues,
} from "../schemas/job-form.schema";
import { JOB_STATUSES, JOB_STATUS_LABEL } from "../types";

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
  } = useForm<JobFormInput>({
    resolver: zodResolver(JobFormSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
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
        status: initialValues.status ?? "DRAFT",
        appliedAt: (initialValues.appliedAt ?? "").slice(0, 10),
        notes: initialValues.notes ?? "",
      });
    }
  }, [initialValues, reset]);

  // Zod resolver will handle transformations (trim, empty→undefined)
  const submit = (values: JobFormValues) => onSubmit(values);

  return (
    <form onSubmit={handleSubmit(submit as any)} className="space-y-4">
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
            {JOB_STATUSES.map((s) => (
              <option value={s} key={s}>
                {JOB_STATUS_LABEL[s]}
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
          placeholder="Interview, Tech-Stack, Fortschritt …"
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
