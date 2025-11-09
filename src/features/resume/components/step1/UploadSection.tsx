// --- file: src/features/resume/components/step1/UploadSection.tsx
"use client";

import * as React from "react";
import { useResumeStepStore } from "@/features/resume/store/useResumeStepStore";
import UploadResumeBox from "@/features/resume/components/step1/UploadResumeBox";
import ResumeHistoryPanel from "@/features/resume/components/step1/ResumeHistoryPanel";

type Props = { className?: string };

/**
 * 左侧上传栏（仅支持德语简历）
 * - onUploaded: 写入 fileKey/fileName（并清空历史选择）
 * - onPick:     写入 seriesId/versionId/fileKey/fileName（历史选择）
 */
export default function UploadSection({ className = "" }: Props) {
  const setUploadSource = useResumeStepStore((s) => s.setUploadSource);
  const setHistorySource = useResumeStepStore((s) => s.setHistorySource);
  const setLang = useResumeStepStore((s) => s.setLang);

  // 仅支持德语：挂载时强制设为 "de"
  React.useEffect(() => setLang("de"), [setLang]);

  const handleUploaded = React.useCallback(
    (p: { fileKey: string; fileName?: string }) => {
      if (!p?.fileKey) return;
      setUploadSource({ fileKey: p.fileKey, fileName: p.fileName ?? "Lebenslauf" });
    },
    [setUploadSource]
  );

  const handlePickVersion = React.useCallback(
    (p: { seriesId: string; versionId: string; fileKey?: string; fileName?: string }) => {
      if (!p?.seriesId || !p?.versionId) return;
      setHistorySource({
        seriesId: p.seriesId,
        versionId: p.versionId,
        fileKey: p.fileKey,
        fileName: p.fileName,
      });
    },
    [setHistorySource]
  );

  return (
    <aside className={["flex h-full flex-col gap-4", className].join(" ")}>
      {/* 顶部固定标签：仅 DE */}
      <div className="flex items-center justify-between rounded-xl border bg-white p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/80">Deutsch CV (DE)</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Nur DE unterstützt
          </span>
        </div>
      </div>

      {/* 上传盒子 */}
      <UploadResumeBox onUploaded={handleUploaded as any} />

      {/* 历史版本面板 */}
      <ResumeHistoryPanel
        className="space-y-2 max-h-[40vh] overflow-y-auto pr-1"
        onPick={handlePickVersion as any}
      />
    </aside>
  );
}
