// --- file: src/components/ui/common/FileUploader.tsx
"use client";

import * as React from "react";

export type UploadResult =
  | { ok: true; fileKey: string; filename?: string; mimeType?: string }
  | { ok: false; message: string };

export type FileUploaderProps = {
  busy?: boolean;
  error?: string;
  onClearError?: () => void;
  accept?: string; // e.g. ".pdf,.doc,.docx"
  onUpload: (file: File, onProgress?: (pct: number) => void) => Promise<UploadResult>;
  className?: string;
  labelPick?: string;
};

export default function FileUploader({
  busy,
  error,
  onClearError,
  accept = ".pdf,.doc,.docx",
  onUpload,
  className,
  labelPick = "Datei auswählen",
}: FileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [localErr, setLocalErr] = React.useState<string | null>(null);

  const clearErr = () => {
    setLocalErr(null);
    onClearError?.();
  };

  const handlePick = () => inputRef.current?.click();

  const runUpload = async (file: File) => {
    setLocalErr(null);
    setProgress(0);

    if (typeof onUpload !== "function") {
      setLocalErr("Uploader not wired: onUpload is not a function");
      return { ok: false, message: "onUpload not a function" } as UploadResult;
    }

    const res = await onUpload(file, (p) => setProgress(p));
    if (!res.ok) {
      setLocalErr(res.message ?? "Upload fehlgeschlagen");
      setProgress(null);
    } else {
      setTimeout(() => setProgress(null), 600);
    }
    return res;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) void runUpload(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void runUpload(f);
  };

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed px-4 py-6 text-sm ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-background"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-muted-foreground">
            Datei hierher ziehen oder klicken zum Auswählen
            <div className="text-xs">Unterstützt: PDF, DOC, DOCX</div>
          </div>
          <button
            type="button"
            onClick={handlePick}
            disabled={busy}
            className="rounded-xl px-3 py-2 text-sm font-medium text-white bg-primary disabled:opacity-60"
          >
            {busy ? "Wird hochgeladen…" : labelPick}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onChange}
        />

        {progress !== null && (
          <div className="mt-2 w-full rounded bg-muted">
            <div
              className="h-2 rounded bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {(error || localErr) && (
          <div className="mt-2 flex items-start justify-between gap-3">
            <p className="break-all text-sm text-red-600">{error ?? localErr}</p>
            <button
              type="button"
              onClick={clearErr}
              className="text-sm px-2 py-1 rounded hover:bg-muted"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
