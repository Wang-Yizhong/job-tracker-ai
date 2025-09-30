// --- file: src/app/api/ai/rewrite-resume/route.ts
import { NextResponse } from "next/server";
import type { ResumeData } from "@/types/resume";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { incMonthlyGlobal } from "@/lib/quota";

export const runtime = "nodejs";

type GapQuestion = { id: string; skill: string; must?: boolean; question: string; hint?: string };
type Body = {
  resume: ResumeData;
  questions: GapQuestion[];
  answers: Record<string, string>;
};

/** 将用户回答粗切成 2~3 条要点（不生成新事实，只做裁剪） */
function asBullets(skill: string, answer: string): string[] {
  const norm = answer.replace(/\r/g, "").trim();
  if (!norm) return [];
  const parts = norm
    .split(/[\n。.;；]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const bullets: string[] = [];
  if (parts[0]) bullets.push(`Mit ${skill}: ${parts[0]}`);
  if (parts[1]) bullets.push(parts[1]);
  if (parts[2]) bullets.push(parts[2]);
  return bullets.slice(0, 3);
}

/** 简单选择把要点写入哪段经历：优先第一段（最近） */
function chooseExperienceIndex(cv: ResumeData, _skill: string) {
  return Math.max(0, Math.min((cv.experiences?.length || 1) - 1, 0));
}

/** 将新增 bullets 合并进指定经历（去重，最多 12 条） */
function mergeBullets(exp: ResumeData["experiences"][number], added: string[]) {
  const exist = new Set((exp.highlights || []).map((s) => s.trim().toLowerCase()));
  const next: string[] = [...(exp.highlights || [])];
  for (const line of added) {
    const key = line.trim().toLowerCase();
    if (!exist.has(key) && key) {
      next.push(line);
      exist.add(key);
    }
  }
  return next.slice(0, 12);
}

/** 生成一个用于 summary 的技能短串，避免太长 */
function summarizeSkillsForSummary(skills: string[], max = 6) {
  const uniq = Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean)));
  return uniq.slice(0, max).join(" · ");
}

export async function POST(req: Request) {
  try {
    const { resume, questions, answers } = (await req.json()) as Body;
    if (!resume || !questions || !answers || !Array.isArray(questions)) {
      return NextResponse.json({ code: "bad_request", message: "resume/questions/answers erforderlich" }, { status: 400 });
    }

    // 1) 先本地结构化合并（不依赖 AI）
    const optimized: ResumeData = structuredClone(resume);
    const usedSkills: string[] = [];

    for (const q of questions) {
      const a = (answers[q.id] || "").trim();
      if (!a) continue;
      const b = asBullets(q.skill, a); // 2~3 条
      if (b.length === 0) continue;

      const idx = chooseExperienceIndex(optimized, q.skill);
      const exp = optimized.experiences?.[idx];
      if (!exp) continue;

      exp.highlights = mergeBullets(exp, b);
      usedSkills.push(q.skill);
    }

    // 2) 用 AI 润色 summary（不新增事实），失败/限额时优雅降级
    const cap = await incMonthlyGlobal(1);
    if (!cap?.ok) {
      return NextResponse.json(optimized);
    }

    const skillsFocus = summarizeSkillsForSummary(
      usedSkills.length ? usedSkills : optimized.skills || []
    );

    const system = "Du bist ein Lebenslauf-Assistent. Antworte ausschließlich auf Deutsch und ausschließlich als JSON.";
    const userPrompt = [
      "Du bekommst Stichworte und einen ggf. vorhandenen bisherigen Summary-Text.",
      "Deine Aufgabe: Formuliere eine kurze, prägnante Summary (2–3 Sätze), passend für Bewerbungen in Deutschland.",
      "WICHTIG:",
      "- Keine neuen Fakten erfinden (keine neuen Firmen, Zeiten, Rollen, Zahlen).",
      "- Schreib sachlich, ergebnisorientiert; nenne Schwerpunkte/Stack, aber keine Buzzword-Listen.",
      "- Maximale Länge ~ 420 Zeichen.",
      'Gib ausschließlich folgendes JSON zurück: {"summary":"..."}',
      "",
      `Bisheriger Summary-Text: ${JSON.stringify(optimized.summary || "")}`,
      `Schwerpunkte/Stack: ${JSON.stringify(skillsFocus)}`
    ].join("\n");

    let summaryDraft = "";
    try {
      const r = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 300
      });

      const raw = r.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      summaryDraft = (parsed?.summary || "").trim();
    } catch {
      summaryDraft = optimized.summary || "";
    }

    if (summaryDraft && summaryDraft !== optimized.summary) {
      optimized.summary = summaryDraft;
    }

    // 3) 返回完整 ResumeData
    return NextResponse.json(optimized);
  } catch (e: any) {
    const msg = e?.message || "failed";
    return NextResponse.json({ code: "SERVER_ERROR", message: msg }, { status: 500 });
  }
}
