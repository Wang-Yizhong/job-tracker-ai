// --- file: src/features/resume/components/step1/GuideCard.tsx
"use client";

import { Brain, Target, Wand2, ArrowRight } from "lucide-react";

type Props = { className?: string };

export default function GuideCard({ className = "" }: Props) {
  return (
    <section
      className={[
        // 容器：更强的层级与对比
        "relative rounded-3xl border border-primary/20 shadow-lg",
        "bg-gradient-to-r from-primary/10 via-white to-secondary/10",
        "ring-1 ring-primary/10",
        "px-5 py-4 sm:px-6 sm:py-5",
        "overflow-hidden",
        className,
      ].join(" ")}
    >
      {/* 背景光斑（更显眼但不刺眼） */}
      <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 标题区 */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
            <Brain className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">
              Mit KI Ihre Chancen verbessern
            </div>
            <p className="mt-0.5 truncate text-xs text-foreground/70">
              Laden Sie Ihren Lebenslauf hoch und fügen Sie die JD ein — danach erhalten Sie ein klares Matching & konkrete Verbesserungen.
            </p>
          </div>
        </div>
      </div>

      {/* 三个优势要点（更显眼的胶囊） */}
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <BadgePill icon={<Target className="h-3.5 w-3.5" />} text="Passgenaues Matching" />
        <BadgePill icon={<Wand2 className="h-3.5 w-3.5" />} text="STAR-Lücken erkennen" />
        <BadgePill icon={<Brain className="h-3.5 w-3.5" />} text="KI-Vorschläge erhalten" />
      </div>
    </section>
  );
}

function BadgePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white/90 px-2.5 py-1 text-xs text-foreground shadow-sm">
      {icon}
      <span>{text}</span>
    </span>
  );
}
