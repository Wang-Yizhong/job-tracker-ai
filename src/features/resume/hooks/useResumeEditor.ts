// --- file: src/features/resume/hooks/useResumeEditor.ts
"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import type { ResumeData } from "@/features/resume/types";
import { postAISuggest } from "@/features/resume/api/resumeApi";

/** 从 sessionStorage 恢复：优先优化结果 -> 解析结果 -> Step1 的 pending 包里可能的简历字段 */
function restoreResumeFromSession(): { resume: ResumeData | null; jobContext?: string } {
  try {
    const rawOpt = sessionStorage.getItem("resume:optimized");
    if (rawOpt) {
      const obj = JSON.parse(rawOpt);
      return { resume: obj?.resume ?? obj ?? null, jobContext: readJobContext() };
    }

    const rawParsed = sessionStorage.getItem("resume:parsed");
    if (rawParsed) {
      const obj = JSON.parse(rawParsed);
      return { resume: obj?.resume ?? obj ?? null, jobContext: readJobContext() };
    }

    // 早期 pending 里可能没有简历数据，这里只是兜底
    const rawPending = sessionStorage.getItem("resume:pendingAnalyse");
    if (rawPending) {
      const obj = JSON.parse(rawPending);
      return { resume: obj?.resume ?? null, jobContext: readJobContext() };
    }

    return { resume: null, jobContext: readJobContext() };
  } catch {
    return { resume: null, jobContext: readJobContext() };
  }
}

function readJobContext(): string | undefined {
  try {
    const raw = sessionStorage.getItem("resume:jobContext");
    if (!raw) return undefined;
    const o = JSON.parse(raw);
    return typeof o?.notes === "string" ? o.notes : undefined;
  } catch {
    return undefined;
  }
}

/** 将 a.b[0].c 路径安全写入 target */
function setByPath(target: any, path: string, value: any) {
  const tokens = tokenizePath(path);
  let cur = target as any;
  for (let i = 0; i < tokens.length - 1; i++) {
    const t = tokens[i];
    if (typeof t === "number") {
      if (!Array.isArray(cur)) cur = [];
    }
    if (cur[t as any] == null) cur[t as any] = typeof tokens[i + 1] === "number" ? [] : {};
    cur = cur[t as any];
  }
  (cur as any)[tokens[tokens.length - 1] as any] = value;
}

function tokenizePath(path: string): (string | number)[] {
  const parts: (string | number)[] = [];
  path.split(".").forEach((seg) => {
    const re = /(\w+)(\[(\d+)\])?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg))) {
      const key = m[1];
      parts.push(key);
      if (m[3] !== undefined) parts.push(Number(m[3]));
    }
  });
  return parts;
}

type UseResumeEditorOptions = {
  /** 可外部覆盖 JD 上下文，不传则尝试从 sessionStorage 读取 */
  jobContext?: string;
};

export function useResumeEditor(opts?: UseResumeEditorOptions) {
  const [{ resume, jobContext }, setState] = React.useState(() => restoreResumeFromSession());
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [busyPath, setBusyPath] = React.useState<string | null>(null);

  // 简单撤销：每个 path 一份最后一次旧值
  const undoRef = React.useRef<Map<string, any>>(new Map());

  React.useEffect(() => {
    setLoaded(true);
  }, []);

  const onChange = React.useCallback((path: string, value: string) => {
    if (!resume) return;
    const next = structuredClone(resume);
    // 记录撤销
    const prevSnap = structuredClone(resume);
    undoRef.current.set(path, readByPath(prevSnap, path));

    setByPath(next as any, path, value);
    setState((s) => ({ ...s, resume: next }));
  }, [resume]);

  const onUndo = React.useCallback((path: string) => {
    if (!resume) return;
    if (!undoRef.current.has(path)) return;
    const prev = undoRef.current.get(path);
    const next = structuredClone(resume);
    setByPath(next as any, path, prev);
    setState((s) => ({ ...s, resume: next }));
    undoRef.current.delete(path);
  }, [resume]);

  /** AI 建议 → 统一用 resumeApi.postAISuggest + useMutation */
  const suggestMutation = useMutation({
    mutationFn: async (payload: { section: string; text: string; jobContext?: string }) => {
      return postAISuggest(payload);
    },
  });

  const onSuggest = React.useCallback(
    async (path: string, current: string, context?: { resume: ResumeData; jobContext?: string }) => {
      if (!resume) return;
      try {
        setBusyPath(path);

        const res = await suggestMutation.mutateAsync({
          section: path,
          text: current ?? "",
          jobContext: context?.jobContext ?? opts?.jobContext ?? jobContext ?? "",
        });

        const text =
          (res as any)?.suggestion && typeof (res as any).suggestion === "string"
            ? (res as any).suggestion
            : "";

        if (text) {
          const next = structuredClone(resume);
          // 撤销快照
          undoRef.current.set(path, readByPath(structClone(resume), path));
          setByPath(next as any, path, text);
          setState((s) => ({ ...s, resume: next }));
        }
      } finally {
        setBusyPath(null);
      }
    },
    [resume, jobContext, opts?.jobContext, suggestMutation]
  );

  const onExport = React.useCallback(() => {
    if (!resume) return;
    window.print();
  }, [resume]);

  const save = React.useCallback(async () => {
    if (!resume) return;
    setSaving(true);
    try {
      // 这里留钩子：未来接 /resumes/save
      await new Promise((r) => setTimeout(r, 1000));
      // 同步到 session，便于刷新后保留
      sessionStorage.setItem("resume:optimized", JSON.stringify({ resume }));
    } finally {
      setSaving(false);
    }
  }, [resume]);

  return {
    // state
    resume,
    jobContext: opts?.jobContext ?? jobContext,
    loaded,
    saving,
    busyPath, // 某个字段正在 AI 建议中，可用于显示局部 loading

    // actions
    onChange,
    onUndo,
    onSuggest,
    onExport,
    save,
  } as const;
}

/** 仅用于撤销快照读取 */
function readByPath(source: any, path: string): any {
  const tokens = tokenizePath(path);
  let cur = source;
  for (const t of tokens) {
    if (cur == null) return undefined;
    cur = cur[t as any];
  }
  return cur;
}

// 小工具：避免 TS 对 structuredClone 报错（老 TS 版本时）
function structClone<T>(v: T): T {
  return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}
