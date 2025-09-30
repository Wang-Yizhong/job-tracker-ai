import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "../../../../lib/openai";
import { incMonthlyGlobal } from "../../../../lib/quota";

export const runtime = "nodejs";

type Body = { section: string; text: string; jobContext?: string };

export async function POST(req: Request) {
  try {
    const { section, text, jobContext } = (await req.json()) as Body;
    if (!section || !text?.trim()) return NextResponse.json({ error: "Parameter fehlen" }, { status: 400 });

    const cap = await incMonthlyGlobal(1);
    if (!cap.ok) return NextResponse.json({ error: "Monatslimit erreicht", meta: cap }, { status: 429 });

    const prompt = [
      'Formuliere den folgenden Lebenslauf-Text für die Zielrolle prägnant um.',
      'Gib ausschließlich JSON zurück: {"suggestion":"..."}',
      'Keine Erklärungen. Keine erfundenen Fakten oder Zahlen.',
      `Feld: ${section}`,
      `Text: ${JSON.stringify(text.slice(0, 1500))}`,
      `Zielrolle: ${JSON.stringify(jobContext || "")}`,
    ].join("\n");

    const r = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: "Du bist ein Lebenslauf-Assistent. Antworte nur auf Deutsch und nur als JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const raw = r.choices?.[0]?.message?.content || "{}";
    const suggestion = (JSON.parse(raw).suggestion || "").trim();
    return NextResponse.json({ suggestion });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Vorschlag fehlgeschlagen" }, { status: 500 });
  }
}
