// --- file: src/features/resume/utils/parse/parse-jd.ts
import { SKILL_DEFS } from "@/features/resume/utils/dict/tech-dict";
import { normalizeToken } from "@/features/resume/utils/dict/aliases";
import { detectLang } from "@/features/resume/utils/text/lang-detect";
import type { JobParsed, ReqItem } from "@/features/resume/types/job-match.types";

// Cut JD into rough sections by common headings (DE/EN mixed)
function sliceSections(jd: string) {
  const t = jd ?? "";
  const idx = (re: RegExp) => {
    const m = re.exec(t);
    return m ? m.index : -1;
  };
  const marks = [
    { key: "mission", idx: Math.max(idx(/deine\s+mission/i), idx(/aufgaben|responsibilit(y|ies)/i)) },
    { key: "must", idx: Math.max(idx(/was\s+du\s+mitbringst/i), idx(/anforderungen|requirements|must-?have/i)) },
    { key: "nice", idx: Math.max(idx(/nice\s*to\s*have/i), idx(/wünschenswert/i)) },
  ]
    .filter((x) => x.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  if (!marks.length) return { before: jd, mission: "", must: jd, nice: "" };

  const chunks: Record<string, string> = { before: "", mission: "", must: "", nice: "" };
  for (let i = 0; i < marks.length; i++) {
    const cur = marks[i];
    const next = marks[i + 1];
    const seg = jd.slice(cur.idx, next ? next.idx : undefined);
    chunks[cur.key] = seg;
  }
  chunks.before = jd.slice(0, marks[0].idx);
  return chunks as { before: string; mission: string; must: string; nice: string };
}

// Use the skills dictionary to extract canonical labels from a text segment
function extractSkillsFrom(text: string) {
  const found: { label: string; raw: string }[] = [];
  const lower = (text || "").toLowerCase();

  for (const def of SKILL_DEFS) {
    for (const a of def.aliases) {
      const hit = typeof a === "string" ? lower.includes(a.toLowerCase()) : a.test(lower);
      if (hit) {
        let raw = typeof a === "string" ? a : (text.match(a)?.[0] ?? def.label);
        found.push({ label: normalizeToken(def.label), raw });
        break; // Hit once for a skill is enough
      }
    }
  }

  // De-duplicate by canonical label
  const map = new Map<string, string>();
  for (const f of found) if (!map.has(f.label)) map.set(f.label, f.raw);
  return Array.from(map, ([label, raw]) => ({ label, raw }));
}

// Merge with preference: keep must=true and larger weight
function mergeReqs(...groups: ReqItem[]) {
  const map = new Map<string, ReqItem>();
  for (const g of groups) {
    if (!map.has(g.text)) {
      map.set(g.text, g);
    } else {
      const old = map.get(g.text)!;
      map.set(g.text, {
        ...old,
        must: old.must || g.must,
        weight: Math.max(old.weight ?? 0, g.weight ?? 0),
        raw: old.raw || g.raw,
      });
    }
  }
  return Array.from(map.values());
}

export function parseJobText(jd: string): JobParsed {
  const lang = detectLang(jd);
  const lines = (jd || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Lightweight extraction for display only (best effort)
  const title = lines.find((l) => /(developer|engineer|entwickler|lead|architect|full[-\s]?stack|frontend|backend)/i.test(l));
  const company = lines.find((l) => /(gmbh|ag|ltd|inc|unternehmen|company|firma)/i.test(l));
  const location = lines.find((l) => /(remote|hybrid|berlin|münchen|stuttgart|hamburg|köln|frankfurt|munich|jena)/i.test(l));

  const sec = sliceSections(jd);

  // Extract skills from must/nice/other sections, fallback to entire text if needed
  const mustSkills = extractSkillsFrom(sec.must || jd);
  const niceSkills = extractSkillsFrom(sec.nice || "");
  const otherSkills = extractSkillsFrom(sec.mission || sec.before || "");

  const makeReq = (arr: { label: string; raw: string }[], weight: number, must: boolean): ReqItem[] =>
    arr.map((s) => ({ text: s.label, raw: s.raw, must, weight, group: "Tech" as const }));

  const requirements = mergeReqs(
    ...makeReq(mustSkills, 5, true),
    ...makeReq(niceSkills, 3, false),
    ...makeReq(otherSkills, 2, false)
  );

  const tags = requirements.slice(0, 8).map((r) => r.text);

  return { title, company, location, tags, requirements, lang, raw: jd };
}
