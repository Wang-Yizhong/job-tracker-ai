// src/components/FeedbackFab.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, X } from "lucide-react";

/** 把普通表单链接转换为可内嵌的 embed 链接 */
function toEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    // 典型形态: /viewform 或 /viewform?usp=...
    if (u.pathname.endsWith("/viewform")) {
      u.searchParams.set("embedded", "true");
      // 可选: 移除 usp 等冗余参数
      u.searchParams.delete("usp");
      return u.toString();
    }
    // 兜底：如果不是标准结尾，也尝试补上
    if (!u.searchParams.has("embedded")) {
      u.searchParams.set("embedded", "true");
    }
    return u.toString();
  } catch {
    return url;
  }
}

export default function FeedbackFab({
  formUrl,
  title = "Anonymes Feedback (optional)",
}: {
  formUrl: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const embedUrl = useMemo(() => toEmbedUrl(formUrl), [formUrl]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        aria-label="Feedback geben"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[60] rounded-full bg-primary text-white shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 px-4 h-12 flex items-center gap-2"
      >
        <MessageSquareText className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">Feedback</span>
      </button>

      {/* 弹窗（纯 Tailwind，自带遮罩 & 关闭） */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-start justify-center pt-20"
          onClick={() => setOpen(false)}
        >
          {/* 遮罩 */}
          <div className="absolute inset-0 bg-black/50" />

          {/* 面板 */}
          <div
            className="relative z-[71] w-[min(96vw,900px)] h-[min(80vh,720px)] rounded-2xl border bg-background shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                aria-label="Schließen"
                className="rounded p-1 text-foreground/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => setOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 表单 iframe */}
            <div className="w-full h-full bg-background">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                // 允许基本能力；Google Forms 不需要额外 sandbox
                allow="fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
