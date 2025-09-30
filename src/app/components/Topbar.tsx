import React from "react";
export default function Topbar({ title, right }: { title: string; right?: React.ReactNode }) {
return (
<div className="flex items-center justify-between border-b border-border bg-white px-4 py-3">
<h1 className="text-xl font-bold">{title}</h1>
<div className="flex items-center gap-2">{right}</div>
</div>
);
}