import React from "react";

export default function Changelog() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          v0.3.0 (09.11.2025)
        </h3>
        <ul className="list-disc pl-5 text-foreground/90 space-y-1">
          <li>Refactored: Projektstruktur nach SOLID-Prinzipien – klare Trennung von UI, Logik und API</li>
          <li>Improved: API-Versionierung unter <code>/api/v1</code></li>
          <li>Added: Swagger-basierte API-Dokumentation</li>
          <li>Cleaned: Reduzierte Abhängigkeiten und konsolidierte Imports</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          v0.2.0 (29.09.2025)
        </h3>
        <ul className="list-disc pl-5 text-foreground/90 space-y-1">
          <li>Added: AI Q&A mit Kontext (gap-question)</li>
          <li>Improved: UX im Lebenslauf-Editor</li>
          <li>Fixed: Bug beim Stellen-Paging</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          v0.1.0 (20.09.2025)
        </h3>
        <ul className="list-disc pl-5 text-foreground/90 space-y-1">
          <li>Added: MVP für Stellen-CRUD</li>
          <li>Added: Lebenslauf-Editor (Basis)</li>
          <li>Added: API-Client mit zentralem Error-Handling</li>
        </ul>
      </div>
    </div>
  );
}
