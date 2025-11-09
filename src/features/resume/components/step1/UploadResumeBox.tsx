// --- file: src/features/resume/components/UploadResumeBox.tsx
"use client";

import * as React from "react";
import FileUploader from "@/components/ui/common/FileUploader";
import { useResumeUpload } from "@/features/resume/hooks";

type Props = {
  className?: string;
  onUploaded?: (fileKey: string, filename?: string) => void;
};

export default function UploadResumeBox({ className, onUploaded }: Props) {
  const { upload, uploading, error } = useResumeUpload();

  return (
    <div className={className}>
      <FileUploader
        busy={uploading}
        error={error ?? undefined}
        onClearError={() => {
          /* 目前 hook 没有 clearError，先留空或在上层清理 UI */
        }}
        accept=".pdf,.docx"
        onUpload={async (file, _onProgress) => {
          try {
            // 语言先默认 "de"，也可以从 props 传入
            const data = await upload(file, "de");

            // 将 UploadResumeResult → FileUploader 期望的 UploadResult
            const mapped = {
              ok: true as const,
              fileKey: data.fileKey ?? "",
              filename: data.fileName,
              mimeType: data.mime,
            };

            onUploaded?.(mapped.fileKey, mapped.filename);
            return mapped;
          } catch (e: any) {
            return { ok: false as const, message: e?.message || "Upload fehlgeschlagen" };
          }
        }}
      />
    </div>
  );
}
