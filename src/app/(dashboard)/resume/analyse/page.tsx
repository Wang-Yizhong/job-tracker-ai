// --- file: src/app/(dashboard)/resume/analyse/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import StepHeader from "@/features/resume/components/StepHeader";
import AnalysisPanel from "@/features/resume/components/step2/AnalysisPanel";
import QuestionFlow from "@/features/resume/components/step2/QuestionFlow";
import AIAnalyzingLoader from "@/features/resume/components/step2/AIAnalyzingLoader";

import { useResumeAnalysis } from "@/features/resume/hooks/useResumeAnalysis";
import type { ResumeData, MatchMatrix } from "@/features/resume/types";
import { http } from "@/lib/api/http";
import { useResumeStepStore } from "@/features/resume/store/useResumeStepStore";

type PendingAnalyse = {
  fileKey?: string;
  fileName?: string;
  seriesId?: string;
  versionId?: string;
  jdText?: string;
};

export default function ResumeAnalysePage() {
  const router = useRouter();
  const setStep = useResumeStepStore((s) => s.setStep);

  const { resume, match, loading, error, analyse, reset } = useResumeAnalysis();
  const [ready, setReady] = React.useState(false);
  const [qaOpen, setQaOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function boot() {
      // 1) 从 session 拿到点击 Step1 时保存的上下文
      const raw = sessionStorage.getItem("resume:pendingAnalyse");
      const s: PendingAnalyse = raw ? JSON.parse(raw) : {};

      let { fileKey, fileName, seriesId, versionId, jdText } = s || {};

      // 2) 若无 fileKey，但有 series/version：调用后端补齐 fileKey（注意：用 http 的相对路径）
      if (!fileKey && seriesId && versionId) {
        try {
          const ver = await http.get<{ fileKey: string; fileName?: string }>(
            `/resumes/version?seriesId=${encodeURIComponent(seriesId)}&versionId=${encodeURIComponent(
              versionId
            )}`
          );
          fileKey = (ver as any)?.fileKey || fileKey;
          fileName = (ver as any)?.fileName || fileName;

          // 回写 session，刷新后仍可继续
          sessionStorage.setItem(
            "resume:pendingAnalyse",
            JSON.stringify({ ...s, fileKey, fileName })
          );
        } catch {
          // 忽略补齐失败，交给空态处理
        }
      }

      // 3) 没有 fileKey 或 jdText → 不满足进入分析页
      if (!fileKey || !jdText?.trim()) {
        setReady(true);
        return;
      }

      // 4) 发起分析（解析简历 + 匹配矩阵）
      await analyse({ fileKey, fileName, jdText });
      if (!cancelled) setReady(true);
    }

    boot();
    return () => {
      cancelled = true;
      // 可选：离开页面清理分析态
      // reset();
    };
  }, [analyse, reset]);

  // 空态：不满足条件（回 Step1）
  if (ready && (!match || !resume)) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <StepHeader current={2} onChange={(i) => i === 1 && router.push("/resume")} />
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold">Analyse nicht möglich</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Es fehlen Eingaben für die Analyse (Lebenslauf oder Stellenbeschreibung).
          </div>
          <button
            onClick={() => {
              setStep(1);
              router.push("/resume");
            }}
            className="mt-4 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white"
          >
            Zurück zu Upload & JD
          </button>
        </div>
      </div>
    );
  }

  // 加载态：使用 AIAnalyzingLoader 动画
  if (!ready || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-3xl border border-border bg-white shadow-sm h-[calc(100vh-120px)] flex items-center justify-center">
          <AIAnalyzingLoader text="AI analysiert deinen Lebenslauf …" />
        </div>
      </div>
    );
  }

  // 错误态（如果 useResumeAnalysis 返回了错误）
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-3xl border border-border bg-white shadow-sm h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="text-sm text-rose-600">
            Analyse fehlgeschlagen: {error}
          </div>
        </div>
      </div>
    );
  }

  // 正常内容
  return (
    <div className="flex flex-col gap-6 p-6">
      <StepHeader current={2} onChange={(i) => i === 1 && router.push("/resume")} />

      <AnalysisPanel
        match={match as MatchMatrix}
        onNext={() => {
          useResumeStepStore.getState().setStep(3);
          router.push("/resume/edit");
        }}
        onStartQA={() => setQaOpen(true)}
      />

      {qaOpen && resume && match && (
        <QuestionFlow
          open={qaOpen}
          onClose={() => setQaOpen(false)}
          resume={resume as ResumeData}
          match={match as MatchMatrix}
          onApplyOptimized={({ optimized }) => {
            // 把优化后的数据带到 Step3
            sessionStorage.setItem("resume:optimized", JSON.stringify(optimized || {}));
            useResumeStepStore.getState().setStep(3);
            router.push("/resume/edit");
          }}
        />
      )}
    </div>
  );
}
