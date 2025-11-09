// --- file: src/app/(dashboard)/jobs/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import Topbar from "@/components/ui/common/Topbar";
import Modal from "@/components/ui/common/Modal";
import JobsTable from "@/features/jobs/components/JobsTable";
import JobForm from "@/features/jobs/components/JobForm";
import Pagination from "@/components/ui/common/Pagination";
import SearchInput from "@/components/ui/common/SearchInput";
import FilterSelect, { type SelectOption } from "@/components/ui/common/FilterSelect";

import { type JobFormValues } from "@/features/jobs/schemas/job-form.schema";
import type { Job, JobStatus } from "@/features/jobs/types";

import { useJobs } from "@/features/jobs/hooks/useJobs";
import { useDataTable } from "@/hooks/use-data-table";

const statusOptions: SelectOption<JobStatus | "all">[] = [
  { value: "all", label: "Alle Status" },
  { value: "DRAFT", label: "Entwurf" },
  { value: "SAVED", label: "Gespeichert" },
  { value: "APPLIED", label: "Beworben" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Angebot" },
  { value: "REJECTED", label: "Abgelehnt" },
  { value: "HIRED", label: "Eingestellt" },
];

export default function JobsPage() {
  const router = useRouter();

  const {
    apiParams,
    table,
    page, setPage,
    pageSize, setPageSize,
    query, setQuery,
  } = useDataTable({
    initial: { page: 1, pageSize: 20, query: "", sort: "createdAt:desc" },
    defaultSort: "createdAt:desc",
    debounceMs: 300,
  });

  const [status, setStatus] = React.useState<JobStatus | "all">("all");

  const {
    rows, total, loading, error,
    refetch,
    createJob, updateJob, deleteJob,
    creating, updating, deleting,
  } = useJobs({ ...apiParams, status });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Job | null>(null);

  const onCreate = React.useCallback(async (values: JobFormValues) => {
    await createJob({
      title: values.title,
      company: values.company,
      location: values.location ?? null,
      link: values.link ?? null,
      status: values.status,
      appliedAt: values.appliedAt ?? null,
      notes: values.notes ?? null,
    } as Omit<Job, "id">);
    setOpenCreate(false);
    await refetch();
  }, [createJob, refetch]);

  const onUpdate = React.useCallback(async (values: JobFormValues) => {
    if (!editTarget) return;
    await updateJob(editTarget.id, {
      ...editTarget,
      ...values,
      location: values.location ?? null,
      link: values.link ?? null,
      appliedAt: values.appliedAt ?? null,
    });
    setEditTarget(null);
    await refetch();
  }, [editTarget, updateJob, refetch]);

  const onDelete = React.useCallback(async () => {
    if (!deleteTarget) return;
    await deleteJob(deleteTarget.id);
    setDeleteTarget(null);
    await refetch();
  }, [deleteTarget, deleteJob, refetch]);

  const onOpenCreate = React.useCallback(() => setOpenCreate(true), []);
  const onRefresh = React.useCallback(() => {
    setPage(1);
    void refetch();
  }, [refetch, setPage]);

  const isBusy = loading || creating || updating || deleting;

  return (
    <div className="flex min-h-screen">
      <div className="min-h-0 flex flex-1 flex-col">
        <Topbar
          title="Stellen"
          right={
            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={isBusy}
                className="rounded-2xl border border-border px-4 py-2 text-sm disabled:opacity-50"
              >
                Aktualisieren
              </button>
              <button
                onClick={onOpenCreate}
                className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow hover:opacity-90"
              >
                + Neue Position
              </button>
            </div>
          }
        />

        <div className="pt-2 md:pt-4">
          <div className="flex h-[calc(100dvh-100px)] min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Suche nach Position / Firma…"
                loading={loading}
              />
              <FilterSelect
                value={status}
                onChange={(v) => { setStatus(v as JobStatus | "all"); setPage(1); }}
                options={statusOptions}
                ariaLabel="Status filtern"
              />
            </div>

            {/* Table */}
            <div className="min-h-0 flex-1 overflow-auto">
              <JobsTable
                rows={rows}
                loading={loading}
                error={error}
                sort={table.sort}
                onSort={table.onSort}
                onEdit={(job) => setEditTarget(job)}
                onDelete={(job) => setDeleteTarget(job)}
                onAI={(job) => {
                  // ✅ 新逻辑：缓存职位描述信息到 resume 模块
                  if (typeof window !== "undefined") {
                    try {
                      const payload = {
                        source: "job",
                        jobId: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location ?? null,
                        link: job.link ?? null,
                        jdText: job.notes ?? "", // 假设 notes 就是 JD 内容
                        ts: Date.now(),
                      };
                      sessionStorage.setItem("resume:pendingAnalyse", JSON.stringify(payload));
                    } catch (err) {
                      console.warn("Failed to cache pending analyse payload:", err);
                    }
                  }

                  router.push("/resume");
                }}
              />
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              disabled={isBusy}
            />
          </div>
        </div>

        {/* Create */}
        <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Neue Position">
          <JobForm mode="create" onSubmit={onCreate} onCancel={() => setOpenCreate(false)} />
        </Modal>

        {/* Edit */}
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Position bearbeiten">
          {editTarget && (
            <JobForm
              mode="edit"
              initialValues={{
                title: editTarget.title ?? "",
                company: editTarget.company ?? "",
                location: editTarget.location ?? "",
                link: editTarget.link ?? "",
                status: editTarget.status ?? "SAVED",
                appliedAt: (editTarget.appliedAt ?? "").slice(0, 10),
                notes: editTarget.notes ?? "",
              }}
              onSubmit={onUpdate}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </Modal>

        {/* Delete */}
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Löschen bestätigen">
          <div className="space-y-4">
            <p>
              Möchtest du wirklich löschen: <span className="font-semibold">{deleteTarget?.title}</span> ({deleteTarget?.company})? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-border px-4 py-2">
                Abbrechen
              </button>
              <button
                onClick={onDelete}
                className="rounded-2xl bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
