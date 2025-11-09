// --- file: src/app/api/ai/gap-followup/route.ts
import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { incMonthlyGlobal } from "@/lib/quota";

export const runtime = "nodejs";

type Body = {
  question: string;
  skill: string;
  answer: string;
  missing: Array<"ort" | "zeit" | "unternehmen" | "aufgabe" | "aktion" | "zahlen">;
};

export async function POST(req: Request) {
  try {
    const { question, skill, answer, missing } = (await req.json()) as Body;
    if (!question || !skill || !answer || !Array.isArray(missing)) {
      return NextResponse.json({ code: "bad_request", message: "Parameter fehlen" }, { status: 400 });
    }

    const cap = await incMonthlyGlobal(1);
    if (!cap?.ok) {
      return NextResponse.json({ code: "RATE_LIMITED", message: "Monatslimit erreicht" }, { status: 429 });
    }

    const prompt = [
      "Du bist ein strenger, hilfreicher Interview-Coach.",
      "Aufgabe: Erzeuge EINE sehr kurze, präzise **Rückfrage** (1–2 Sätze) in Deutsch, die GENAU die fehlenden STAR-Teile abfragt.",
      "UND erzeuge zusätzlich eine **kurze Eingabe-Vorlage (prefill)**, die der Kandidat direkt ausfüllen kann.",
      'Antworte ausschließlich als JSON: {"followup":"...","prefill":"..."}',
      "Keine Erklärungen, keine anderen Felder.",
      "",
      `Frage: ${JSON.stringify(question)}`,
      `Skill: ${JSON.stringify(skill)}`,
      `Antwort (User): ${JSON.stringify(answer.slice(0, 1200))}`,
      `Fehlende Teile: ${JSON.stringify(missing)}`,
      "",
      "Leitlinien:",
      "- followup: 1–2 Sätze, direkt, konkret, Sie-Form vermeiden (neutral).",
      "- prefill: Platzhalter in Klammern, z. B. 'Zeit (MM.JJJJ–MM.JJJJ): …; Unternehmen: …; Ergebnis (%, ms, Nutzer): …'.",
      "- Nichts erfinden; nur fehlende Teile anfragen.",
    ].join("\n");

    const r = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "Du bist ein Lebenslauf-/Interviewcoach. Antworte nur auf Deutsch und nur als JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 250,
    });

    const raw = r.choices?.[0]?.message?.content || "{}";
    let json: any;
    try { json = JSON.parse(raw); } catch { json = {}; }

    const followup = (json?.followup || "Bitte ergänze kurz die fehlenden Angaben.").toString();
    const prefill  = (json?.prefill || "").toString();

    return NextResponse.json({ followup, prefill });
  } catch (e: any) {
    return NextResponse.json({ code: "SERVER_ERROR", message: e?.message || "Follow-up fehlgeschlagen" }, { status: 500 });
  }
}