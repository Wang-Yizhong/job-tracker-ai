// --- file: src/features/resume/utils/match/build-matrix.ts
import { normalizeToken } from "@/features/resume/utils/dict/aliases";
import type { JobParsed, MatchMatrix, MatchRow } from "@/features/resume/types/job-match.types";

/**
 * Basic token normalization for resume skills list.
 * - Lowercases
 * - Applies alias map
 * - De-duplicates
 */
function normalizeResumeSkills(skills: string[]): string[] {
  const set = new Set<string>();
  for (const s of skills || []) {
    const k = normalizeToken(String(s || "").trim());
    if (k) set.add(k);
  }
  return Array.from(set);
}

/**
 * Determine partial match:
 * - "next.js" partially matches "react" (framework family) → false by default
 * - For simplicity, we consider substring inclusion as partial
 *   (e.g., "graphql apollo" partially hits "graphql").
 * - You can later plug in a proper taxonomy for families/parents.
 */
function isPartialMatch(required: string, have: string): boolean {
  if (!required || !have) return false;
  const r = required.toLowerCase();
  const h = have.toLowerCase();
  if (r === h) return false; // exact would be hit, not partial
  return r.includes(h) || h.includes(r);
}

/**
 * Optional suggestion generator for missing/partial rows.
 */
function buildSuggestion(skill: string): string {
  return `Add a concise bullet describing impact with ${skill}: start with a verb and quantify results (e.g., “Reduced latency by 120ms using ${skill}”).`;
}

/**
 * Build MatchMatrix by comparing JD requirements with resume skills.
 */
export function buildMatchMatrix(job: JobParsed, resumeSkills: string[]): MatchMatrix {
  const have = normalizeResumeSkills(resumeSkills || []);

  const rows: MatchRow[] = (job?.requirements || []).map((req) => {
    const need = normalizeToken(req.text || "");
    // Full hit
    if (have.includes(need)) {
      return { skill: need, state: "hit", must: req.must, suggestion: null };
    }
    // Partial (substring/fuzzy-lite)
    const partial = have.some((h) => isPartialMatch(need, h));
    if (partial) {
      return { skill: need, state: "partial", must: req.must, suggestion: buildSuggestion(need) };
    }
    // Miss
    return { skill: need, state: "miss", must: req.must, suggestion: buildSuggestion(need) };
  });

  const total = rows.length;
  const covered = rows.filter((r) => r.state === "hit").length;

  return { total, covered, rows };
}
