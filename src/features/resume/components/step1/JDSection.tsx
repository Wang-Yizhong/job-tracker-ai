// src/features/resume/components/step1/JDSection.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useResumeStepStore,
  MIN_JD_LEN,
} from "@/features/resume/store/useResumeStepStore";

const PENDING_KEY = "resume:pendingAnalyse"; // ❗和 STORE_KEY 不同

type Props = { className?: string };

export default function JDSection({ className = "" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  // Hooks 必须始终无条件调用
  const hasHydrated        = useResumeStepStore((s: any) => s.hasHydrated ?? false);
  const jdText             = useResumeStepStore((s) => s.jdText);
  const setJD              = useResumeStepStore((s) => s.setJD);
  const setStep            = useResumeStepStore((s) => s.setStep);
  const fileKey            = useResumeStepStore((s) => s.fileKey);
  const fileName           = useResumeStepStore((s) => s.fileName);
  const selectedSeriesId   = useResumeStepStore((s) => s.selectedSeriesId);
  const selectedVersionId  = useResumeStepStore((s) => s.selectedVersionId);
  const handleStartAnalyse = React.useCallback(() => {
    if (!fileKey) return;
    const trimmed = jdText.trim();
    if (trimmed.length < MIN_JD_LEN) return;

    try {
      const payload = { fileKey, fileName: fileName ?? null, jdText: trimmed };
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(payload));
    } catch {}

    const url = `/resume/analyse?fileKey=${encodeURIComponent(fileKey)}`;
    router.push(url);
    startTransition(() => setStep(2));
  }, [fileKey, fileName, jdText, router, setStep, startTransition]);

  const onPasteFromClipboard = React.useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setJD(text);
    } catch {}
  }, [setJD]);

  // 派生值（不是 Hook）
  const count = jdText.trim().length;
  const lack  = Math.max(0, MIN_JD_LEN - count);
  const canAnalyse = Boolean(fileKey) && count >= MIN_JD_LEN;

  const sourceLabel =
    fileKey
      ? (fileName ? `Upload: ${fileName}` : "Upload: (neu)")
      : (selectedSeriesId && selectedVersionId
          ? `Historie: ${selectedSeriesId} · ${selectedVersionId}`
          : "Noch keine Quelle gewählt");

  // 水合守卫：放到所有 hook 之后
  if (!hasHydrated) return null;

  return (
    <section className={`rounded-2xl border border-border bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Stellenbeschreibung / Anforderungen</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden truncate text-xs text-muted-foreground sm:inline" title={sourceLabel}>
            {sourceLabel}
          </span>
          <button
            type="button"
            onClick={onPasteFromClipboard}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-muted"
            title="Aus Zwischenablage einfügen"
          >
            Einfügen
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={jdText}
          onChange={(e) => setJD(e.target.value)}
          placeholder="Füge hier die JD/Anforderungen ein … (DE/EN)"
          className="w-full min-h-[45vh] resize-y rounded-xl border border-border bg-white p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex items-center justify-between text-xs">
          <span className={lack > 0 ? "text-amber-600" : "text-muted-foreground"}>
            {lack > 0
              ? `Bitte noch mindestens ${lack} Zeichen (≥ ${MIN_JD_LEN}).`
              : "Gut! Mindestlänge erfüllt."}
          </span>
          <span className="text-muted-foreground">
            {count} Zeichen {isPending ? "· Navigating…" : ""}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleStartAnalyse}
          disabled={!canAnalyse || isPending}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          title={
            canAnalyse
              ? "Analyse starten"
              : "Bitte wähle zuerst eine Lebenslauf-Quelle und gib ausreichend JD-Text ein."
          }
        >
          Analyse starten
        </button>
      </div>
    </section>
  );
}
