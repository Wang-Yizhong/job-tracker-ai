// Domain types + shared UI labels (single source of truth for status text)

export type JobStatus =
  | "DRAFT"
  | "SAVED"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "HIRED";

export const JOB_STATUSES: JobStatus[] = [
  "DRAFT",
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "HIRED",
];

// UI text labels (DE). UI-only: do not import from server/data layers.
export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Entwurf",
  SAVED: "Gespeichert",
  APPLIED: "Beworben",
  INTERVIEW: "Interview",
  OFFER: "Angebot",
  REJECTED: "Abgelehnt",
  HIRED: "Eingestellt",
};

export const JOB_STATUS_CLS: Record<JobStatus, string> = {
  DRAFT: "border-border text-muted bg-background",
  SAVED: "border-border text-foreground bg-background",
  APPLIED: "border-primary/30 text-primary bg-primary/10",
  INTERVIEW: "border-accent/30 text-accent bg-accent/10",
  OFFER: "border-secondary/30 text-secondary bg-secondary/10",
  REJECTED: "border-rose-300 text-rose-700 bg-rose-50",
  HIRED: "border-green-300 text-green-800 bg-green-50",
};
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

export type JobsQueryParams = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: JobStatus | "all";
  sort?: string; // e.g. "createdAt:desc"
};

export type JobsListResponse = {
  data: Job[];
  total: number;
};
