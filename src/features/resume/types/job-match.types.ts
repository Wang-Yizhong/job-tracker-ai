// --- file: src/features/resume/types/job-match.types.ts

export type ReqItem = {
  text: string; // canonicalized skill label
  raw?: string; // original matched token from JD
  must?: boolean;
  weight?: number; // e.g. 5=must, 3=nice, 2=other
  group: "Tech" | "Soft" | "Other";
};

export type JobParsed = {
  title?: string;
  company?: string;
  location?: string;
  tags: string[]; // for quick display chips
  requirements: ReqItem[]; // for matching engine
  lang?: "de" | "en" | "other";
  raw?: string; // original JD text for debugging
};

export type MatchRow = {
  skill: string; // canonicalized skill label
  state: "hit" | "partial" | "miss";
  must?: boolean;
  suggestion?: string | null; // short hint for improvement
};

export type MatchMatrix = {
  total: number; // number of required skills
  covered: number; // number of hits (full coverage)
  rows: MatchRow[];
};
