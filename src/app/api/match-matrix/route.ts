// --- file: src/app/api/match-matrix/route.ts
import { NextResponse } from "next/server";
import { normalizeToken } from "@/utils/match/aliases";
import { extractKeywords } from "@/utils/match/text";

type ReqItem = {
  text: string; must?: boolean; weight?: number; group: string; raw?: string;
};
type JobParsed = { requirements: ReqItem[]; tags: string[]; };

function cvKeywords(resume: any): Set<string> {
  const skills: string[] = Array.isArray(resume?.skills) ? resume.skills : [];
  const canonSkills = skills.map(normalizeToken);

  // Gesamten Lebenslauf als Text für Schlüsselwörter zusammenstellen (summary + experiences)
  const blobs: string[] = [];
  if (resume?.summary) blobs.push(resume.summary);
  if (Array.isArray(resume?.experiences)) {
    for (const e of resume.experiences) {
      if (e?.role) blobs.push(e.role);
      if (e?.company) blobs.push(e.company);
      if (Array.isArray(e?.highlights)) blobs.push(e.highlights.join(". "));
    }
  }
  // Schlüsselwörter extrahieren
  const kws = extractKeywords(blobs.join(" "));
  // Vereinheitlichte Skills + Text-Schlüsselwörter zusammenführen
  const set = new Set<string>();
  for (const s of canonSkills) set.add(s);
  for (const k of kws) set.add(k);
  return set;
}

export async function POST(req: Request) {
  const { job, resume } = await req.json();

  const reqs: ReqItem[] = (job?.requirements ?? []).filter((r: ReqItem) => r && typeof r.text === "string");
  const techReqs = reqs.filter((r) => r.group === "Tech");

  const cvSet = cvKeywords(resume);

  const rows = techReqs
    // Deduplikation (kanonisch)
    .reduce((acc: ReqItem[], cur) => {
      if (!acc.find((x) => normalizeToken(x.text) === normalizeToken(cur.text))) acc.push(cur);
      return acc;
    }, [])
    .map((r) => {
      const canonical = normalizeToken(r.text);
      const hit = cvSet.has(canonical);

      // „partial“: canonical nicht in CV Skills, aber raw/canonical Token kommt vor
      const rawToken = (r.raw || r.text || "").toLowerCase();
      const tokenHit =
        hit ||
        cvSet.has(rawToken) ||
        cvSet.has(rawToken.replace(/\./g, "")) ||
        cvSet.has(canonical.replace(/\./g, ""));

      const state = hit ? "hit" : tokenHit ? "partial" : (r.must ? "miss" : "partial");
      const weight = r.weight ?? (r.must ? 5 : 3);
      const score = (state === "hit" ? 1 : state === "partial" ? 0.5 : 0) * weight;

      return {
        skill: r.text,
        must: !!r.must,
        score,
        state,
        matched: hit,
        suggestion: hit ? null : mkSuggestion(r.text),
      };
    });

  const covered = rows.filter((r) => r.state === "hit").length;
  const total = rows.length;

  return NextResponse.json({ rows, covered, total });
}

function mkSuggestion(skill: string) {
  // Konkretere STAR-Anleitung
  return `Ergänze die Punkte zu ${skill}: In welchem Projekt/in welcher Situation hast du es eingesetzt? Welches Problem wurde gelöst? Welche konkreten Handlungen (Technologien/Tools/Methoden) hast du durchgeführt? Quantifiziere die Ergebnisse (Leistung, Effizienz, Fehlerquote etc.).`;
}
