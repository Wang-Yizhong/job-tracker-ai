import React from "react";
import type { JobStatus } from "./StatusBadge";


export default function Filters({
query, setQuery, status, setStatus, sort, setSort, onReset,
}: {
query: string; setQuery: (s: string) => void;
status: JobStatus | "all"; setStatus: (s: JobStatus | "all") => void;
sort: string; setSort: (s: string) => void;
onReset: () => void;
}) {
return (
<div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm md:grid-cols-12">
<div className="md:col-span-5">
<input
value={query}
onChange={(e) => setQuery(e.target.value)}
placeholder="Suche: Position / Firma / Notizen"
className="w-full rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
/>
</div>
<div className="md:col-span-3">
<select
value={status}
onChange={(e) => setStatus(e.target.value as any)}
className="w-full rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
>
<option value="all">Alle Status</option>
<option value="wishlist">Merkliste</option>
<option value="applied">Beworben</option>
<option value="interview">Interview</option>
<option value="offer">Angebot</option>
<option value="rejected">Abgelehnt</option>
<option value="accepted">Angenommen</option>
</select>
</div>
<div className="md:col-span-3">
<select
value={sort}
onChange={(e) => setSort(e.target.value)}
className="w-full rounded-xl border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
>
<option value="createdAt:desc">Neu erstellt</option>
<option value="createdAt:asc">Älteste zuerst</option>
<option value="updatedAt:desc">Zuletzt aktualisiert</option>
<option value="appliedAt:desc">Bewerbungsdatum (neu→alt)</option>
<option value="appliedAt:asc">Bewerbungsdatum (alt→neu)</option>
<option value="company:asc">Firma A→Z</option>
<option value="company:desc">Firma Z→A</option>
<option value="title:asc">Position A→Z</option>
<option value="title:desc">Position Z→A</option>
</select>
</div>
<div className="md:col-span-1 flex items-center justify-end">
<button onClick={onReset} className="w-full rounded-xl border border-border px-3 py-2 hover:bg-background md:w-auto">Zurücksetzen</button>
</div>
</div>
);
}