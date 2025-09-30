"use client";
import React from "react";

export type MatchRow = {
  skill: string;
  must: boolean;
  state: "hit" | "partial" | "miss";
  suggestion?: string | null;
};
export default function MatchPanel({
  title, covered, total, rows,
}: { title?: string; covered: number; total: number; rows: MatchRow[]; }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title ?? "Matching Analysis"}</h3>
        <span className="rounded-full bg-background px-3 py-1 text-xs">
          {covered}/{total} skills covered
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-background/60 text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Skill</th>
              <th className="px-3 py-2">Resume</th>
              <th className="px-3 py-2">Matching</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.skill}</td>
                <td className="px-3 py-2 text-center">
                  {r.state === "hit" ? "✅" : r.state === "partial" ? "🟠" : "❌"}
                </td>
                <td className="px-3 py-2 text-center">
                  {r.state === "hit" ? "✅" : "⚠️"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 建议区：展示未覆盖/部分覆盖的建议 */}
      {rows.some(r => r.state !== "hit") && (
        <div className="mt-4 space-y-2">
          {rows.filter(r => r.state !== "hit").slice(0, 3).map((r, i) => (
            <div key={i} className="rounded-xl border bg-background px-3 py-2 text-sm">
              <div className="mb-1 font-medium">建议（{r.skill}）</div>
              <div className="text-muted">{r.suggestion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
