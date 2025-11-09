export function toDateString(input: unknown): string {
  if (!input) return "";
  if (input instanceof Date) return input.toISOString().slice(0, 10);
  if (typeof input === "string") {
    const match = input.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const d = new Date(input);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  try {
    const d = new Date(String(input));
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function parseDateSafe(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;
  const d = new Date(String(input));
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateDisplay(
  input: string | Date | null | undefined,
  locale: string = "de-DE"
): string {
  const date = parseDateSafe(input);
  if (!date) return "—";
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function isWithinRange(
  date: string | Date,
  from: string | Date,
  to: string | Date
): boolean {
  const d = parseDateSafe(date);
  const f = parseDateSafe(from);
  const t = parseDateSafe(to);
  if (!d || !f || !t) return false;
  return d >= f && d <= t;
}
