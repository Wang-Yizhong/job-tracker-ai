import React from "react";

export default function ValueAndFlow() {
  return (
    <div className="space-y-6">
      {/* 意义 */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Bedeutung des Projekts
        </h2>

        <p className="text-foreground/90 leading-relaxed mb-4">
          Das Projekt <span className="font-bold">„Job Tracker“</span> macht den
          Bewerbungsprozess moderner und effizienter. Viele Bewerber passen ihre
          Lebensläufe nicht gezielt an – Chancen gehen verloren, obwohl relevante
          Erfahrungen vorhanden sind. Dieses Tool unterstützt den gesamten
          Prozess von der Analyse bis zum Export.
        </p>

        <ul className="list-disc pl-5 space-y-2 text-foreground/90">
          <li>Abgleich zwischen Lebenslauf und Stellenanzeige</li>
          <li>Fehlende oder schwache Punkte werden sichtbar</li>
          <li>AI hilft bei der Formulierung passender Erfahrungen</li>
          <li>Änderungen sind transparent und nachvollziehbar</li>
          <li>Klarer Workflow – von Analyse bis PDF/Online</li>
        </ul>
      </div>

      {/* 核心问题 & 解决 */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Kernprobleme & Lösungen
        </h2>

        <div className="space-y-4 text-foreground/90 leading-relaxed">
          <p>
            <strong>Problem 1:</strong> Lebensläufe sind zu allgemein und passen
            nicht auf die Ausschreibung. <br />
            <span className="text-primary font-medium">Lösung:</span>{" "}
            AI-Analyse & Matching-Matrix zeigen fehlende/teilweise Skills.
          </p>
          <p>
            <strong>Problem 2:</strong> Relevante Erfahrungen werden vergessen
            oder schwach formuliert. <br />
            <span className="text-primary font-medium">Lösung:</span>{" "}
            AI-Q&amp;A („gap-question“) fragt gezielt nach Beispielen → Nutzer
            ergänzt konkrete Projekte.
          </p>
          <p>
            <strong>Problem 3:</strong> Änderungen am Lebenslauf sind schwer
            nachvollziehbar. <br />
            <span className="text-primary font-medium">Lösung:</span>{" "}
            Delta-Ansicht markiert Unterschiede und erleichtert Review.
          </p>
          <p>
            <strong>Problem 4:</strong> Bewerbungsprozess ist zeitaufwendig.{" "}
            <br />
            <span className="text-primary font-medium">Lösung:</span> Einheitlicher
            Workflow im Tool (JD → Analyse → AI-Hilfe → Export).
          </p>
        </div>

        {/* 流程图（先用文本，后续可接 Mermaid 渲染） */}
        <div className="mt-6 p-4 rounded-xl bg-muted/20 text-xs text-muted-foreground font-mono overflow-x-auto">
          <pre>{`[JD einfügen] → [AI Analyse → Matching-Matrix]
        ↓ fehlende Skills?
  Ja → [AI Q&A fragt] → [User ergänzt Beispiele] → [Resume Update + Delta]
  Nein → [Direkt optimiert]
                → [Export PDF/Online]`}</pre>
        </div>
      </div>
    </div>
  );
}
