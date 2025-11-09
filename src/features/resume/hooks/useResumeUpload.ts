"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadResumeFile } from "@/features/resume/api/resumeApi";
import type { UploadResumeResult } from "@/features/resume/api/resumeApi";

export function useResumeUpload() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["resume", "upload"],
    mutationFn: async ({ file, language }: { file: File; language?: "de" | "en" }) => {
      const resp = await uploadResumeFile(file, language);

      if ((resp as UploadResumeResult).resumeId && (resp as UploadResumeResult).versionId) {
        return resp as UploadResumeResult;
      }

      const r = resp as { ok: boolean; fileKey: string; mimeType?: string };
      if (r.ok && r.fileKey) {
        return {
          resumeId: "temp-" + Math.random().toString(36).slice(2),
          versionId: "temp-" + Math.random().toString(36).slice(2),
          fileKey: r.fileKey,
          fileName: file.name,
          mime: r.mimeType ?? file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          language,
        } as UploadResumeResult;
      }

      throw new Error("Upload fehlgeschlagen");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["resume", "series"] });
    },
  });

  return {
    uploading: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
    upload: (file: File, language?: "de" | "en") =>
      mutation.mutateAsync({ file, language }),
  };
}
