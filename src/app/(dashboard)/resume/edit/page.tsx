"use client";
import * as React from "react";
import StepHeader from "@/features/resume/components/StepHeader";
import ResumeA4Editor from "@/features/resume/components/step3/ResumeA4Editor";
import { useResumeEditor } from "@/features/resume/hooks/useResumeEditor";
import { useRouter } from "next/navigation";

export default function ResumeEditPage() {
  const router = useRouter();
  const {
    resume,
    loaded,
    onChange,
    onUndo,
    onSuggest,
    onExport,
    save,
  } = useResumeEditor();

  // 还没载入或没有简历数据 → 引导回第1步
  if (!loaded || !resume) {
    return (
      <div className="p-6">
        <StepHeader current={3} onChange={(i) => i === 1 && router.push("/resume")} />
        <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
          Kein Daten gefunden. Bitte fügen Sie zuerst Ihre Daten hinzu.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <StepHeader current={3} onChange={(i) => i === 1 && router.push("/resume")} />

      <div
        className="
          flex-1 rounded-3xl border border-border bg-white shadow-sm
          overflow-y-auto max-h-[calc(100vh-180px)] scroll-smooth
        "
      >
        <ResumeA4Editor
          resume={resume}
          onChange={onChange}     // ✅ 正确的签名 (path, value) => void
          onUndo={onUndo}
          onSuggest={onSuggest}
          onExport={onExport}
          showExportButton={false}
        />
      </div>
    </div>
  );
}
