// 把“任意形状”的解析返回，规整为 ResumeData（适配你页面）
// 你的样例（skills 被拆行、company/role夹时间）已针对处理

import type { ResumeData, ExperienceItem, EducationItem } from "@/types/resume";

type AnyObj = Record<string, any>;

const str = (v: any) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());
const arr = (v: any) => (Array.isArray(v) ? v : v == null ? [] : [v]);

export function normalizeResume(raw: AnyObj): ResumeData {
  const name = str(raw.name);
  const title = str(raw.title);
  const address = str(raw.address);
  const email = str(raw.email);
  const phone = str(raw.phone);
  const website = str(raw.website);
  const summary = str(raw.summary);

  const skills = normalizeSkills(raw.skills);
  const experiences = normalizeExperiences(raw.experiences);
  const education = normalizeEducation(raw.education);

  return { name, title, address, email, phone, website, summary, skills, experiences, education };
}

/* ---------------- skills ---------------- */
function normalizeSkills(sk: any): string[] {
  // 输入可能是 ["Frontend: HTML", "CSS", "English (B2+", "Business Fluent)", ...]
  // 1) 去分类前缀；2) 合并被断行的括号；3) 按逗号/分号再拆；4) 去重
  let tokens = arr(sk).map(str).filter(Boolean).map(stripCategoryPrefix);
  tokens = mergeBrokenParens(tokens);

  const out: string[] = [];
  tokens.forEach((t) => {
    const parts = t.split(/[,;、]/).map((x) => x.trim()).filter(Boolean);
    (parts.length ? parts : [t]).forEach((p) => out.push(p));
  });

  return Array.from(new Set(out)).filter(Boolean);
}

function stripCategoryPrefix(s: string) {
  return s.replace(/^(frontend|languages?|tools?)\s*:\s*/i, "").trim();
}

function mergeBrokenParens(items: string[]) {
  const res: string[] = [];
  let buf = "";
  let balance = 0;

  const count = (text: string, ch: "(" | ")") => (text.match(new RegExp(`\\${ch}`, "g")) || []).length;

  for (const it of items) {
    const t = it.trim();
    if (!buf) {
      buf = t;
      balance = count(t, "(") - count(t, ")");
      continue;
    }
    if (balance > 0) {
      buf = `${buf} ${t}`.replace(/\s+/g, " ");
      balance += count(t, "(") - count(t, ")");
    } else {
      res.push(buf);
      buf = t;
      balance = count(t, "(") - count(t, ")");
    }
  }
  if (buf) res.push(buf);
  return res;
}

/* --------------- experiences --------------- */
const periodRegex =
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)?\.?\s*\d{4}\s*[–—-]\s*(?:Present|Now|Today|Heut[e]?|[A-Za-z]{3,9}\.?\s*\d{4}|\d{4})/i;

function extractPeriod(s: string): string {
  const m = s.match(periodRegex);
  if (m) return m[0].replace(/\s{2,}/g, " ").trim();
  const m2 = s.match(/\b(19|20)\d{2}\s*[–—-]\s*(?:Present|Now|\d{4})\b/i);
  return m2 ? m2[0] : "";
}

function looksLikeCompany(s: string) {
  return /(co\.?,?\s*ltd|gmbh|inc\.?|corp\.?|company|有限公司|科技|信息|网络|Chengdu|Beijing|Shanghai)/i.test(s);
}
function looksLikeTitle(s: string) {
  return /(developer|engineer|manager|lead|frontend|backend|full[\s-]?stack|intern)/i.test(s);
}

function normalizeExperiences(exps: any): ExperienceItem[] {
  return arr(exps)
    .map((e: AnyObj) => {
      let role = str(e.role);
      let company = str(e.company);

      const fromRole = extractPeriod(role);
      const fromCompany = extractPeriod(company);
      const statedPeriod = str(e.period);
      const period = statedPeriod || fromRole || fromCompany;

      // 如果 role 看起来像公司而 company 像职位，互换
      if (looksLikeCompany(role) && looksLikeTitle(company)) {
        const tmp = role;
        role = company;
        company = tmp;
      }

      // 去掉尾部的时间串及分隔符
      const stripTail = (s: string) =>
        s.replace(period, "").trim().replace(/[|•,，;:\-–—]\s*$/g, "").trim();

      role = stripTail(role);
      company = stripTail(company);

      const rawBullets = arr(e.highlights).map(str).filter(Boolean);
      const highlights = mergeWrappedLines(rawBullets).slice(0, 8);

      return {
        role,
        company,
        period,
        location: str(e.location),
        highlights,
      };
    })
    .filter((x: ExperienceItem) => x.company || x.role || x.highlights.length);
}

// 把“非句末 + 下一行不是新小节”的行拼接
function mergeWrappedLines(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let cur = lines[i];
    while (
      i + 1 < lines.length &&
      !/[。．.!?)]$/.test(cur) && // 当前行未以句号/感叹号/右括号结尾
      !/^[a-z]\)/i.test(lines[i + 1]) && // 下一行不是 a)/b)/c)
      !/^[A-Z].+?:$/.test(lines[i + 1]) // 下一行不是以冒号结尾的小节标题
    ) {
      cur = `${cur} ${lines[i + 1]}`.replace(/\s+/g, " ");
      i++;
    }
    out.push(cur.trim());
  }
  return Array.from(new Set(out)).filter(Boolean);
}

/* ---------------- education ---------------- */
function normalizeEducation(edu: any): EducationItem[] {
  return arr(edu)
    .map((ed: AnyObj) => {
      let school = str(ed.school);
      const degree = str(ed.degree);
      const stated = str(ed.period);
      const fromSchool = extractPeriod(school);
      const period = stated || fromSchool;

      if (period) {
        school = school.replace(period, "").trim().replace(/[|•,，;:\-–—]\s*$/g, "").trim();
      }
      if (!school && !degree && !period) return null as any;
      return { school, degree, period };
    })
    .filter(Boolean) as EducationItem[];
}
