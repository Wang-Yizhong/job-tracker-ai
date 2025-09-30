// --- file: src/components/resumes/ResumeHistory.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Loader2, Star } from "lucide-react";
import api from "@/lib/axios";

type Version = {
  id: string;
  fileKey: string;
  fileName: string;
  uploadedAt: string;
  note?: string | null;
};

type Series = {
  id: string;
  title: string;
  language?: string | null;
  activeVersionId?: string | null;
  versions: Version[];
};

export default function ResumeHistory({
  onSelect,
  className = "",
}: {
  onSelect: (payload: { seriesId: string; versionId: string; fileKey: string; fileName: string }) => void;
  className?: string;
}) {
  const [items, setItems] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [err, setErr] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------ helpers ------------------------------ */
  async function getJSON<T = any>(url: string) {
    try {
      const payload = await api.get<T>(url);
      return payload as T;
    } catch (e: any) {
      throw new Error(e?.response?.data?.error || e?.message || "Request failed");
    }
  }

  async function postJSON<T = any>(url: string, body?: any, config?: any) {
    try {
      const payload = await api.post<T>(url, body, config);
      return payload as T;
    } catch (e: any) {
      throw new Error(e?.response?.data?.error || e?.message || "Request failed");
    }
  }

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      const data = await getJSON<{ items: Series[] }>("/resumes");
      const arr: Series[] = data?.items || [];
      setItems(arr);

      // 初始化当前系列/版本（优先 active，其次最新）
      if (arr.length) {
        const s = seriesId ? arr.find((x) => x.id === seriesId) ?? arr[0] : arr[0];
        const v =
          (versionId && s.versions.find((x) => x.id === versionId)) ||
          (s.activeVersionId && s.versions.find((x) => x.id === s.activeVersionId)) ||
          s.versions[0];

        setSeriesId(s.id);
        if (v) {
          setVersionId(v.id);
          onSelect({ seriesId: s.id, versionId: v.id, fileKey: v.fileKey, fileName: v.fileName });
        } else {
          setVersionId(null);
        }
      } else {
        setSeriesId(null);
        setVersionId(null);
      }
    } catch (e: any) {
      setErr(e.message || "Laden fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(); // eslint-disable-next-line
  }, []);

  const current = useMemo(() => items.find((x) => x.id === seriesId) || null, [items, seriesId]);

  async function preview(v: Version) {
    try {
      const data = await postJSON<{ url: string }>("/resumes/sign", { fileKey: v.fileKey });
      window.open(data.url, "_blank");
    } catch (e: any) {
      alert(e.message || "Vorschau fehlgeschlagen");
    }
  }

  async function activateAndSelect(vid: string) {
    if (!current) return;
    try {
      // 先本地选中，提高响应速度
      setVersionId(vid);
      const v = current.versions.find((x) => x.id === vid);
      if (v) onSelect({ seriesId: current.id, versionId: v.id, fileKey: v.fileKey, fileName: v.fileName });

      // 调用后端设置为激活版本
      await postJSON(`/resumes/${current.id}/activate`, { versionId: vid });

      // 刷新以拿到 activeVersionId 的最新状态
      await refresh();
    } catch (e: any) {
      alert(e.message || "Aktivieren fehlgeschlagen");
    }
  }

  async function addNewVersion(file: File) {
    if (!current) return alert("Bitte zuerst eine Serie wählen");

    try {
      // 1) 上传到存储
      const fd = new FormData();
      fd.append("file", file);
      if (current.language) fd.append("language", current.language);

      const upData = await postJSON<{ fileKey: string; mimeType?: string }>(
        "/resumes/upload",
        fd,
        { headers: {} }
      );

      // 2) 写入版本表
      const created = await postJSON<Version>(`/resumes/${current.id}/versions`, {
        fileKey: upData.fileKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: upData.mimeType || file.type || undefined,
      });

      // 3) 直接把新版本设为激活并选中
      await activateAndSelect(created.id);
    } catch (e: any) {
      alert(e.message || "Neue Version fehlgeschlagen");
    }
  }

  /* --------------------------------- UI -------------------------------- */
  return (
    <div className={`rounded-3xl border border-border bg-white p-4 shadow-sm ${className}`}>
      {/* 顶部：系列选择 +（可选）上传入口 */}
      <div className="mb-3 flex items-center gap-2">
        <select
          value={seriesId ?? ""}
          onChange={(e) => setSeriesId(e.target.value)}
          className="min-w-[200px] rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          {items.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
              {s.language ? ` (${s.language.toUpperCase()})` : ""}
            </option>
          ))}
        </select>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) addNewVersion(f);
            e.currentTarget.value = "";
          }}
        />
        {/* 如需按钮触发上传，取消注释
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-2 text-sm hover:bg-background"
        >
          <Plus className="h-4 w-4" /> Neue Version
        </button>
        */}
      </div>

      {/* 错误 / 加载 */}
      {err && <div className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>}
      {loading && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Lädt …
        </div>
      )}

      {/* 版本列表（点击即激活） */}
      <div className="space-y-2">
        {!loading &&
          current?.versions?.map((v) => {
            const active = v.id === current.activeVersionId;
            const selected = v.id === versionId;
            return (
              <div
                key={v.id}
                onClick={() => activateAndSelect(v.id)} // ✅ 点击整行即激活 + 选中
                className={[
                  "cursor-pointer rounded-2xl border px-3 py-3 transition",
                  active
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : selected
                    ? "border-border bg-background"
                    : "border-border hover:bg-background",
                ].join(" ")}
                title={active ? "Aktivierte Version" : "Klicken zum Aktivieren"}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-medium">{v.fileName}</div>
                      {active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          <Star className="h-3 w-3" /> Aktiv
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      Hochgeladen am {new Date(v.uploadedAt).toLocaleDateString()}
                    </div>
                    {v.note && <div className="mt-1 truncate text-xs text-muted">{v.note}</div>}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 避免触发激活
                        preview(v);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-2.5 py-1.5 text-xs hover:bg-background"
                      title="PDF ansehen"
                    >
                      <Eye className="h-4 w-4" />
                      Ansehen
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        {!loading && (!current || current.versions.length === 0) && (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
            Keine Versionen. Lade eine neue Version hoch.
          </div>
        )}
      </div>
    </div>
  );
}
