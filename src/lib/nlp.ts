/* --- file: src/lib/nlp.ts -----------------------------------------------
   Lightweight DE/EN Resume & Job JD NLP utilities (no external deps)
   - Language detection
   - Section splitting (DE/EN)
   - Skill extraction (aliases, negations, must/nice, confidence, spans)
   - Language level parsing (e.g., Deutsch C1 / English B2)
   - Employment/location/salary heuristics
   - Resume header & experience parsing (dates bullets)
   - Matching (weighted, must/nice aware)
   ---------------------------------------------------------------------- */

export type Lang = "de" | "en";
export type Span = { text: string; start: number; end: number };

export type ParsedResume = {
  lang: Lang;
  header: {
    name: { value: string | null; confidence: number };
    email: { value: string | null; confidence: number };
    phone: { value: string | null; confidence: number };
    website: { value: string | null; confidence: number };
  };
  skills: {
    hard: Array<{ skill: string; confidence: number; spans: Span[] }>;
    soft: Array<{ skill: string; confidence: number; spans: Span[] }>;
  };
  experiences: Array<{
    company?: string;
    role?: string;
    period?: { from: { year: number; month: number }; to: { year: number; month: number } | null } | null;
    highlights: string[];
  }>;
  sections: Array<{ title: string; content: string; spans: Span[] }>;
};

export type ParsedJob = {
  lang: Lang;
  title?: string | null;
  sections: Array<{ title: string; content: string; spans: Span[] }>;
  tags: string[];            // canonical hard skills
  must: string[];            // subset of tags
  nice: string[];            // subset of tags
  softSkills: string[];
  location: string;          // remote / hybrid / on-site / city guess
  employment: "full-time" | "part-time" | "contract" | "unknown";
  contractType?: "permanent" | "contract" | "unknown";
  salary?: { currency: string; period: "year" | "month" | "hour"; min?: number; max?: number } | null;
  languages?: Array<{ lang: string; level?: string; required?: boolean }>;
  benefits?: string[];
  questions?: string[];
  experienceHints?: Array<{ skill: string; years: number; source?: string }>;
};

export type MatchRow = { skill: string; must: boolean; state: "hit" | "miss" | "partial"; score: number };
export type MatchMatrix = { rows: MatchRow[]; total: number; covered: number; coverage: number };

/* --------------------------- Section Dictionaries --------------------------- */
const DE_SECTIONS = [
  /vollständige stellenbeschreibung/i,
  /deine typische woche|aufgaben|tätigkeiten/i,
  /dein profil|anforderungen|qualifikationen|profil/i,
  /bonus|wünschenswert/i,
  /leistungen|benefits|wir bieten/i,
  /art der stelle|arbeitszeiten|arbeitsort/i,
  /gehalt|vergütung/i,
  /sprache|sprachen/i,
  /bewerbungsfrage|fragen/i,
  /stehen dir zur verfügung|tools|werkzeuge/i,
  // Generic/legacy:
  /fähigkeiten|kompetenzen|skills/i,
  /berufserfahrung|erfahrung|projekte|proj\./i,
  /ausbildung|bildung|studium/i,
  /zertifikate/i,
];

const EN_SECTIONS = [
  /job description|overview|about/i,
  /your week|responsibilities|what you will do|duties|role/i,
  /requirements|qualifications|profile/i,
  /nice to have|bonus|preferred/i,
  /benefits|we offer|perks/i,
  /employment|job type/i,
  /salary|compensation/i,
  /language|languages/i,
  /questions|application questions/i,
  /tools|stack/i,
  // Generic:
  /summary|profile/i,
  /skills|competencies/i,
  /experience|work experience|employment history|projects/i,
  /education/i,
  /certificates|certifications/i,
];

/* ----------------------------- Skill Aliases --------------------------------
   Canonical key -> aliases/surface forms (lowercase).
   Extend as needed. Combines DE/EN and common variants.
----------------------------------------------------------------------------- */
const SKILL_ALIASES: Record<string, string[]> = {
  // Frontend / Web
  react: ["react.js", "reactjs", "react js"],
  angular: ["angularjs", "angular js"],
  vue: ["vue.js", "vuejs", "vue js"],
  typescript: ["ts", "type script"],
  javascript: ["js", "ecmascript"],
  htmlcss: ["html/css", "html + css", "css3", "html5"],

  // SPA / Mobile
  spa: ["single-page-applications", "single page applications", "single-page-application", "single page app"],
  mobile: ["mobile apps", "mobile applications", "app-entwicklung", "app entwicklung"],

  // Backend / Infra
  node: ["node.js", "nodejs", "node js"],
  express: [],
  websocket: ["websocket", "web sockets", "web-socket"],
  rest: ["rest api", "restful"],
  graphql: [],
  docker: [],
  kubernetes: ["k8s"],
  cicd: ["ci/cd", "ci cd", "pipelines", "pipeline", "ci", "cd"],
  "gitlab-ci": ["gitlab ci", "gitlab ci/cd", "gitlab cicd", "gitlab pipelines"],
  heroku: [],
  aws: ["amazon web services"],

  // DB
  postgresql: ["postgres", "postgres sql", "postgresql"],
  mysql: [],
  mongodb: ["mongo", "mongo db"],
  redis: [],

  // PHP/Frameworks (NeuroNation JD)
  php: ["php 8", "php8", "php 8.x"],
  laravel: [],
  lumen: ["laravel lumen", "lumen framework"],
  slim: ["slim framework"],

  // Misc stacks in examples
  ngrx: [],
  hono: [],
  algolia: [],
  cloudflare: [],
  "builder-io": ["builder.io", "builderio"],
  hygraph: ["graphcms", "hygraph (graphcms)"],

  // Testing / QA
  "unit-testing": ["unit test", "unit tests", "unit testing", "unittests"],

  // Language
  german: ["deutsch"],
  english: ["englisch", "english"],

  // UX/UI
  ux: ["user experience", "ux design"],
  screendesign: ["screen design", "ui design"],

  // AI / Data (second JD)
  python: [],
  django: [],
  flask: [],
  fastapi: [],
  etl: ["etl/elt", "elt", "data pipelines"],
  "llm-local": ["lokale llms", "local llms", "large language models"],
  "prompt-engineering": ["prompt engineering", "prompts", "prompting"],
};

/* ------------------------ Soft Skills Dictionaries ------------------------- */
const SOFT_SKILLS = {
  de: ["kommunikation", "teamfähigkeit", "eigeninitiative", "analytisch", "verantwortung", "selbstständig", "neugier"],
  en: ["communication", "teamwork", "proactive", "analytical", "ownership", "self-starter", "curiosity"],
};

/* ----------------------------- Context Rules -------------------------------- */
const MUST_WORDS = {
  de: [/muss|erforderlich|voraussetzung|zwingend/i],
  en: [/must|required|prerequisite/i],
};
const NICE_WORDS = {
  de: [/wünschenswert|nice to have|von vorteil|bonus/i],
  en: [/nice to have|preferred|a plus|bonus/i],
};
const NEGATIONS = {
  de: [/ohne\s+\w+|nicht erforderlich|kein(e|en)?\s+\w+/i],
  en: [/\bno\s+\w+|not required|without\s+\w+/i],
};
const REQUIRED_FLAG = /(erforderlich|required)/i;

/* ------------------------------ Utilities ---------------------------------- */
const REG_WS = /\s+/g;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function detectLang(text: string): Lang {
  const deHits = (text.match(/\b(und|mit|für|nicht|über|kenntnisse|berufserfahrung|stellenbeschreibung)\b/gi) || []).length;
  const enHits = (text.match(/\b(and|with|for|not|about|experience|requirements|job description)\b/gi) || []).length;
  return deHits >= enHits ? "de" : "en";
}

export function splitSections(text: string, lang: Lang) {
  const headers = lang === "de" ? DE_SECTIONS : EN_SECTIONS;
  const lines = text.split(/\r?\n/);
  const sections: { title: string; content: string; spans: Span[] }[] = [];
  let cur = { title: "other", buf: [] as string[], start: 0, end: 0 };

  const isHeader = (s: string) => headers.some((re) => re.test(s.trim()));

  let offset = 0;
  lines.forEach((line) => {
    const lineStart = offset;
    const lineEnd = offset + line.length;
    offset = lineEnd + 1;

    if (isHeader(line)) {
      if (cur.buf.length) {
        const content = cur.buf.join("\n").trim();
        sections.push({
          title: cur.title,
          content,
          spans: content
            ? [{ text: content, start: cur.start, end: cur.end }]
            : [],
        });
      }
      cur = { title: line.trim().toLowerCase(), buf: [], start: lineEnd + 1, end: lineEnd + 1 };
    } else {
      cur.buf.push(line);
      cur.end = lineEnd;
    }
  });
  if (cur.buf.length) {
    const content = cur.buf.join("\n").trim();
    sections.push({
      title: cur.title,
      content,
      spans: content ? [{ text: content, start: cur.start, end: cur.end }] : [],
    });
  }
  return sections;
}

function findSectionTitleByOffset(
  sections: { title: string; spans: Span[] }[],
  idx: number,
): string {
  for (const s of sections) {
    for (const sp of s.spans) {
      if (idx >= sp.start && idx <= sp.end) return s.title;
    }
  }
  return "";
}

function normalizeSkillToken(t: string) {
  const s = t.toLowerCase();
  for (const [canon, aliases] of Object.entries(SKILL_ALIASES)) {
    if (s === canon || aliases.includes(s)) return canon;
  }
  return s;
}

/* ------------------- Header Info (name/email/phone/url) -------------------- */
export function extractHeaderInfo(text: string, lang: Lang) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.[0] || null;
  const phone = text.match(/(\+?\d[\d\s\-()]{6,})/g)?.[0] || null;
  const website = text.match(/\bhttps?:\/\/[^\s/$.?#].[^\s]*/gi)?.[0] || null;
  const firstLine = text.split(/\r?\n/)[0]?.trim() || "";
  const name = /^[A-ZÄÖÜ][\w .-]{2,}$/.test(firstLine) ? firstLine : null;

  return {
    name: { value: name, confidence: name ? 0.7 : 0.2 },
    email: { value: email, confidence: email ? 0.95 : 0 },
    phone: { value: phone, confidence: phone ? 0.8 : 0 },
    website: { value: website, confidence: website ? 0.8 : 0 },
  };
}

/* --------------------------- Period Parsing (DE/EN) ------------------------ */
const MONTHS = {
  de: { jan: 1, januar: 1, feb: 2, märz: 3, marz: 3, apr: 4, mai: 5, jun: 6, juli: 7, jul: 7, aug: 8, sep: 9, sept: 9, okt: 10, nov: 11, dez: 12 },
  en: { jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12 },
};

function parsePeriod(line: string, lang: Lang) {
  const m = line.toLowerCase().match(/([a-zäöü.]+)\s?(\d{2,4})\s?[–-]\s?(heute|present|[a-zäöü.]+\s?\d{2,4})/i);
  if (!m) return null;
  const monthMap = MONTHS[lang];
  const m1 = monthMap[m[1].replace(".", "") as keyof typeof monthMap];
  const y1 = Number(m[2].length === 2 ? "20" + m[2] : m[2]);
  let y2: number | null = null, m2: number | null = null;
  if (/heute|present/i.test(m[3])) {
    const d = new Date();
    y2 = d.getFullYear(); m2 = d.getMonth() + 1;
  } else {
    const parts = m[3].split(/\s+/);
    const mm = monthMap[parts[0].replace(".", "") as keyof typeof monthMap];
    const yy = Number((parts[1] || "").length === 2 ? "20" + parts[1] : parts[1]);
    if (yy) { y2 = yy; m2 = mm || 1; }
  }
  return { from: { year: y1, month: m1 || 1 }, to: y2 ? { year: y2, month: m2 || 1 } : null };
}

/* ----------------------------- Skill Extraction ---------------------------- */
const LANG_LEVEL_RE = /\b(deutsch|german|englisch|english)\b[^A-Za-z0-9]{0,12}\b(a1|a2|b1|b2|c1|c2)\b/i;

export function extractSkills(
  text: string,
  lang: Lang,
  sectionsForContext?: { title: string; spans: Span[] }[],
) {
  const found = new Map<
    string,
    { confidence: number; spans: Span[]; soft?: boolean; must?: boolean; nice?: boolean; level?: string }
  >();

  const push = (key: string, span: Span) => {
    const prev = found.get(key) || { confidence: 0, spans: [] as Span[] };
    prev.confidence = Math.min(1, prev.confidence + 0.2);
    prev.spans.push(span);
    found.set(key, prev);
  };

  const pushWithContext = (tok: string, idx: number) => {
    const span = { text: tok, start: idx, end: idx + tok.length };
    const ctx = text.slice(Math.max(0, idx - 60), Math.min(text.length, idx + tok.length + 60));
    const title = sectionsForContext ? findSectionTitleByOffset(sectionsForContext, idx) : "";

    // Negation window
    const neg = (NEGATIONS[lang] || []).some((r) => r.test(ctx));
    if (neg) return;

    const canon = normalizeSkillToken(tok);
    const prev = found.get(canon) || { confidence: 0, spans: [] as Span[] };

    // Base confidence + context bonus
    prev.confidence = Math.min(1, (prev.confidence || 0) + 0.2);

    // Section-driven must/nice bias
    if (/(dein profil|anforderungen|qualifikationen|requirements)/i.test(title || "")) {
      prev.must = true;
      prev.confidence = Math.min(1, prev.confidence + 0.1);
    }
    if (/(bonus|wünschenswert|nice to have|preferred)/i.test(title || "")) {
      prev.nice = true;
    }

    // Inline "(Erforderlich)/(Required)"
    if (REQUIRED_FLAG.test(ctx)) prev.must = true;

    prev.spans = [...(prev.spans || []), span];
    found.set(canon, prev);
  };

  // Hard skills by aliases
  const allTokens = [...new Set([
    ...Object.keys(SKILL_ALIASES),
    ...Object.values(SKILL_ALIASES).flat(),
  ])].sort((a, b) => b.length - a.length);

  allTokens.forEach((tok) => {
    const re = new RegExp(`\\b${escapeRe(tok)}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      pushWithContext(m[0], m.index);
    }
  });

  // Soft skills
  (SOFT_SKILLS[lang] || []).forEach((tok) => {
    const re = new RegExp(`\\b${escapeRe(tok)}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const span = { text: m[0], start: m.index, end: m.index + m[0].length };
      const key = normalizeSkillToken(tok);
      const prev = found.get(key) || { confidence: 0, spans: [] as Span[], soft: true };
      prev.confidence = Math.min(1, prev.confidence + 0.15);
      prev.soft = true;
      prev.spans.push(span);
      found.set(key, prev);
    }
  });

  // Language level
  const langM = LANG_LEVEL_RE.exec(text);
  if (langM) {
    const lname = /deutsch|german/i.test(langM[1]) ? "german" : "english";
    const prev = found.get(lname) || { confidence: 0, spans: [] as Span[] };
    prev.confidence = Math.max(prev.confidence, 0.95);
    prev.spans.push({ text: langM[0], start: langM.index, end: langM.index + langM[0].length });
    (prev as any).level = langM[2].toUpperCase();
    found.set(lname, prev);
  }

  return {
    hard: [...found.entries()]
      .filter(([_, v]) => !v.soft)
      .map(([skill, v]) => ({ skill, confidence: v.confidence, spans: v.spans, must: !!v.must, nice: !!v.nice, ...(v as any).level ? { level: (v as any).level } : {} })),
    soft: [...found.entries()]
      .filter(([_, v]) => v.soft)
      .map(([skill, v]) => ({ skill, confidence: v.confidence, spans: v.spans })),
  };
}

/* ------------------------ Resume Parsing (DE/EN) --------------------------- */
export function parseResume(text: string): ParsedResume {
  const lang = detectLang(text);
  const sections = splitSections(text, lang);
  const header = extractHeaderInfo(text, lang);
  const skills = extractSkills(text, lang, sections);

  // Experience from experience/project-like sections
  const expBlocks = sections.filter(s =>
    /experience|erfahrung|tätigkeiten|projekte|employment history/i.test(s.title),
  );

  const experiences = expBlocks.flatMap((b) => {
    const lines = b.content.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const buckets: any[] = [];
    let cur: any = null;

    lines.forEach((ln) => {
      // Company line heuristic
      if (/^\S.+(GmbH|AG|Ltd|Inc|Company|Technolog|Network|Studio|Team|Consult|Solutions|Software)/i.test(ln)) {
        if (cur) buckets.push(cur);
        cur = { company: ln, role: "", period: null, highlights: [] as string[] };
      } else if (parsePeriod(ln, lang)) {
        cur = cur || { company: "", role: "", period: null, highlights: [] as string[] };
        cur.period = parsePeriod(ln, lang);
      } else if (/^[-•–*]/.test(ln) || /^[A-ZÄÖÜ][^.!?]{4,}$/.test(ln)) {
        cur = cur || { company: "", role: "", period: null, highlights: [] as string[] };
        cur.highlights.push(ln.replace(/^[-•–*]\s?/, ""));
      } else if (!cur?.role && /\b(developer|engineer|manager|entwickler|leiter|projekt)\b/i.test(ln)) {
        cur = cur || { company: "", role: "", period: null, highlights: [] as string[] };
        cur.role = ln;
      }
    });
    if (cur) buckets.push(cur);
    return buckets.filter((x) => x.company || x.role || x.highlights.length);
  });

  return { lang, header, skills, experiences, sections };
}

/* ------------------------- Job Parsing (DE/EN) ----------------------------- */
function extractBenefits(text: string) {
  const list: string[] = [];
  const lines = text.split(/\r?\n/);
  const candidates = /(betriebliche altersvorsorge|weiterbildung|empfehlungsprogramm|erfolgsbeteiligung|firmenevents|flexible arbeitszeiten|homeoffice|mentoring|kostenlose getränke|parkplatz|rabatt|benefits|perks)/i;
  for (const ln of lines) if (candidates.test(ln)) list.push(ln.trim());
  return [...new Set(list)];
}
function extractQuestions(text: string) {
  return text.split(/\r?\n/).map((s) => s.trim()).filter((s) => /\?$/.test(s));
}
function extractYearsForSkill(text: string, skill: string) {
  const re = new RegExp(`${escapeRe(skill)}\\W+(\\d{1,2})\\s+Jahr`, "i");
  const m = re.exec(text);
  return m ? Number(m[1]) : null;
}
function inferTitle(raw: string) {
  const l1 = raw.split(/\r?\n/).map((s) => s.trim()).find(Boolean) || "";
  if (/vollständige stellenbeschreibung/i.test(l1)) return null;
  if (l1.length > 3 && l1.length < 120) return l1;
  return null;
}

export function parseJob(text: string): ParsedJob {
  const lang = detectLang(text);
  const sections = splitSections(text, lang);
  const title = inferTitle(text);

  const t = text.toLowerCase();

  // Employment / Contract
  const employment =
    /\bvollzeit|full[- ]?time\b/.test(t) ? "full-time" :
    /\bteilzeit|part[- ]?time\b/.test(t) ? "part-time" :
    /\bcontract|freelance|werkvertrag\b/.test(t) ? "contract" : "unknown";

  const contractType =
    /\bfestanstellung|unbefristet\b/.test(t) ? "permanent" :
    /\bbefristet|vertrag|freelance\b/.test(t) ? "contract" : "unknown";

  // Location / Remote
  const remote = /\bhomeoffice|remote|remotely\b/.test(t);
  const hybrid = /\bhybrid|teil-remote\b/.test(t);
  const location =
    remote ? (hybrid ? "hybrid" : "remote")
    : /\bhamburg|berlin|münchen|munich|köln|cologne|stuttgart|frankfurt|düsseldorf\b/i.test(text) ? (text.match(/\b(hamburg|berlin|münchen|munich|köln|cologne|stuttgart|frankfurt|düsseldorf)\b/i)?.[0] || "on-site")
    : "on-site";

  // Salary (EUR/year)
  const sal = text.match(/(\d{2,3}\.\d{3})\s*€\s*[-–]\s*(\d{2,3}\.\d{3})\s*€\s*(pro Jahr|p\.?a\.?|per year)/i);
  const salary = sal ? {
    currency: "EUR",
    period: "year" as const,
    min: Number(sal[1].replace(/\./g, "")),
    max: Number(sal[2].replace(/\./g, "")),
  } : null;

  // Skills with context
  const skillsAll = extractSkills(text, lang, sections);
  const tags = skillsAll.hard.map((s) => s.skill);
  const must = Array.from(new Set(skillsAll.hard.filter((s) => s.must).map((s) => s.skill)));
  const nice = Array.from(new Set(skillsAll.hard.filter((s) => s.nice).map((s) => s.skill)));

  // Language requirements
  const languages: ParsedJob["languages"] = [];
  const langM = LANG_LEVEL_RE.exec(text);
  if (langM) {
    const lname = /deutsch|german/i.test(langM[1]) ? "de" : "en";
    languages.push({ lang: lname, level: langM[2].toUpperCase(), required: /required|erforderlich/i.test(langM[0]) });
  } else {
    // Heuristic presence
    if (/\bdeutsch\b/i.test(text)) languages.push({ lang: "de", required: /erforderlich|required/i.test(text) });
    if (/\benglisch|english\b/i.test(text)) languages.push({ lang: "en", required: /erforderlich|required/i.test(text) });
  }

  // Benefits & Questions
  const benefits = extractBenefits(text);
  const questions = extractQuestions(text);

  // Experience hints for notable skills (example: Angular)
  const experienceHints: NonNullable<ParsedJob["experienceHints"]> = [];
  const angularYears = extractYearsForSkill(text, "Angular");
  if (angularYears) experienceHints.push({ skill: "angular", years: angularYears, source: "Praxis im Angular Development: " + angularYears + " Jahre" });

  return {
    lang, title, sections, tags, must, nice,
    softSkills: skillsAll.soft.map((s) => s.skill),
    location,
    employment,
    contractType,
    salary,
    languages,
    benefits,
    questions,
    experienceHints,
  };
}

/* ------------------------------- Matching ---------------------------------- */
export function matchSkills(job: ParsedJob, resume: { skills: string[] }): MatchMatrix {
  const resumeSet = new Set((resume.skills || []).map(normalizeSkillToken));
  const rows: MatchRow[] = job.tags.map((tag) => {
    const canon = normalizeSkillToken(tag);
    const hit = resumeSet.has(canon);
    const must = job.must.includes(canon);
    // TODO: partial: 同家族/相近（可根据需要扩展）
    const state: MatchRow["state"] = hit ? "hit" : "miss";
    const weight = must ? 2 : (job.nice.includes(canon) ? 0.5 : 1);
    const score = hit ? weight : 0;
    return { skill: tag, must, state, score };
  });
  const total = rows.reduce((s, r) => s + (r.must ? 2 : (job.nice.includes(normalizeSkillToken(r.skill)) ? 0.5 : 1)), 0);
  const covered = rows.reduce((s, r) => s + r.score, 0);
  const coverage = total > 0 ? covered / total : 0;
  return { rows, total, covered, coverage };
}

/* ------------------------------- Helpers ----------------------------------- */
export function toLowerClean(s: string) {
  return (s || "").toLowerCase().replace(REG_WS, " ").trim();
}

/* ---------------------------- Public Facade ---------------------------------
   你现有的 /api 路由可直接调用：
   - parseResume(text)   -> ParsedResume
   - parseJob(text)      -> ParsedJob
   - matchSkills(job, {skills}) -> MatchMatrix

   如果需要把 resume.rawText → ParsedResume：
   仍使用你现有的 extractTextFromFile(buf, filename)，然后把结果传给 parseResume。
----------------------------------------------------------------------------- */
