// --- file: src/features/resume/hooks/useResumeAnalysis.ts
"use client";

import * as React from "react";
import type { ResumeData, MatchMatrix } from "@/features/resume/types";
import {
  getResumeSignedUrl,   // POST /api/v1/resumes/sign
  parseResumeFromUrl,   // POST /api/v1/resumes/parse-resume
  buildMatchMatrix,     // POST /api/v1/resumes/match-matrix
} from "@/features/resume/api/resumeApi";

type AnalyseParams = {
  fileKey: string;
  fileName?: string; // 可选：便于后端日志
  jdText: string;    // Step1 粘贴的 JD 全文
};

export function useResumeAnalysis(initial?: Partial<AnalyseParams>) {
  const [resume, setResume]   = React.useState<ResumeData | null>(null);
  const [match, setMatch]     = React.useState<MatchMatrix | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setErr]       = React.useState<string | null>(null);

  // 可选：预填（允许页面传入默认 fileKey / jdText）
  const lastRef = React.useRef<AnalyseParams | null>(
    initial?.fileKey && initial?.jdText
      ? { fileKey: initial.fileKey, fileName: initial.fileName, jdText: initial.jdText }
      : null
  );

  const reset = React.useCallback(() => {
    setResume(null);
    setMatch(null);
    setErr(null);
    setLoading(false);
    // 清理缓存（可选）
    try {
      sessionStorage.removeItem("resume:parsed");
      sessionStorage.removeItem("resume:match");
    } catch { /* ignore */ }
  }, []);

  const analyse = React.useCallback(async (params?: AnalyseParams) => {
    const p = params ?? lastRef.current;
    if (!p || !p.fileKey || !p.jdText?.trim()) {
      setErr("Analyse-Parameter unvollständig (fileKey / jdText).");
      return;
    }

    lastRef.current = p;
    setLoading(true);
    setErr(null);

    try {
      // 1) 生成签名 URL
      const { url } = await getResumeSignedUrl(p.fileKey, p.fileName);
      if (!url) throw new Error("Signierte URL fehlt im Response.");

      // 2) 解析简历（通过 URL）
      const parsedResume = await parseResumeFromUrl({ url, filename: p.fileName });

      // 3) 匹配矩阵（基于解析出的 skills）
      const mm = await buildMatchMatrix({
        job: { text: p.jdText },
        resume: {
          skills: Array.isArray((parsedResume as any)?.skills)
            ? (parsedResume as any).skills
            : [],
        },
      });

      // 4) 更新状态
      setResume(parsedResume as ResumeData);
      setMatch({
        total:
          typeof (mm as any)?.total === "number"
            ? (mm as any).total
            : Array.isArray((mm as any)?.rows)
              ? (mm as any).rows.length
              : 0,
        covered:
          typeof (mm as any)?.covered === "number"
            ? (mm as any).covered
            : Array.isArray((mm as any)?.rows)
              ? (mm as any).rows.filter((r: any) => r?.state === "hit").length
              : 0,
        rows: Array.isArray((mm as any)?.rows) ? (mm as any).rows : [],
      } as MatchMatrix);

      // 5) ✅ 缓存解析结果 & 矩阵给 Step3 使用
      try {
        sessionStorage.setItem("resume:parsed", JSON.stringify({ resume: parsedResume }));
        sessionStorage.setItem("resume:match", JSON.stringify(mm));
      } catch { /* ignore */ }
    } catch (e: any) {
      setErr(e?.message || "Analyse fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { resume, match, loading, error, analyse, reset } as const;
}
