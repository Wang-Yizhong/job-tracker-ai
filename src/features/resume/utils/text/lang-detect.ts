// --- file: src/features/resume/utils/text/lang-detect.ts
// Simple heuristic-based language detector for German / English / Other job descriptions.
// Keeps it pure and dependency-free to ensure SSR/Vercel compatibility.

export function detectLang(t: string): "de" | "en" | "other" {
  if (!t) return "other";
  const s = t.toLowerCase();

  // German indicators
  if (
    /(wir|du|deine|dein|aufgaben|anforderungen|kenntnisse|bewirb dich|teamfähig|selbstständig|verantwortlich|arbeitsumfeld)/.test(
      s
    )
  ) {
    return "de";
  }

  // English indicators
  if (
    /(responsibilities|requirements|skills|apply now|we offer|your tasks|you will|join our team|english)/.test(
      s
    )
  ) {
    return "en";
  }

  return "other";
}
