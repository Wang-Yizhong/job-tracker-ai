import React from "react";
export default function SummaryCard({ title, value }: { title: string; value: number | string }) {
return (
<div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
<div className="text-sm text-muted">{title}</div>
<div className="mt-1 text-2xl font-semibold">{value}</div>
</div>
);
}