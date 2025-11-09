"use client";
// file: src/features/jobs/components/JobsTable.tsx

import * as React from "react";
import {
  DataTable,
  type ColumnDef,
  type SortState,
} from "@/components/ui/common/DataTable";
import { Pencil, Trash2, Sparkles } from "lucide-react";

// ✅ Single source of truth for domain + UI labels + status colors
import type { Job, JobStatus } from "../types";
import { JOB_STATUS_LABEL, JOB_STATUS_CLS } from "../types";

/**
 * Small status badge.
 * Uses label + color classes from the shared types module
 * so Dashboard and Jobs list stay visually consistent.
 */
function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${JOB_STATUS_CLS[status]}`}
    >
      {JOB_STATUS_LABEL[status]}
    </span>
  );
}

export type JobsTableProps = {
  rows: Job[];
  loading?: boolean;
  error?: string | null;
  emptyText?: string;

  // Controlled sort from page container
  sort?: SortState | null;
  onSort?: (next: SortState) => void;

  // Row actions
  onEdit?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onAI?: (job: Job) => void;
};

/**
 * JobsTable
 *
 * Pure UI table component:
 * - Renders jobs with consistent status styling (shared tokens)
 * - Emits edit/delete/AI actions back to the page container
 * - Delegates sorting state to parent (controlled)
 */
export default function JobsTable({
  rows,
  loading,
  error,
  emptyText = 'Keine Daten. Klicke oben rechts auf „+ Neue Position“.',
  sort,
  onSort,
  onEdit,
  onDelete,
  onAI,
}: JobsTableProps) {
  // Column definitions for the generic DataTable
  const columns = React.useMemo<ColumnDef<Job>[]>(() => {
    return [
      {
        key: "title",
        header: "Position",
        cell: (row) => (
          <span className="block truncate font-medium" title={row.title}>
            {row.title}
          </span>
        ),
        sortable: true,
        sortKey: "title",
        width: 360,
        truncate: true,
      },
      {
        key: "company",
        header: "Firma",
        cell: (row) => (
          <span className="block truncate" title={row.company}>
            {row.company}
          </span>
        ),
        sortable: true,
        sortKey: "company",
        width: 280,
        truncate: true,
      },
      {
        key: "location",
        header: "Ort",
        cell: (row) => (
          <span className="block truncate text-muted" title={row.location ?? "—"}>
            {row.location ?? "—"}
          </span>
        ),
        sortable: true,
        sortKey: "location",
        width: 160,
        truncate: true,
      },
      {
        key: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
        sortable: true,
        sortKey: "status",
        width: 140,
        align: "left",
      },
      {
        key: "appliedAt",
        header: "Bewerbungsdatum",
        cell: (row) => (
          <span className="text-muted">{row.appliedAt?.slice(0, 10) ?? "—"}</span>
        ),
        sortable: true,
        sortKey: "appliedAt",
        width: 160,
      },
      {
        key: "link",
        header: "Link",
        cell: (row) =>
          row.link ? (
            <a
              className="inline-block max-w-[160px] truncate text-primary underline underline-offset-2"
              href={row.link}
              target="_blank"
              rel="noreferrer"
              title={row.link}
            >
              Link
            </a>
          ) : (
            <span className="text-muted">—</span>
          ),
        width: 160,
      },
      {
        key: "actions",
        header: "Aktionen",
        cell: (row) => (
          <div className="flex items-center justify-start gap-2">
            {/* Edit */}
            <button
              className="rounded p-1.5 hover:bg-blue-50"
              onClick={() => onEdit?.(row)}
              aria-label="Bearbeiten"
              title="Bearbeiten"
            >
              <Pencil className="h-5 w-5 text-blue-500" />
            </button>
            {/* Delete */}
            <button
              className="rounded p-1.5 hover:bg-rose-50"
              onClick={() => onDelete?.(row)}
              aria-label="Löschen"
              title="Löschen"
            >
              <Trash2 className="h-5 w-5 text-rose-500" />
            </button>
            {/* AI optimize */}
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-sm font-medium text-white shadow-md transition hover:shadow-lg hover:scale-105"
              onClick={() => onAI?.(row)}
              aria-label="KI-Optimierung"
              title="KI-Optimierung"
            >
              <Sparkles className="h-4 w-4" />
              <span>KI</span>
            </button>
          </div>
        ),
        width: 220,
        align: "left",
      },
    ];
  }, [onEdit, onDelete, onAI]);

  return (
    <DataTable<Job>
      rows={rows}
      columns={columns}
      getRowId={(row) => row.id}
      sort={sort}
      onSort={onSort}
      loading={loading}
      error={error ?? null}
      emptyText={emptyText}
      stickyHeader
      stickyHeaderOffset={0}
      className="min-w-full"
    />
  );
}
