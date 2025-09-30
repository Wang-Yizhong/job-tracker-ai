import React from "react";
import { CheckSquare, Clock, Square } from "lucide-react";

export default function Roadmap() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Erledigt */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Erledigt</h3>
        <ul className="space-y-2 text-foreground/90">
          <li className="flex items-center gap-2">
            <CheckSquare className="text-primary" size={18} /> Stellen-CRUD
          </li>
          <li className="flex items-center gap-2">
            <CheckSquare className="text-primary" size={18} /> Lebenslauf-Editor
          </li>
          <li className="flex items-center gap-2">
            <CheckSquare className="text-primary" size={18} /> API-Client mit
            Fehler-Handling
          </li>
        </ul>
      </div>

      {/* In Arbeit */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">In Arbeit</h3>
        <ul className="space-y-2 text-foreground/90">
          <li className="flex items-center gap-2">
            <Clock className="text-accent" size={18} /> AI Q&A (gap-question)
          </li>
          <li className="flex items-center gap-2">
            <Clock className="text-accent" size={18} /> Skill-Matching mit
            Vorschlägen
          </li>
        </ul>
      </div>

      {/* Geplant */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Geplant</h3>
        <ul className="space-y-2 text-foreground/90">
          <li className="flex items-center gap-2">
            <Square className="text-gray-400" size={18} /> PDF-Export mit
            Layout-Optimierung
          </li>
          <li className="flex items-center gap-2">
            <Square className="text-gray-400" size={18} /> Nutzung &
            Kosten-Dashboard
          </li>
          <li className="flex items-center gap-2">
            <Square className="text-gray-400" size={18} /> Mehrsprachige
            Oberfläche
          </li>
        </ul>
      </div>
    </div>
  );
}
