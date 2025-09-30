// --- file: src/components/resumes/UploadResume.tsx
"use client";
import React, { useCallback, useRef, useState } from "react";
import { Upload, CheckCircle2, FileText, X } from "lucide-react";
import api from "@/lib/axios"; // ✅ 统一使用封装的 axios

export type UploadResumeProps = {
  /** 上传成功回调：返回 fileKey 和文件名 */
  onUploaded?: (fileKey: string, filename?: string) => void;
  /** 向父级抛出消息（可选） */
  onMessage?: (msg: string) => void;
  className?: string;
  /** 允许的最大大小（字节），默认 10MB */
  maxSizeBytes?: number;
};

const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

export default function UploadResume({
  onUploaded,
  onMessage,
  className = "",
  maxSizeBytes = 10 * 1024 * 1024,
}: UploadResumeProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const emitMsg = (m: string) => {
    onMessage?.(m);
    setMsg(m);
  };

  const clearSelection = () => {
    setFile(null);
    setFileKey(null);
    setMsg(null);
    setErr(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const validateFile = (f: File | null): boolean => {
    if (!f) return false;
    if (f.size > maxSizeBytes) {
      setErr(`Datei ist zu groß (>${Math.round(maxSizeBytes / (1024 * 1024))}MB).`);
      return false;
    }
    // 兼容部分浏览器空 MIME 的情况，用扩展名兜底
    const lower = f.name.toLowerCase();
    const extOk = ALLOWED_EXT.some((ext) => lower.endsWith(ext));
    const mimeOk = !f.type || ALLOWED_MIME.includes(f.type);
    if (!(extOk && mimeOk)) {
      setErr("Nur PDF/DOC/DOCX werden unterstützt.");
      return false;
    }
    setErr(null);
    return true;
  };

  const handleSelect = (f: File | null) => {
    if (!validateFile(f)) return;
    setFile(f);
    setFileKey(null);
    setMsg(null);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0] || null;
    handleSelect(f);
    dropRef.current?.classList.remove("ring-2", "ring-primary/40");
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.add("ring-2", "ring-primary/40");
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dropRef.current?.classList.remove("ring-2", "ring-primary/40");
  }, []);

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    emitMsg("");
    setErr(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      // ✅ 统一走 api 封装
      const data= await api.post<{ fileKey: string }>(
        "/resumes/upload",
        fd
        // 不要显式设置 Content-Type；让 Axios 自动设置 multipart/form-data 边界
      );

      setFileKey(data.fileKey);
      const successMsg = "Upload erfolgreich";
      emitMsg(successMsg);
      onUploaded?.(data.fileKey, file?.name);
    } catch (e: any) {
      const m = e?.response?.data?.error || e?.message || "Upload fehlgeschlagen";
      setErr(m);
      emitMsg(m);
    } finally {
      setBusy(false);
    }
  };

  const humanSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 拖拽/点击 选择区（Outline 卡片） */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className="group rounded-2xl border border-dashed border-border bg-white p-4 transition hover:bg-background"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border bg-background p-2">
              <Upload className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <div className="font-medium text-foreground">Datei wählen oder hierher ziehen</div>
              <div className="text-muted">
                Erlaubt: PDF, DOC, DOCX · bis {Math.round(maxSizeBytes / (1024 * 1024))}MB
              </div>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-background">
            <span>Datei wählen</span>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_EXT.join(",")}
              onChange={(e) => handleSelect(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      {/* 文件信息 + 清除 */}
      {file && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted" />
            <span className="max-w-[260px] truncate">{file.name}</span>
            <span className="text-muted">· {humanSize(file.size)}</span>
            {fileKey && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                hochgeladen
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-2 py-1 text-xs hover:bg-background"
            disabled={busy}
          >
            <X className="h-3 w-3" />
            Entfernen
          </button>
        </div>
      )}

      {/* 操作按钮区 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={upload}
          disabled={!file || busy}
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white shadow-sm transition
            ${!file || busy ? "bg-muted cursor-not-allowed" : "bg-primary hover:opacity-95 active:opacity-90"}`}
        >
          {busy ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Wird hochgeladen…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Lebenslauf hochladen
            </>
          )}
        </button>

        {/* 辅助信息 */}
        {msg && !err && <p className="text-sm text-foreground/80">{msg}</p>}
      </div>

      {/* 错误提示 */}
      {err && <p className="text-sm text-rose-600">{err}</p>}
    </div>
  );
}
