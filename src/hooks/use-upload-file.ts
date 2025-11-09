// --- file: src/hooks/use-upload-file.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api/http";
import type { AxiosProgressEvent } from "axios";

export type UploadSuccessData = {
  resumeId: string;
  versionId: string;
  fileName: string;
  mime: string;
  size: number;
  uploadedAt: string;
  fileKey?: string;
};

export type UploadResult =
  | { ok: true; data: UploadSuccessData }
  | { ok: false; message: string };

export type UseUploadOptions = {
  /** API path to POST the file to, e.g. "/api/v1/resumes/upload" */
  apiPath?: string;
  /** Max file size in bytes (default 5MB) */
  maxSizeBytes?: number;
  /** Language hint for parser */
  language?: "de" | "en";
  /** Upload progress (0~100) */
  onProgress?: (pct: number) => void;
};

const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".docx"];
const DEFAULT_API = "/api/v1/resumes/upload";
const DEFAULT_MAX = 5 * 1024 * 1024; // 5MB

/** Minimal magic sniff: PDF and ZIP (docx is zip) */
async function sniffMagic(file: File): Promise<"pdf" | "zip" | "unknown"> {
  const buf = await file.slice(0, 8).arrayBuffer();
  const b = new Uint8Array(buf);
  const isPDF = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
  const isZIP = b[0] === 0x50 && b[1] === 0x4b; // PK
  return isPDF ? "pdf" : isZIP ? "zip" : "unknown";
}

export function useUploadFile(options: UseUploadOptions = {}) {
  const {
    apiPath = DEFAULT_API,
    maxSizeBytes = DEFAULT_MAX,
    language = "de",
    onProgress,
  } = options;

  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const abortRef = useRef<AbortController | null>(null);

  /** Validate file by size, extension, mime and basic magic number sniff */
  const validateFile = useCallback(
    async (f: File | null): Promise<boolean> => {
      if (!f) return false;

      if (f.size > maxSizeBytes) {
        setError(`File is too large (> ${Math.round(maxSizeBytes / (1024 * 1024))}MB).`);
        return false;
      }

      const lower = f.name.toLowerCase();
      const extOk = ALLOWED_EXT.some((ext) => lower.endsWith(ext));
      const mimeOk = !f.type || ALLOWED_MIME.includes(f.type);
      if (!(extOk && mimeOk)) {
        setError("Only PDF/DOCX are supported.");
        return false;
      }

      const kind = await sniffMagic(f);
      if (kind === "unknown") {
        setError("File format not allowed or file corrupted.");
        return false;
      }

      setError(null);
      return true;
    },
    [maxSizeBytes]
  );

  /** Accept <input type="file"> or a direct File instance */
  const selectFile = useCallback(
    async (input: HTMLInputElement | File | null) => {
      let f: File | null = null;
      if (!input) return;
      if (input instanceof File) {
        f = input;
      } else {
        f = input.files?.[0] ?? null;
        input.value = ""; // allow reselecting the same file
      }
      const ok = await validateFile(f);
      if (!ok) return;
      setFile(f);
      setProgress(0);
    },
    [validateFile]
  );

  /** Abort current upload */
  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Upload file via configured API path */
  const upload = useCallback(async (): Promise<UploadResult> => {
    if (!file) return { ok: false, message: "No file selected." };

    setBusy(true);
    setError(null);
    setProgress(0);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (language) fd.append("language", language);

      const resp = await api.post(
        apiPath,
        fd,
        {
          signal: abortRef.current.signal,
          onUploadProgress: (evt: AxiosProgressEvent) => {
            let pct: number | null = null;
            if (typeof evt.total === "number" && evt.total > 0) {
              pct = Math.round((evt.loaded * 100) / evt.total);
            } else if (typeof evt.progress === "number") {
              pct = Math.round(evt.progress * 100);
            }
            if (pct !== null) {
              setProgress(pct);
              onProgress?.(pct);
            }
          },
        }
      );

      const payload = (resp as any)?.data;
      if (payload?.ok && payload?.data?.resumeId && payload?.data?.versionId) {
        return { ok: true, data: payload.data as UploadSuccessData };
      }

      const msg = payload?.error?.message || "Upload failed";
      setError(msg);
      return { ok: false, message: msg };
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || "Upload failed";
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setBusy(false);
    }
  }, [apiPath, file, language, onProgress]);

  /** Cleanup on unmount */
  useEffect(() => () => abortRef.current?.abort(), []);

  const humanMax = useMemo(
    () => `${Math.round(maxSizeBytes / (1024 * 1024))}MB`,
    [maxSizeBytes]
  );

  return {
    // state
    file,
    busy,
    error,
    progress,
    humanMax,
    // actions
    setFile,
    selectFile,
    upload,
    abort,
  };
}

export default useUploadFile;
