// --- file: src/app/api/ai/gap-question/route.ts
import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import type { ResumeData } from "@/features/resume/types";
import { incMonthlyGlobal } from "@/lib/quota";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const runtime = "nodejs";

type MatchRow = { skill: string; state: "hit" | "partial" | "miss"; must?: boolean };
type Match = { rows: MatchRow[]; total?: number; covered?: number };
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

type Body = {
  resume: ResumeData;
  match: Match;
  dialog?: ChatMsg[];
  userInput: string;
};

const MIN_LEN = 20;

function pickFocusSkill(match: Match): string | null {
  const rows = Array.isArray(match?.rows) ? match.rows : [];
  const mustMiss = rows.filter(r => r.state === "miss" && r.must).map(r => r.skill);
  const otherMiss = rows.filter(r => r.state === "miss" && !r.must).map(r => r.skill);
  const partial   = rows.filter(r => r.state === "partial").map(r => r.skill);
  const primary = mustMiss.length ? mustMiss : (otherMiss.length ? otherMiss : partial);
  return primary[0] || null;
}

function buildSystemPrompt(skillHint?: string) {
  return [
    "Du bist ein knapper, professioneller Bewerbungs-Coach.",
    "Ziel: Im Dialog fehlende Details im STAR-Format einsammeln und Kandidaten-Antworten verdichten.",
    "Regeln:",
    "- Antworte auf Deutsch, 2–5 kurze Sätze.",
    "- Wenn wichtige STAR-Teile fehlen (Ort/Zeit/Unternehmen/Aufgabe/Aktion/Zahlen), stelle genau EINE gezielte Rückfrage.",
    "- Wenn genug Info vorliegt：先简短总结用户要点，再提示下一步（量化/工具等）。",
    "- Keine neuen Fakten erfinden.",
    skillHint ? `- Bevorzugt auf folgende Fähigkeit eingehen: ${skillHint}` : "",
  ].filter(Boolean).join("\n");
}

function briefResume(resume: ResumeData) {
  return {
    name: resume.name,
    title: resume.title,
    skills: (resume.skills || []).slice(0, 20),
    experiences: (resume.experiences || []).slice(0, 3).map(e => ({
      company: e.company,
      role: e.role,
      period: e.period,
      highlights: (e.highlights || []).slice(0, 3),
    })),
  };
}

function briefMatch(match: Match) {
  return {
    rows: (match.rows || []).slice(0, 20).map(r => ({ skill: r.skill, state: r.state, must: !!r.must })),
  };
}

export async function POST(req: Request) {
  try {
    const { resume, match, dialog = [], userInput } = (await req.json()) as Body;

    if (!resume || !Array.isArray(match?.rows)) {
      return NextResponse.json({ ok: false, code: "bad_request", message: "resume und match.rows erforderlich" }, { status: 400 });
    }
    if (!userInput || userInput.trim().length < MIN_LEN) {
      return NextResponse.json({ ok: false, code: "short_input", message: `Antwort zu kurz (>= ${MIN_LEN} Zeichen).` }, { status: 400 });
    }

    const enforceQuota = process.env.NODE_ENV === "production" && process.env.ENFORCE_AI_QUOTA !== "false";
    if (enforceQuota) {
      const cap = await incMonthlyGlobal(1);
      if (!cap?.ok) {
        return NextResponse.json({ ok: false, code: "RATE_LIMITED", message: "Monatslimit erreicht" }, { status: 429 });
      }
    }

    const focus = pickFocusSkill(match);
    const system = buildSystemPrompt(focus || undefined);

    // 将历史消息显式收窄为 SDK 允许的角色，并限制长度
    const historyMsgs: ChatCompletionMessageParam[] = (dialog || [])
      .slice(-8)
      .map((m): ChatCompletionMessageParam => ({
        role: m.role, // 已经是 "system" | "user" | "assistant"
        content: (m.content || "").slice(0, 1200),
      }));

    const userContent = [
      "KURZ-CONTEXT:",
      JSON.stringify({ resume: briefResume(resume), match: briefMatch(match) }, null, 2),
      "",
      "BISHERIGER DIALOG (gekürzt):",
      JSON.stringify(historyMsgs.map(({ role, content }) => ({ role, content })), null, 2),
      "",
      "NEUE NACHRICHT DES NUTZERS:",
      userInput.slice(0, 1600),
      "",
      "ANTWORTAUFTRAG:",
      "- Antworte knapp (2–5 Sätze).",
      "- Wenn STAR-Teile fehlen → stelle **genau EINE** gezielte Rückfrage（包含要补的要素名）。",
      "- Wenn Infos ausreichend → kurze Zusammenfassung + nächste konkrete Ergänzung (Zahlen/Tools).",
    ].join("\n");

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...historyMsgs,
      { role: "user", content: userContent },
    ];

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 350,
    });

    const content = completion.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({
      ok: true,
      message: { role: "assistant", content, meta: { focusSkill: focus || undefined } }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, code: "SERVER_ERROR", message: e?.message || "internal error" }, { status: 500 });
  }
}
