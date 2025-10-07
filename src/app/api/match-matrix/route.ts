// --- file: src/app/api/match-matrix/route.ts
import { NextResponse } from "next/server";
import { normalizeToken } from "@/utils/match/aliases";
import { extractKeywords } from "@/utils/match/text";

type ReqItem = {
  text: string;
  must?: boolean;
  weight?: number;
  group: string; // 例如 'Tech' | 'Soft' ...
  raw?: string;
};
type JobParsed = {
  requirements?: ReqItem[] | string[];
  tags?: string[];
  skills?: string[];
  // 兜底可读字段（不一定都有）
  title?: string;
  summary?: string;
  description?: string;
  text?: string;
  raw?: string;
};

function cvKeywords(resume: any): Set<string> {
  const skills: string[] = Array.isArray(resume?.skills) ? resume.skills : [];
  const canonSkills = skills.map(normalizeToken);

  // 简历文本拼接（用于从自然语言里提关键词）
  const blobs: string[] = [];
  if (resume?.summary) blobs.push(String(resume.summary));
  if (Array.isArray(resume?.experiences)) {
    for (const e of resume.experiences) {
      if (e?.role) blobs.push(String(e.role));
      if (e?.company) blobs.push(String(e.company));
      if (Array.isArray(e?.highlights)) blobs.push(e.highlights.map(String).join(". "));
    }
  }

  const kws = extractKeywords(blobs.join(" "));
  const set = new Set<string>();
  for (const s of canonSkills) set.add(s);
  for (const k of kws) set.add(k);
  return set;
}

function toReqItemsFromStrings(arr: string[], group = "Tech"): ReqItem[] {
  return arr
    .map((t) => String(t).trim())
    .filter(Boolean)
    .map((t) => ({ text: t, group }));
}

function toReqItemsFromMixed(arr: any[], groupDefault = "Tech"): ReqItem[] {
  return arr
    .map((r) => {
      if (typeof r === "string") return { text: r, group: groupDefault } as ReqItem;
      const text = String(r?.text ?? r?.raw ?? "").trim();
      if (!text) return null;
      return {
        text,
        raw: r?.raw,
        must: !!r?.must,
        weight: typeof r?.weight === "number" ? r.weight : undefined,
        group: r?.group || groupDefault,
      } as ReqItem;
    })
    .filter(Boolean) as ReqItem[];
}

function uniqByCanonicalText(items: ReqItem[]): ReqItem[] {
  const seen = new Set<string>();
  const out: ReqItem[] = [];
  for (const it of items) {
    const key = normalizeToken(it.text);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

export async function POST(req: Request) {
  let payload: { job?: JobParsed; resume?: any } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { job, resume } = payload || {};

  // —— 基础校验 ——
  if (!job || typeof job !== "object") {
    return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
  }

  // —— 归一化候选需求 ——（requirements / tags / skills 全收）
  const fromReqs =
    Array.isArray(job.requirements) && job.requirements.length
      ? toReqItemsFromMixed(job.requirements as any[], "Tech")
      : [];

  const fromTags =
    Array.isArray(job.tags) && job.tags.length ? toReqItemsFromStrings(job.tags, "Tech") : [];

  const fromSkills =
    Array.isArray(job.skills) && job.skills.length ? toReqItemsFromStrings(job.skills, "Tech") : [];

  let reqs = uniqByCanonicalText([...fromReqs, ...fromTags, ...fromSkills]);

  // —— 如果还没有任何 Tech 类需求，则从 job 文本兜底提取 —— 
  if (reqs.length === 0) {
    const textBlob = [
      job.title,
      job.summary,
      job.description,
      job.text,
      job.raw,
    ]
      .map((x) => (x ? String(x) : ""))
      .join(" ");
    const kw = extractKeywords(textBlob).slice(0, 20); // 取前 20 个关键词作为要求
    reqs = uniqByCanonicalText(toReqItemsFromStrings(kw, "Tech"));
  }

  // 仅取 Tech 组（你的原始意图），如果仍为空就直接返回空清单（可选：也可不筛组）
  const techReqs = reqs.filter((r) => (r.group || "").toLowerCase() === "tech");

  // 简历关键词集合
  const cvSet = cvKeywords(resume);

  // 匹配/评分（与你原逻辑一致）
  const rows = (techReqs.length ? techReqs : reqs) // 若没有显式 Tech，退回用并集
    .reduce<ReqItem[]>((acc, cur) => {
      if (!acc.find((x) => normalizeToken(x.text) === normalizeToken(cur.text))) acc.push(cur);
      return acc;
    }, [])
    .map((r) => {
      const canonical = normalizeToken(r.text);
      const hit = cvSet.has(canonical);

      const rawToken = (r.raw || r.text || "").toLowerCase();
      const tokenHit =
        hit ||
        cvSet.has(rawToken) ||
        cvSet.has(rawToken.replace(/\./g, "")) ||
        cvSet.has(canonical.replace(/\./g, ""));

      const state: "hit" | "partial" | "miss" = hit ? "hit" : tokenHit ? "partial" : r.must ? "miss" : "partial";
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
  return `Ergänze die Punkte zu ${skill}: In welchem Projekt/in welcher Situation hast du es eingesetzt? Welches Problem wurde gelöst? Welche konkreten Handlungen (Technologien/Tools/Methoden) hast du durchgeführt? Quantifiziere die Ergebnisse (Leistung, Effizienz, Fehlerquote etc.).`;
}
