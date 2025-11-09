// --- file: src/features/resume/utils/index.ts
// Unified exports for all Resume-related utils (JD parsing, matching, language detection, etc.)

// 🔹 Types
export * from "@/features/resume/types/job-match.types";

// 🔹 Dictionaries
export * from "@/features/resume/utils/dict/tech-dict";
export * from "@/features/resume/utils/dict/aliases";

// 🔹 Text processing
export * from "@/features/resume/utils/text/lang-detect";

// 🔹 Parsing job descriptions
export * from "@/features/resume/utils/parse/parse-jd";

// 🔹 Matching logic
export * from "@/features/resume/utils/match/build-matrix";
