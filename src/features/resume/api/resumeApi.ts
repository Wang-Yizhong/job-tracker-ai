// --- file: src/features/resume/api/resumeApi.ts
import { http } from "@/lib/api/http";
import { joinApiPath } from "@/lib/api/config"; // 负责补上 /api/v1 前缀
import type { ResumeSeries, ResumeVersion,ResumeData,MatchMatrix } from "@/features/resume/types";
/** 上传返回（与后端 /v1/resumes/upload 对齐：data 信封已在 http.ts 解包） */
export interface UploadResumeResult {
  resumeId: string;   // seriesId
  versionId: string;
  fileKey: string;
  fileName: string;
  mime?: string;
  size?: number;
  uploadedAt: string;
  language?: string | null;
}

/** 系列列表（稳定 DTO） */
export interface ResumeSeriesListResponse {
  items: ResumeSeries[];
}

/** 版本列表（稳定 DTO：由 /v1/resumes/:seriesId/versions 的 ResumeSeries 适配而来） */
export interface ResumeVersionsResponse {
  versions: ResumeVersion[];
  activeVersionId?: string | null;
}

/* --------------------------------- 系列 --------------------------------- */

/** GET /api/v1/resumes  → { items } */
export async function listResumeSeries(): Promise<ResumeSeriesListResponse> {
  // 明确让 TS 知道 http.get 返回的是该类型
  const resp = await http.get<ResumeSeriesListResponse>(joinApiPath("/resumes"));

  // 兼容后端可能直接返回数组的旧实现
  if (Array.isArray(resp)) {
    return { items: resp as unknown as ResumeSeries[] };
  }
  return { items: resp?.items ?? [] };
}

/** POST /api/v1/resumes → 创建系列（按需使用） */
export async function createResumeSeries(payload: {
  title: string;
  language?: string;
}): Promise<ResumeSeries> {
  return http.post<ResumeSeries>(joinApiPath("/resumes"), payload);
}

/* --------------------------------- 版本 --------------------------------- */

/**
 * GET /api/v1/resumes/:seriesId/versions
 * 后端直接返回 ResumeSeries，我们在前端适配成 { versions, activeVersionId }
 */
export async function listResumeVersions(seriesId: string): Promise<ResumeVersionsResponse> {
  // 关键：显式声明泛型为 ResumeSeries，避免 TS 推断为 {}
  const series = await http.get<ResumeSeries>(joinApiPath(`/resumes/${seriesId}/versions`));
  return {
    versions: (series?.versions ?? []) as ResumeVersion[],
    activeVersionId: (series?.activeVersionId as string | undefined) ?? null,
  };
}

/**
 * POST /api/v1/resumes/:seriesId/activate  Body: { versionId }
 * 后端返回 { ok: true, series: ResumeSeries }
 */
export async function setActiveResumeVersion(seriesId: string, versionId: string) {
  return http.post<{ ok: boolean; series: ResumeSeries }>(
    joinApiPath(`/resumes/${seriesId}/activate`),
    { versionId }
  );
}

/* --------------------------------- 上传（v1） --------------------------------- */

/**
 * POST /api/v1/resumes/upload
 * http.ts 会把 { ok:true, data } 自动解包为 data，这里直接得到 UploadResumeResult
 */
export async function uploadResumeFile(
  file: File,
  language?: string,
  onProgress?: (pct: number) => void
): Promise<UploadResumeResult | { ok: boolean; fileKey: string; mimeType?: string }> {
  const form = new FormData();
  form.append("file", file);
  if (language) form.append("language", language);

  return http.post(
    joinApiPath("/resumes/upload"),
    form,
    {
      onUploadProgress: (evt: any) => {
        const total = typeof evt?.total === "number" ? evt.total : undefined;
        if (!total || total <= 0) return;
        const pct = Math.max(0, Math.min(100, Math.round((evt.loaded * 100) / total)));
        onProgress?.(pct);
      },
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
}

/* --------------------------------- 签名/预览 --------------------------------- */

/** POST /api/v1/resumes/sign  Body: { fileKey, downloadName? } → { url, filename } */
export async function getResumeSignedUrl(
  fileKey: string,
  downloadName?: string
): Promise<{ url: string; filename?: string }> {
  return http.post<{ url: string; filename?: string }>(
    joinApiPath("/resumes/sign"),
    { fileKey, downloadName }
  );
}

/**
 * 如果以后有免签直链，可使用此辅助；当前推荐用 sign。
 * 这里保留占位，但不在路由中暴露（OpenAPI 未定义 preview 端点）。
 */
export function getResumePreviewUrl(fileKey: string) {
  return `${joinApiPath("/resumes/preview")}?fileKey=${encodeURIComponent(fileKey)}`;
}

// ====== AI: Gap Questions / Rewrite ======
export type GapCoachDialogMsg = { role: "system" | "user" | "assistant"; content: string };

export interface GapQuestionsRequest {
  resume: any;              // 也可换成你的 ResumeData
  match: any;               // 也可换成你的 MatchMatrix
  dialog: GapCoachDialogMsg[];
  userInput: string;
}
export interface GapQuestionsResponse {
  ok: boolean;
  message?: { role: "assistant"; content: string; meta?: { focusSkill?: string } };
}

/** POST /api/v1/resumes/gap-questions */
export async function postGapQuestions(payload: GapQuestionsRequest): Promise<GapQuestionsResponse> {
  return http.post<GapQuestionsResponse>(joinApiPath("/resumes/gap-questions"), payload);
}

export interface RewriteResumeRequest {
  resume: any; // or ResumeData
  questions: Array<{ id: string; skill: string; must?: boolean; question: string; hint?: string }>;
  answers: Record<string, string>;
}

/** POST /api/v1/resumes/rewrite */
export async function rewriteResume(payload: RewriteResumeRequest) {
  return http.post(joinApiPath("/resumes/rewrite"), payload);
}
// ====== Parse & Match ======


export async function parseResumeFromUrl(
  payload: { url: string; filename?: string }
): Promise<ResumeData> {
  return http.post<ResumeData>(joinApiPath("/resumes/parse-resume"), payload);
}

export async function buildMatchMatrix(
  payload: { job: { text: string }; resume: { skills: string[] } }
): Promise<MatchMatrix> {
  return http.post<MatchMatrix>(joinApiPath("/resumes/match-matrix"), payload);
}
export async function postAISuggest(payload: {
  section: string;        // 前端传入的 path，如 "summary" / "experiences[0].highlights[0]"
  text: string;           // 当前文本
  jobContext?: string;    // JD 片段（可选）
  resume?: ResumeData;    // 如需上下文，可一起传（可选）
}): Promise<{ suggestion?: string }> {
  return http.post<{ suggestion?: string }>(
    joinApiPath("/resumes/suggest"), // <- 如果你后端就是 /ai/suggest，这里临时写 joinApiPath("/ai/suggest")
    payload
  );
}