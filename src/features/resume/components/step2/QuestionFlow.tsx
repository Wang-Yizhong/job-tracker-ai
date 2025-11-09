"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, X, Send } from "lucide-react";
import type { ResumeData, MatchMatrix } from "@/features/resume/types";
import { useGapCoach, MIN_CHARS, MAX_CHARS } from "@/features/resume/hooks/useGapCoach";

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

export default function QuestionFlow({
  open,
  onClose,
  resume,
  match,
  onApplyOptimized,
}: Props) {
  const {
    messages,
    input,
    setUserInput, // 来自 hook 的别名，确保兼容
    left,
    busy,
    belowMin,
    send,
    applyToCv,
  } = useGapCoach({ open, resume, match, onApplyOptimized });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image src="/img/job-coach.png" alt="JOB Coach" fill className="object-contain" />
            </div>
            <div className="text-sm font-semibold">JOB Coach</div>
            <div className="text-xs text-muted">Verbleibend {left}/5</div>
          </div>
          <button className="rounded-xl border px-2 py-1 text-sm hover:bg-muted/20" onClick={onClose}>
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
              💡 Tipp: STAR + Ort/Zeit/Unternehmen + Aktion + Ergebnis (mit Zahlen). Mind. {MIN_CHARS} Zeichen.
            </span>
            <span>
              Verbleibend: <strong>{left}</strong> / 5
            </span>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                className={`min-h-[44px] max-h-[160px] w-full resize-y rounded-2xl border bg-background p-3 text-sm outline-none ${
                  belowMin ? "border-red-300 focus:ring-1 focus:ring-red-300" : "border-border"
                }`}
                placeholder={`Antwort hier eingeben … (min. ${MIN_CHARS}, max. ${MAX_CHARS} Zeichen, Shift+Enter = Zeilenumbruch)`}
                value={input}
                onChange={(e) => {
                  const v = e.target.value;
                  // 交给父 hook 控制长度逻辑（hook 内部做了 MAX_CHARS 检查）
                  if (v.length <= MAX_CHARS) setUserInput(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                disabled={busy}
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                <span className={`${belowMin ? "text-red-500" : ""}`}>
                  {input.trim().length < MIN_CHARS
                    ? `Noch ${MIN_CHARS - Math.max(0, input.trim().length)} Zeichen notwendig`
                    : "Mindestlänge erreicht 🎉"}
                </span>
                <span>
                  {input.length}/{MAX_CHARS}
                </span>
              </div>
            </div>

            <button
              onClick={() => void send()}
              disabled={busy || input.trim().length < MIN_CHARS}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#5048E5] px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Senden
            </button>
          </div>

          <div className="mt-3 flex items-center justify-end gap-3">
            <button
              onClick={() => void applyToCv()}
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

/* --- UI bits --- */
function CoachAvatar() {
  return (
    <div className="relative h-8 w-8 overflow-hidden rounded-full">
      <Image src="/img/job-coach.png" alt="JOB Coach" fill className="object-contain" />
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
