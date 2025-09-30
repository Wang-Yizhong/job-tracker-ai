// --- file: utils/job/parse.ts
import { SKILL_DEFS } from "./tech-dict";
import { normalizeToken } from "@/utils/match/aliases";

export type ReqItem = {
  text: string;                 // 统一后的技能名
  raw?: string;                 // 命中的原词
  must?: boolean;
  weight?: number;              // 5 must / 3 nice / 2 other
  group: "Tech" | "Responsibilities" | "Soft" | "Other";
};

export type JobParsed = {
  title?: string;
  company?: string;
  location?: string;
  tags: string[];               // 展示
  requirements: ReqItem[];      // 用于匹配
  raw?: string;                 // 保存原文（方便编辑器回显）
  lang?: "de" | "en" | "other";
};

function detectLang(t: string): "de" | "en" | "other" {
  const s = t.toLowerCase();
  if (/(wir|du|deine|aufgaben|anforderungen|kenntnisse|bewirb dich)/.test(s)) return "de";
  if (/(responsibilities|requirements|skills|apply now)/.test(s)) return "en";
  return "other";
}

// 根据常见德/英 heading 将 JD 切成若干段（更强容错）
function sliceSections(jd: string) {
  const t = jd;
  const idx = (re: RegExp) => { const m = re.exec(t); return m ? m.index : -1; };
  const marks = [
    { key: "mission", idx: Math.max(idx(/deine\s+mission/i), idx(/aufgaben|responsibilit(y|ies)/i)) },
    { key: "must",    idx: Math.max(idx(/was\s+du\s+mitbringst/i), idx(/anforderungen|requirements|must-?have/i)) },
    { key: "nice",    idx: Math.max(idx(/nice\s*to\s*have/i), idx(/wünschenswert/i)) },
  ].filter(x => x.idx >= 0).sort((a,b)=>a.idx-b.idx);

  if (!marks.length) return { before: jd, mission: "", must: jd, nice: "" };

  const chunks: Record<string, string> = { before: "", mission: "", must: "", nice: "" };
  for (let i=0;i<marks.length;i++) {
    const cur = marks[i]; const next = marks[i+1];
    const seg = jd.slice(cur.idx, next ? next.idx : undefined);
    chunks[cur.key] = seg;
  }
  chunks.before = jd.slice(0, marks[0].idx);
  return chunks;
}

// 用技能字典在指定文本片段中做匹配（输出 canonical）
function extractSkillsFrom(text: string) {
  const found: { label: string; raw: string }[] = [];
  const lower = text.toLowerCase();

  for (const def of SKILL_DEFS) {
    for (const a of def.aliases) {
      const hit = typeof a === "string" ? lower.includes(a.toLowerCase()) : a.test(lower);
      if (hit) {
        // 保留原词（字符串 alias 则原词=alias；正则则从原文中抓第一个匹配）
        let raw = typeof a === "string" ? a : (text.match(a)?.[0] ?? def.label);
        found.push({ label: normalizeToken(def.label), raw });
        break; // 同一技能命中一个别名就行
      }
    }
  }
  // 去重（按 canonical label）
  const map = new Map<string, string>();
  for (const f of found) if (!map.has(f.label)) map.set(f.label, f.raw);
  return Array.from(map, ([label, raw]) => ({ label, raw }));
}

export function parseJobText(jd: string): JobParsed {
  const lang = detectLang(jd);
  const lines = jd.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  const title = lines.find(l => /(developer|engineer|entwickler|lead|architect|fullstack|frontend|backend)/i.test(l));
  const company = lines.find(l => /(gmbh|ag|ltd|inc|unternehmen|company)/i.test(l));
  const location = lines.find(l => /(remote|hybrid|berlin|münchen|stuttgart|hamburg|köln|frankfurt|munich)/i.test(l));

  const sec = sliceSections(jd);

  // 先按 must/nice 段抓技能；fallback：整篇
  const mustSkills = extractSkillsFrom(sec.must || jd);
  const niceSkills = extractSkillsFrom(sec.nice || "");
  const otherSkills = extractSkillsFrom(sec.mission || sec.before || "");

  const makeReq = (arr: {label:string;raw:string}[], weight: number, must: boolean): ReqItem[] =>
    arr.map(s => ({ text: s.label, raw: s.raw, must, weight, group: "Tech" as const }));

  // 合并并去重（按 text），保留更高 must/weight
  const merge = (...groups: ReqItem[]) => {
    const map = new Map<string, ReqItem>();
    for (const g of groups) {
      if (!map.has(g.text)) map.set(g.text, g);
      else {
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
  };

  const requirements = merge(
    ...makeReq(mustSkills, 5, true),
    ...makeReq(niceSkills, 3, false),
    ...makeReq(otherSkills, 2, false),
  );

  // tags 用前 8 个技能（canonical）
  const tags = requirements.slice(0, 8).map(r => r.text);

  return { title, company, location, tags, requirements, raw: jd, lang };
}
