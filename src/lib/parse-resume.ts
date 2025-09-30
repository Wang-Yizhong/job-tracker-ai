// --- file: src/lib/parse-resume.ts
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

/* 与 types/resume.ts 对齐 */
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

export type ResumeData = {
  name: string;
  title?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  summary?: string;
  skills: string[];
  experiences: ExperienceItem[];
  education?: EducationItem[];
};

/** 只解析传入的 Buffer，不读取任何本地路径 */
export async function extractTextFromFile(buf: Buffer, filename?: string) {
  const ext = (filename || "").toLowerCase().split(".").pop();
  if (ext === "docx") {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    return value;
  }
  const res = await pdfParse(buf); // 默认为 PDF
  return res.text;
}

export function toStructuredResume(raw: string): ResumeData {
  const text = normalize(raw);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const email = findFirst(lines, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phone = findFirst(lines, /\+?\d[\d\s().-]{7,}/);
  const website = findFirst(lines, /(https?:\/\/|www\.)\S+/i);
  const name = guessName(lines);
  const address = guessAddress(lines);
  const title = guessTitle(lines);

  const sections = sliceSections(text);

  // Skills：带噪声过滤
  const skills = parseSkills(sections.skills);

  const summary = sections.summary?.trim() || "";

  // Experiences：先增强版解析，若空则回退到旧版
  let experiences = parseExperiencesEnhanced(sections.experience);
  if (!experiences.length) {
    experiences = parseExperiencesLegacy(sections.experience);
  }

  const education = parseEducation(sections.education);

  return { name, title, address, email, phone, website, summary, skills, experiences, education };
}

/* ------------------------------- helpers ------------------------------- */

function normalize(s: string) {
  return s
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}

function findFirst(arr: string[], re: RegExp) {
  for (const l of arr) {
    const m = l.match(re);
    if (m) return m[0];
  }
  return "";
}

function guessName(lines: string[]) {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (/^[A-ZÄÖÜ][a-zäöüß]+(\s+[A-ZÄÖÜ][a-zäöüß]+){0,3}$/.test(l)) return l;
  }
  return lines[0] || "Your Name";
}

function guessTitle(lines: string[]) {
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (/(entwickler|softwareentwickler|entwicklerin|developer|engineer|manager|lead|architekt|architect|full[-\s]?stack|frontend|backend|projektleiter)/i.test(
      lines[i]
    )) {
      return lines[i];
    }
  }
  return "";
}

function guessAddress(lines: string[]) {
  const re = /\b(\d{5})\s+[A-Za-zÄÖÜäöüß\- ]+|[A-Za-zÄÖÜäöüß\- ]+\s+\d{1,4}[A-Za-z]?/;
  for (let i = 0; i < Math.min(15, lines.length); i++) if (re.test(lines[i])) return lines[i];
  return "";
}

/* ---------------------------- section slicing ---------------------------- */

type Sections = { summary?: string; skills?: string; experience?: string; education?: string };

/**
 * 混合策略：
 * 1) 先用更广的德/英标题切分
 * 2) 若 experience 仍为空，再用“年份/seit”兜底切出经验区
 * 3) 切片方式沿用“老版本”的简单按 index 切分，最大限度贴近老效果
 */
function sliceSections(text: string): Sections {
  const markers = [
    // Summary
    { key: "summary", re: /(zusammenfassung|profil|über mich|summary|profile|about|objective)\s*:?\s*$/im },
    // Skills
    { key: "skills", re: /(kenntnisse|fähigkeiten|kompetenzen|technische\s*fähigkeiten|technische\s*kenntnisse|technologien|tech\s*[- ]?stack|skills(\s*&\s*tools)?|skills|tooling|sprachen|sprachkenntnisse)\s*:?\s*$/im },
    // Experience
    { key: "experience", re: /(berufserfahrung|erfahrung|tätigkeiten|projekte|projekt(erfahrung)?|praktika|employment\s+history|work\s+(history|experience)|professional\s+experience|experience)\s*:?\s*$/im },
    // Education
    { key: "education", re: /(ausbildung|hochschule|studium|universität|bildung|education|academic\s+background|qualifications|abschlüsse)\s*:?\s*$/im },
  ] as const;

  const idxs: { key: keyof Sections; idx: number }[] = [];
  markers.forEach((m) => {
    const t = text.match(m.re);
    if (t?.index !== undefined) idxs.push({ key: m.key as keyof Sections, idx: t.index });
  });
  idxs.sort((a, b) => a.idx - b.idx);

  const out: Sections = {};
  for (let i = 0; i < idxs.length; i++) {
    const cur = idxs[i], next = idxs[i + 1];
    const chunk = text.slice(cur.idx, next ? next.idx : undefined);
    out[cur.key] = chunk.replace(/^\s*[\s\S]*?\n/, "").trim();
  }

  // 兜底：如果没切出 experience，尝试年份/seit 抽块
  if (!out.experience) {
    const yearOrSeit =
      /(^.*\b(19|20)\d{2}\b.*$|^.*\bseit\s+(19|20)\d{2}\b.*$)(?:\r?\n(?:.*\S.*))+?/gim;
    const blocks: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = yearOrSeit.exec(text)) !== null) {
      blocks.push(m[0]);
      if (m.index === yearOrSeit.lastIndex) yearOrSeit.lastIndex++;
    }
    if (blocks.length) out.experience = blocks.join("\n\n");
  }

  return out;
}

/* ------------------------------- skills ------------------------------- */
/**
 * 强化技能解析：规范化 + 白名单判断 + 噪声过滤 + 去重
 * 避免把姓名/日期/公司/地点等混到 skills
 */

const TECH_WHITELIST = [
  // frontend
  "html", "html5", "css", "sass", "less", "tailwind", "tailwindcss", "webpack", "vite",
  "react", "react.js", "reactjs", "next", "next.js", "vue", "vue.js", "nuxt", "nuxt.js", "angular",
  "javascript", "es6", "typescript",
  // backend & api
  "node", "nodejs", "node.js", "express", "php", "java", "python", "go", "rest", "rest api", "graphql", "api",
  // db
  "mongodb", "mongo", "postgres", "postgresql", "mysql", "sqlite", "redis", "elasticsearch",
  // testing
  "jest", "vitest", "mocha", "cypress", "playwright", "testing library", "react testing library", "unit test", "integration test",
  // devops
  "docker", "kubernetes", "k8s", "ci/cd", "pipeline", "github actions", "gitlab ci", "devops",
  // security
  "oauth", "cors", "encryption", "verschlüsselung", "authentifizierung", "security", "sicherheit",
  // tools / pm
  "git", "github", "gitlab", "jira", "postman", "swagger", "vscode", "figma",
  // methods
  "agile", "scrum", "kanban", "methoden", "methodik",
  // languages
  "deutsch", "german", "englisch", "english", "chinesisch", "chinese", "sprachkenntnisse", "languages",
  // misc categories wording often used in your CV
  "frontend", "backend", "frameworks", "libraries", "tools"
];

const NOISE_PATTERNS: RegExp[] = [
  // 日期/生日/签名行
  /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/i,             // 04.02.1998 / 23.07.2025
  /\b(19|20)\d{2}\b/i,                          // 年份
  /\bden\s+\d{1,2}\.\d{1,2}\.\d{2,4}\b/i,
  // 公司/组织/教育中的典型词
  /\b(gmbh|ag|co\.|ltd|ug|mbh|se|kg|ohg|inc|company|universit|hochschule|university|zab)\b/i,
  // 地点/国家缩写等
  /\b(berlin|münchen|munich|stuttgart|hamburg|köln|frankfurt|eislingen|de|at|ch)\b/i,
  // 简历模板里的说明/索引词
  /\b(unternehmen|zeit|position|beweise|index|anhang|anlage)\b/i,
  /\b(aufgrund|originalbilder|gezeigt)\b/i,
  // 兴趣/爱好类标题
  /\b(interessen|hobbys?)\b/i,
];

function looksLikeTechKeyword(s: string) {
  const low = s.toLowerCase();
  return TECH_WHITELIST.some((k) => low.includes(k));
}

function looksLikeNoise(s: string) {
  if (!s) return true;
  const t = s.trim();
  if (t.length < 2) return true;
  if (t.length > 60 && !looksLikeTechKeyword(t)) return true;      // 很长且不含技术词
  const words = t.split(/\s+/);
  if (words.length > 8 && !looksLikeTechKeyword(t)) return true;   // 词太多且无技术词
  if (/^[\-\*•]$/.test(t)) return true;                            // 单个符号
  if (/^\(?aufgrund/i.test(t)) return true;                        // 模板说明
  if (/^\(.{0,30}\)$/.test(t) && !looksLikeTechKeyword(t)) return true; // 小括号短语且非技术
  return NOISE_PATTERNS.some((re) => re.test(t));
}

function cleanSkillToken(s: string) {
  return s
    .replace(/^[-•*]\s*/, "")               // 去项目符
    .replace(/^[()\[\]]+|[()\[\]]+$/g, "")  // 去两端括号
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** 新版技能解析（替换旧的 parseSkills） */
function parseSkills(s?: string) {
  if (!s) return [];
  const raw = s.split(/\n|,/).map((x) => cleanSkillToken(x)).filter(Boolean);

  const filtered = raw.filter((token) => {
    if (looksLikeNoise(token)) return false;
    // 允许“类别: 技术名”的条目（如 Frontend: Nuxt.js）
    if (token.includes(":")) {
      const right = token.split(":").slice(1).join(":").trim();
      if (looksLikeTechKeyword(right) || right.length <= 40) return true;
    }
    // 普通 token：需要包含技术关键词或长度适中
    return looksLikeTechKeyword(token) || token.length <= 30;
  });

  // 去重（大小写无关）
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of filtered) {
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(t);
    }
  }
  return out;
}

/* ----------------------------- experiences ----------------------------- */

/** 增强版（优先） */
function parseExperiencesEnhanced(s?: string): ExperienceItem[] {
  if (!s) return [];
  const DE_MONTH =
    /(jan(?:uar)?|feb(?:ruar)?|märz|maerz|apr(?:il)?|mai|jun(?:i)?|jul(?:i)?|aug(?:ust)?|sep(?:t|tember)?|okt(?:ober)?|nov(?:ember)?|dez(?:ember)?)/i;
  const PRESENT = /(present|jetzt|heute|aktuell)/i;

  const looksCompany = (str: string) =>
    /\b(gmbh(\s*&\s*co\.\s*kg)?|ag|kg|ohg|ug|e\.k\.|mbh|se|ug \(haftungsbeschränkt\)|ltd|inc|co\.|company|solutions|studios?|labs?)\b/i.test(
      str
    ) || /有限|公司|集团|股份|科技|信息|网络|有限公司/.test(str);

  const looksRole = (str: string) =>
    /(entwickler|softwareentwickler|entwicklerin|developer|engineer|manager|lead|architekt|architect|werkstudent|praktikant|consultant|full[-\s]?stack|frontend|backend|projektleiter)/i.test(
      str
    );

  const periodRegexes = [
    new RegExp(
      `\\b(${DE_MONTH.source})\\s+\\d{4}\\s*[–—-]\\s*(${DE_MONTH.source}|${PRESENT.source}|\\d{4})\\b`,
      "i"
    ),
    /\b(19|20)\d{2}\s*[–—-]\s*(heute|aktuell|present|(19|20)\d{2})\b/i,
    new RegExp(`\\bseit\\s+(${DE_MONTH.source}\\s+)?(19|20)\\d{2}\\b`, "i"),
  ];

  const blocks = s.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  const items: ExperienceItem[] = blocks.map((b) => {
    const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return { role: "", company: "", period: "", location: "", highlights: [] };

    // period/location
    let period = "";
    for (const re of periodRegexes) {
      const m = b.match(re);
      if (m) {
        period = m[0];
        break;
      }
    }
    const location =
      findFirst(lines, /\b(remote|hybrid|vor\s*ort)\b/i) ||
      findFirst(lines, /\b([A-ZÄÖÜ][A-Za-zÄÖÜäöüß\- ]+)(?:,\s*(DE|AT|CH|[A-Z]{2}))?\b/);

    // role/company from first 1-2 lines
    const l1 = lines[0] || "";
    const l2 = lines[1] || "";
    let role = "",
      company = "";

    if (/ @ /i.test(l1)) {
      [role, company] = l1.split(/ @ /i).map((x) => x.trim());
    } else if (/\s+\|\s+/.test(l1)) {
      const parts = l1.split(/\s+\|\s+/);
      if (parts.length === 2) {
        if (looksCompany(parts[0]) && looksRole(parts[1])) {
          company = parts[0];
          role = parts[1];
        } else if (looksRole(parts[0]) && looksCompany(parts[1])) {
          role = parts[0];
          company = parts[1];
        } else {
          role = l1;
        }
      } else {
        role = l1;
      }
    } else {
      if (looksRole(l1) && looksCompany(l2)) {
        role = l1;
        company = l2;
      } else if (looksCompany(l1) && looksRole(l2)) {
        company = l1;
        role = l2;
      } else {
        role = l1;
        if (looksCompany(l2)) company = l2;
      }
    }

    // highlights：从第 3 行起；优先项目符；否则按句号/分号分句
    const rest = lines.slice(2);
    const bullets = rest
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter((l) => l.length > 0 && !/^\s*(kontakt|adresse|email|telefon|web(site)?):?/i.test(l))
      .flatMap((l) => (/[.;]$/.test(l) ? l.split(/[.;]\s*/).filter(Boolean) : [l]))
      .slice(0, 8);

    return {
      role: role || l1,
      company: company || l2 || "",
      period: period || "",
      location: location || "",
      highlights: bullets,
    };
  });

  // 过滤掉空块
  return items.filter(
    (it) =>
      it.role || it.company || it.period || (it.highlights && it.highlights.length > 0)
  );
}

/** 旧版兜底：保证“至少有东西可渲染” */
function parseExperiencesLegacy(s?: string): ExperienceItem[] {
  if (!s) return [];
  return s
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const lines = b.split("\n").map((l) => l.trim());
      const role = lines[0] || "";
      const company = lines[1] || "";
      const period =
        findFirst(
          lines,
          /\b(19|20)\d{2}[\.\-/–]?.*?(19|20)\d{2}\b|present|now|heute|aktuell/i
        ) || "";
      const location = findFirst(lines, /\b[A-Z][A-Za-zÄÖÜäöüß\- ]+,\s*[A-Z]{2,}\b/);
      const highlights = lines
        .slice(1)
        .map((l) => l.replace(/^[-•*]\s*/, ""))
        .filter(Boolean)
        .slice(0, 8);
      return { role, company, period, location, highlights };
    });
}

/* ------------------------------- education ------------------------------- */
function parseEducation(s?: string) {
  if (!s) return [];
  return s
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const lines = b.split("\n").map((l) => l.trim());
      const school = lines[0] || "";
      const degree =
        lines.find((l) => /(B\.?Sc\.?|M\.?Sc\.?|Bachelor|Master|Diplom|Ph\.?D\.?)/i.test(l)) ||
        "";
      const period = findFirst(lines, /\b(19|20)\d{2}.*(19|20)\d{2}\b/);
      return { school, degree, period };
    });
}
