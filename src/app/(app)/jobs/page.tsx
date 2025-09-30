// --- file: src/app/jobs/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import JobForm, { JobFormValues, JobStatus } from "../../components/JobForm";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DataTable from "../../components/DataTable";
import { ColumnDef } from "@tanstack/react-table";

// ===== Types =====
export type Job = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  link?: string | null;
  status: JobStatus;
  appliedAt?: string | null;
  notes?: string | null;
};

// ===== API helpers =====
const API = "/positions";

async function listJobs(params: {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: JobStatus | "all";
  sort?: string;
}) {
  return api.get<{ data: Job[]; total: number }>(API, {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      q: params.query,
      status: params.status && params.status !== "all" ? params.status : undefined,
      sort: params.sort,
    },
  });
}
async function createJob(payload: JobFormValues) {
  return api.post<Job>(API, payload);
}
async function updateJob(id: string, payload: JobFormValues) {
  return api.put<Job>(`${API}/${id}`, payload);
}
async function removeJob(id: string) {
  return api.delete<{ ok: true }>(`${API}/${id}`);
}

// ===== Status Badge =====
const statusLabel: Record<JobStatus, string> = {
  DRAFT: "Entwurf",
  SAVED: "Gespeichert",
  APPLIED: "Beworben",
  INTERVIEW: "Interview",
  OFFER: "Angebot",
  REJECTED: "Abgelehnt",
  HIRED: "Eingestellt",
};
const statusCls: Record<JobStatus, string> = {
  DRAFT: "border-border text-muted bg-background",
  SAVED: "border-border text-foreground bg-background",
  APPLIED: "border-primary/30 text-primary bg-primary/10",
  INTERVIEW: "border-accent/30 text-accent bg-accent/10",
  OFFER: "border-secondary/30 text-secondary bg-secondary/10",
  REJECTED: "border-rose-300 text-rose-700 bg-rose-50",
  HIRED: "border-green-300 text-green-800 bg-green-50",
};

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCls[status]}`}>
      {statusLabel[status]}
    </span>
  );
}

// ===== Topbar / Modal（与你现有保持一致） =====
function Topbar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-background" aria-label="Close">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ===== 页面 =====
export default function JobsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");
  const [sort, setSort] = useState("createdAt:desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listJobs({ page, pageSize, query, status, sort });
      setRows(res.data);
      setTotal(res.total);
    } catch (e: any) {
      setError(e?.message || "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, query, status, sort]);

  useEffect(() => {
    const controller = new AbortController();
    load();
    return () => controller.abort();
  }, [load]);

 const columns = useMemo<ColumnDef<Job, any>[]>(() => [
  {
    accessorKey: "title",
    header: "Position",
    cell: ({ row }) => (
      <span className="font-medium block truncate" title={row.original.title}>
        {row.original.title}
      </span>
    ),
    enableSorting: true,
    // 可选：给职位列一个比例宽度
    meta: { width: "28%" },
  },
  {
    accessorKey: "company",
    header: "Firma",
    cell: ({ row }) => (
      <span className="block truncate" title={row.original.company}>
        {row.original.company}
      </span>
    ),
    enableSorting: true,
    meta: { width: "22%" },
  },
  {
    accessorKey: "location",
    header: "Ort",
    cell: ({ row }) => (
      <span className="text-muted block truncate" title={row.original.location || "—"}>
        {row.original.location || "—"}
      </span>
    ),
    enableSorting: true,
    meta: { width: "14%" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    enableSorting: true,
    sortingFn: (a, b, id) => String(a.getValue(id)).localeCompare(String(b.getValue(id))),
    // ✅ 固定宽度（例如 120px）
    meta: { width: 120 },
  },
  {
    accessorKey: "appliedAt",
    header: "Bewerbungsdatum",
    cell: ({ row }) => (
      <span className="text-muted">
        {row.original.appliedAt?.slice(0,10) || "—"}
      </span>
    ),
    enableSorting: true,
    // ✅ 固定宽度（例如 140px）
    meta: { width: 140 },
  },
  {
    id: "link",
    header: "Link",
    cell: ({ row }) =>
      row.original.link ? (
        <a
          className="text-primary underline underline-offset-2 max-w-[120px] truncate inline-block"
          href={row.original.link!}
          target="_blank"
          rel="noreferrer"
          title={row.original.link!}
        >
          Link
        </a>
      ) : (
        <span className="text-muted">—</span>
      ),
    // 可选：固定链接列宽
    meta: { width: 120 },
  },
  {
    id: "actions",
    header: "Aktionen",
    cell: ({ row }) => {
      const job = row.original;
      return (
        <div className="flex items-center gap-2 justify-start">
          <button className="p-1.5 rounded hover:bg-blue-50" onClick={() => setEditTarget(job)} aria-label="Bearbeiten" title="Bearbeiten">
            <Pencil className="h-5 w-5 text-blue-500" />
          </button>
          <button className="p-1.5 rounded hover:bg-rose-50" onClick={() => setDeleteTarget(job)} aria-label="Löschen" title="Löschen">
            <Trash2 className="h-5 w-5 text-rose-500" />
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-sm font-medium text-white shadow-md transition hover:shadow-lg hover:scale-105"
            onClick={() => {
              if (typeof window !== "undefined") {
                const payload = { id: job.id, position: job.title, firma: job.company, notes: job.notes ?? "" };
                sessionStorage.setItem("resume:jobContext", JSON.stringify(payload));
              }
              router.push("/resume");
            }}
            aria-label="KI-Optimierung" title="KI-Optimierung"
          >
            <Sparkles className="h-4 w-4" />
            <span>KI</span>
          </button>
        </div>
      );
    },
    // 可选：操作列固定宽度
    meta: { width: 200 },
  },
], [router]);

  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  async function onCreate(values: JobFormValues) {
    const optimistic: Job = {
      id: `temp-${Date.now()}`,
      title: values.title,
      company: values.company,
      location: values.location || null,
      link: values.link || null,
      status: values.status,
      appliedAt: values.appliedAt || null,
      notes: values.notes || null,
    };
    setRows((r) => [optimistic, ...r]);
    try {
      const created = await createJob(values);
      setRows((r) => [created, ...r.filter((x) => x.id !== optimistic.id)]);
      setTotal((t) => t + 1);
      setOpenCreate(false);
      await load();
    } catch (e: any) {
      setRows((r) => r.filter((x) => x.id !== optimistic.id));
      alert(`Erstellen fehlgeschlagen: ${e?.message || e}`);
    }
  }

  async function onUpdate(values: JobFormValues) {
    if (!editTarget) return;
    const id = editTarget.id;
    const backup = rows.slice();
    setRows((r) =>
      r.map((x) =>
        x.id === id ? { ...x, ...values, location: values.location || null, link: values.link || null, appliedAt: values.appliedAt || null } : x
      )
    );
    try {
      const updated = await updateJob(id, values);
      setRows((r) => r.map((x) => (x.id === id ? updated : x)));
      setEditTarget(null);
    } catch (e: any) {
      setRows(backup);
      alert(`Aktualisieren fehlgeschlagen: ${e?.message || e}`);
    }
  }

  async function onDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const backup = rows.slice();
    setRows((r) => r.filter((x) => x.id !== id));
    try {
      await removeJob(id);
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setRows(backup);
      alert(`Löschen fehlgeschlagen: ${e?.message || e}`);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex min-h-screen">
      {/* 一路 min-h-0，避免高度被父级“顶爆”；不让整页滚动 */}
      <div className="flex-1 flex flex-col min-h-0">
        <Topbar
          title="Stellen"
          right={
            <>
              <button onClick={() => setOpenCreate(true)} className="rounded-2xl bg-primary px-4 py-2 text-primary-foreground shadow hover:opacity-90">
                + Neue Position
              </button>
            {/*   <button onClick={load} className="rounded-2xl border border-border px-4 py-2 text-foreground/70 hover:bg-background">
                Aktualisieren
              </button> */}
            </>
          }
        />

        {/* 主体：固定高度（视口 - 约 180px），内部分三段：头(筛选) + 中(表格滚动) + 尾(分页) */}
        <div className="p-2 md:p-4">
          {/* 这个卡片本身就限定在一屏内，避免列表“长出一屏” */}
          <div className="rounded-2xl border border-border bg-white shadow-sm flex flex-col overflow-hidden
                          h-[calc(100dvh-100px)]">
            {/* 筛选栏（不滚动） */}
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Suche nach Position / Firma…"
                className="w-full md:w-72 rounded-xl border border-border px-3 py-2"
              />
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as JobStatus | "all"); setPage(1); }}
                className="rounded-xl border border-border px-3 py-2"
              >
                <option value="all">Alle Status</option>
                {Object.keys(statusLabel).map((k) => (
                  <option key={k} value={k}>{statusLabel[k as JobStatus]}</option>
                ))}
              </select>
            </div>

            {/* ✅ 中间数据区：唯一的滚动容器 */}
            <div className="flex-1 min-h-0 overflow-auto">
              <DataTable<Job, any>
                columns={columns}
                data={rows}
                isLoading={loading}
                emptyText={error || "Keine Daten. Klicke oben rechts auf „+ Neue Position“."}
                className="min-w-full"
              />
            </div>

            {/* ✅ 分页：固定在卡片底部，不随中间滚动 */}
            <div className="sticky bottom-0 z-10 border-t border-border bg-white/95 backdrop-blur px-3 py-3 text-sm">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 md:flex-row">
                <div className="text-muted">
                  Gesamt {total} · Seite {page} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="rounded-xl border border-border px-3 py-1.5 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="rounded-xl border border-border px-2 py-1.5"
                  >
                    <option value={10}>10/Seite</option>
                    <option value={20}>20/Seite</option>
                    <option value={50}>50/Seite</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Neue Position">
          <JobForm mode="create" onSubmit={onCreate} onCancel={() => setOpenCreate(false)} />
        </Modal>

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

        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Löschen bestätigen">
          <div className="space-y-4">
            <p>
              Möchtest du wirklich löschen: <span className="font-semibold">{deleteTarget?.title}</span> ({deleteTarget?.company})?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-border px-4 py-2">
                Abbrechen
              </button>
              <button onClick={onDelete} className="rounded-xl bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700">
                Löschen
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
