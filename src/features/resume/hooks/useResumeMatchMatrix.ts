// --- file: src/features/resume/hooks/useResumeMatchMatrix.ts
"use client";

import { useState, useCallback } from "react";
import type { JobParsed, MatchMatrix } from "@/features/resume/types/job-match.types";
import { buildMatchMatrix } from "@/features/resume/utils";

/**
 * Hook: Build skill matching matrix between Resume and Job JD.
 */
export function useResumeMatchMatrix() {
  const [matrix, setMatrix] = useState<MatchMatrix | null>(null);

  const compute = useCallback(
    (job: JobParsed, resumeSkills: string[]) => {
      const m = buildMatchMatrix(job, resumeSkills);
      setMatrix(m);
      return m;
    },
    []
  );

  return { matrix, compute };
}
