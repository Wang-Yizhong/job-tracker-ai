// --- file: src/features/resume/types.ts

export type ID = string;
export type LanguageCode = string | null;
export type ISODateTime = string;

/** Resume series (a group of resume versions) */
export interface ResumeSeries {
  id: ID;
  title: string;
  language: LanguageCode;
  updatedAt: ISODateTime;
  activeVersionId?: ID | null;
  versions?: ResumeVersion[];
}

/** Single uploaded resume version */
export interface ResumeVersion {
  id: ID;
  fileKey: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  note?: string | null;
  uploadedAt?: ISODateTime;
}

export type ExperienceItem = {
  company: string;
  role: string;
  period: string;
  location?: string;
  highlights: string[];
};

export type EducationItem = {
  school: string;
  degree?: string;
  period?: string;
};

/** Structured resume data returned from parsing */
export interface ResumeData {
  /** 个人信息（顶层扁平字段） */
  name: string;
  title?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  summary?: string;

  /** 技能数组 */
  skills: string[];

  /** 工作经历 */
  experiences: ExperienceItem[];

  /** 教育背景 */
  education?: EducationItem[];
}

export interface Experience {
  title?: string;
  company?: string;
  location?: string;
  period?: string;
  bullets?: string[];
}

export interface Project {
  name?: string;
  role?: string;
  description?: string;
  technologies?: string[];
  bullets?: string[];
}

export interface Education {
  degree?: string;
  school?: string;
  period?: string;
  details?: string[];
}

export interface Certification {
  name?: string;
  issuer?: string;
  date?: string;
}

export interface ResumeLanguage {
  name: string;
  level?: string;
}

/** Job requirement item parsed from job description */
export interface Requirement {
  text: string;
  group: string;
  must?: boolean;
  weight?: number;
  raw?: string;
}

/** One row in the resume-job match matrix */
export interface MatchRow {
  req: Requirement;
  state: "hit" | "gap";
  reason?: string;
}

/** Resume-job comparison result */
export interface MatchMatrix {
  total: number;
  covered: number;
  rows: MatchRow[];
}

/** AI suggestion for a resume section */
export interface AiSuggestion {
  section: string;
  currentText: string;
  suggestion: string;
}

/** Response of AI suggestion batch */
export interface AiSuggestionBatchResponse {
  suggestions: string[];
}
