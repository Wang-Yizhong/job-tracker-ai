import React from "react";
export type JobStatus = "wishlist" | "applied" | "interview" | "offer" | "rejected" | "accepted";
const label: Record<JobStatus, string> = {
wishlist: "Merkliste",
applied: "Beworben",
interview: "Interview",
offer: "Angebot",
rejected: "Abgelehnt",
accepted: "Angenommen",
};
const cls: Record<JobStatus, string> = {
wishlist: "border-border text-foreground bg-background",
applied: "border-primary/30 text-primary bg-primary/10",
interview: "border-accent/30 text-accent bg-accent/10",
offer: "border-secondary/30 text-secondary bg-secondary/10",
rejected: "border-rose-300 text-rose-700 bg-rose-50",
accepted: "border-green-300 text-green-800 bg-green-50",
};
export default function StatusBadge({ status }: { status: JobStatus }) {
return (
<span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls[status]}`}>
{label[status]}
</span>
);
}