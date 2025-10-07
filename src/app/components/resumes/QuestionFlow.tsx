// --- file: src/components/resumes/QuestionFlow.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { ResumeData } from "@/types/resume";
import type { MatchMatrix } from "./AnalysisPanel";
import { Loader2, X, Send } from "lucide-react";
import {http} from "@/lib/axios";

type Props = {
  open: boolean;
  onClose: () => void;
  resume: ResumeData;
  match: MatchMatrix;
  onApplyOptimized: (payload: {
    optimized: ResumeData;
    summaryDraft?: string;
    bulletDraft?: string;
  }) => void;
};

type GapQuestion = {
  id: string;
  skill: string;
  must?: boolean;
  question: string;
  hint?: string;
};

const MAX_MESSAGES = 5;
const MAX_CHARS = 500;
const MIN_CHARS = 20;

type ChatViewMsg = { role: "coach" | "user"; text: string };
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function pickFirstMissingSkill(match: any): string | null {
  const rows = Array.isArray(match?.rows) ? match.rows : [];
  const first = [...rows]
    .filter((r) => r?.state !== "hit")
    .sort((a, b) => Number(!!b?.must) - Number(!!a?.must))[0];
  return first?.skill || null;
}

export default function QuestionFlow({
  open,
  onClose,
  resume,
  match,
  onApplyOptimized,
}: Props) {
  const [messages, setMessages] = useState<ChatViewMsg[]>([]);
  const [input, setInput] = useState("");
  const [left, setLeft] = useState(MAX_MESSAGES);
  const [busy, setBusy] = useState(false);

  const [qa, setQA] = useState<{
    questions: GapQuestion[];
    answers: Record<string, string>;
  }>({
    questions: [],
    answers: {},
  });
  const seqRef = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const firstMissingSkill = useMemo(
    () => pickFirstMissingSkill(match),
    [match]
  );

  useEffect(() => {
    if (!open) return;
    setMessages([]);
    setInput("");
    setLeft(MAX_MESSAGES);
    setBusy(false);
    setQA({ questions: [], answers: {} });

    const base =
      "Ich bin dein JOB Coach.\n\n" +
      "Bitte antworte im STAR-Format und achte auf:\n" +
      "• **Situation/Ort/Zeit/Unternehmen** (z. B. 2023, Berlin, ACME GmbH)\n" +
      "• **Deine Aufgabe/Rolle**\n" +
      "• **Deine Aktionen** (Tools/Frameworks, Vorgehen)\n" +
      "• **Ergebnis in Zahlen** (z. B. +35 %, −120 ms, +5k Nutzer/Monat)\n\n" +
      `Mindestens ${MIN_CHARS} Zeichen pro Nachricht, maximal ${MAX_CHARS}. Deine Angaben fließen direkt in den Lebenslauf ein.`;

    const skillHint = firstMissingSkill
      ? `\n\nStarte gern mit einer konkreten Erfahrung zu „${firstMissingSkill}“.`
      : "";

    setMessages([{ role: "coach", text: base + skillHint }]);
  }, [open, firstMissingSkill]);

  if (!open) return null;

  /** ✅ 放宽判断，只过滤明显乱码 */
  function looksLikeGibberish(t: string): boolean {
    const s = t.trim();
    if (!s) return true;
    // 连续相同字符太多
    if (/(.)\1{12,}/i.test(s)) return true;
    // 全是符号或随机字符
    if (!/[a-zA-ZäöüÄÖÜß0-9]/.test(s)) return true;
    return false;
  }

  function toApiDialog(viewMsgs: ChatViewMsg[]): ChatMsg[] {
    const tail = viewMsgs.slice(-8);
    return tail.map((m) => ({
      role: m.role === "coach" ? "assistant" : "user",
      content: m.text,
    }));
  }

  async function send() {
    const raw = input.trim();
    if (!raw) return;

    if (raw.length < MIN_CHARS) {
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text: `Deine Antwort ist etwas knapp. Bitte füge noch ein paar Details hinzu (mind. ${MIN_CHARS} Zeichen).`,
        },
      ]);
      return;
    }
    if (raw.length > MAX_CHARS) {
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text: `Deine Antwort ist recht lang (>${MAX_CHARS} Zeichen). Bitte kürze sie leicht.`,
        },
      ]);
      return;
    }
    if (looksLikeGibberish(raw)) {
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text: "Deine Antwort wirkt schwer verständlich. Versuch es bitte nochmal im STAR-Format mit **Ort/Zeit/Unternehmen, Rolle, Aktionen (Tools) und messbarem Ergebnis**. Du machst das super 👍",
        },
      ]);
      return;
    }
    if (left <= 0) {
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text: "Aktuell ist die Demo-Version limitiert. Du hast dein Nachricht-Kontingent erreicht. Danke für dein Verständnis!",
        },
      ]);
      return;
    }

    setMessages((m) => [...m, { role: "user", text: raw }]);
    setLeft((n) => n - 1);
    setInput("");
    setBusy(true);

    try {
      const apiDialog = toApiDialog(
        messages.concat([{ role: "user", text: raw }])
      );
      const res = await http.post<{
        ok: boolean;
        message?: {
          role: "assistant";
          content: string;
          meta?: { focusSkill?: string };
        };
      }>("/ai/gap-questions", {
        resume,
        match,
        dialog: apiDialog,
        userInput: raw,
      });

      const assistantText = (res as any)?.message?.content?.trim?.() || "";
      const focusSkill =
        (res as any)?.message?.meta?.focusSkill ||
        firstMissingSkill ||
        "Allgemein";

      if (assistantText) {
        setMessages((m) => [...m, { role: "coach", text: assistantText }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "coach",
            text: "Danke für deine Antwort! Falls du noch Zahlen oder Tools ergänzen kannst, wäre das perfekt.",
          },
        ]);
      }

      const id = `q${seqRef.current++}`;
      const firstLine =
        assistantText.split(/\n+/)[0]?.slice(0, 120) ||
        `Rückfrage zu ${focusSkill}`;
      const q: GapQuestion = { id, skill: focusSkill, question: firstLine };
      setQA((prev) => ({
        questions: [...prev.questions, q],
        answers: { ...prev.answers, [id]: raw },
      }));
    } catch (e: any) {
      const msg =
        e?.message ||
        "Die Anfrage ist fehlgeschlagen. Bitte versuche es später erneut.";
      setMessages((m) => [...m, { role: "coach", text: msg }]);
    } finally {
      setBusy(false);
    }
  }

  async function applyToCv() {
    try {
      if (Object.keys(qa.answers).length === 0) {
        setMessages((m) => [
          ...m,
          {
            role: "coach",
            text: "Noch keine Antwort vorhanden. Bitte beantworte mindestens eine Frage im STAR-Format, dann kann ich es in den Lebenslauf übernehmen.",
          },
        ]);
        return;
      }
      setBusy(true);
      const optimized: ResumeData = await http.post<ResumeData>(
        "/ai/rewrite-resume",
        {
          resume,
          questions: qa.questions,
          answers: qa.answers,
        }
      );

      onApplyOptimized({
        optimized,
        summaryDraft: undefined,
        bulletDraft: undefined,
      });
    } catch (e: any) {
      const msg =
        e?.message ||
        "Die Optimierung konnte nicht erzeugt werden. Bitte versuche es später erneut.";
      setMessages((m) => [...m, { role: "coach", text: msg }]);
    } finally {
      setBusy(false);
    }
  }

  const belowMin = input.trim().length > 0 && input.trim().length < MIN_CHARS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image
                src="/img/job-coach.png"
                alt="JOB Coach"
                fill
                className="object-contain"
              />
            </div>
            <div className="text-sm font-semibold">JOB Coach</div>
            <div className="text-xs text-muted">
              Verbleibend {left}/{MAX_MESSAGES}
            </div>
          </div>
          <button
            className="rounded-xl border px-2 py-1 text-sm hover:bg-muted/20"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Schließen</span>
          </button>
        </div>

        {/* Chat */}
        <div className="max-h-[52vh] overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((m, i) =>
            m.role === "coach" ? (
              <CoachBubble key={i} text={m.text} />
            ) : (
              <UserBubble key={i} text={m.text} />
            )
          )}
          {busy && (
            <div className="flex items-start gap-3">
              <CoachAvatar />
              <div
                className="rounded-2xl border px-4 py-3 bg-[#EEF0FF] text-[#2D2A8C]"
                style={{ borderColor: "rgba(80,72,229,0.22)" }}
              >
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Denke nach …
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>
              💡 Tipp: STAR + Ort/Zeit/Unternehmen + Aktion + Ergebnis (mit
              Zahlen). Mind. {MIN_CHARS} Zeichen.
            </span>
            <span>
              Verbleibend: <strong>{left}</strong> / {MAX_MESSAGES}
            </span>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                className={`min-h-[44px] max-h-[160px] w-full resize-y rounded-2xl border bg-background p-3 text-sm outline-none ${
                  belowMin
                    ? "border-red-300 focus:ring-1 focus:ring-red-300"
                    : "border-border"
                }`}
                placeholder={`Antwort hier eingeben … (min. ${MIN_CHARS}, max. ${MAX_CHARS} Zeichen, Shift+Enter = Zeilenumbruch)`}
                value={input}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length <= MAX_CHARS) setInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={busy}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                <span className={`${belowMin ? "text-red-500" : ""}`}>
                  {input.trim().length < MIN_CHARS
                    ? `Noch ${
                        MIN_CHARS - Math.max(0, input.trim().length)
                      } Zeichen notwendig`
                    : "Mindestlänge erreicht 🎉"}
                </span>
                <span>
                  {input.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            <button
              onClick={send}
              disabled={busy || input.trim().length < MIN_CHARS}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#5048E5] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Senden
            </button>
          </div>

          <div className="mt-3 flex items-center justify-end gap-3">
            <button
              onClick={applyToCv}
              className="rounded-2xl border border-[#5048E5] bg-white px-4 py-2 text-sm font-medium text-[#5048E5] hover:bg-[#EEF0FF]"
              disabled={busy}
            >
              Vorschau & in CV übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- UI Bits --- */

function CoachAvatar() {
  return (
    <div className="relative h-8 w-8 overflow-hidden rounded-full">
      <Image
        src="/img/job-coach.png"
        alt="JOB Coach"
        fill
        className="object-contain"
      />
    </div>
  );
}

function CoachBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CoachAvatar />
      <div
        className="max-w-[75%] rounded-2xl px-4 py-3 bg-[#EEF0FF] text-[#2D2A8C] border shadow-sm"
        style={{ borderColor: "rgba(80,72,229,0.22)" }}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[75%] rounded-2xl bg-[#5048E5] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
