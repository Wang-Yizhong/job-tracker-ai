// --- file: src/app/resume/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Eye } from "lucide-react";
import ResumeHistory from "../../components/resumes/ResumeHistory";
import ResumeA4Editor from "../../components/resumes/ResumeA4Editor";
import AnalysisPanel, { MatchMatrix } from "../../components/resumes/AnalysisPanel";
import QuestionFlow from "../../components/resumes/QuestionFlow";
import {http} from "@/lib/axios";
import type { ResumeData } from "@/types/resume";

/* =================== Helpers & Types =================== */
type Requirement = { text: string; group: string; must?: boolean; weight?: number; raw?: string };
type ParsedJobRaw = { skills?: string[]; tags?: string[]; requirements?: (Requirement | string)[]; [k: string]: any };

/** 兼容 /resumes/parse 的各种返回形状，并兜底 skills=[] */
function safeUnwrapResume(res: any): ResumeData {
  const raw = res?.data ?? res;
  const resumeObj = raw?.resume ?? raw?.data ?? raw;
  if (!resumeObj || typeof resumeObj !== "object") throw new Error("Parser lieferte kein gültiges Resume-Objekt");
  if (!Array.isArray(resumeObj.skills)) resumeObj.skills = [];
  return resumeObj as ResumeData;
}

/** 极简兜底关键词（仅当 parse-job 没产出时，保证 job 不为空） */
function extractKeywordsFallback(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[(){}\[\],:;'"“”‘’]/g, " ")
    .split(/[^a-z0-9#+.\-]/g) // 保留 C++ / C# / .NET / tailwindcss 等
    .filter(Boolean)
    .filter((w) => w.length >= 2)
    .slice(0, 40);
}

/** 把 parse-job 的返回统一成 match-matrix 需要的 job：保证 requirements 非空且 group="Tech" */
function buildJobForMatrix(raw: ParsedJobRaw | null | undefined, textBlob: string) {
  const tags = Array.isArray(raw?.tags) ? raw!.tags! : [];
  const reqsMixed = Array.isArray(raw?.requirements) ? raw!.requirements! : [];
  const skills = Array.isArray(raw?.skills) ? raw!.skills! : [];

  // 1) 归一化 requirements
  let requirements: Requirement[] = reqsMixed
    .map((r: any) =>
      typeof r === "string"
        ? { text: r, group: "Tech" }
        : {
            text: String(r?.text ?? r?.raw ?? "").trim(),
            group: r?.group ?? "Tech",
            must: r?.must,
            weight: r?.weight,
            raw: r?.raw,
          }
    )
    .filter((r) => r.text);

  // 2) 若为空，用 tags/skills 填充
  if (requirements.length === 0) {
    const base = [...tags, ...skills].map((t) => String(t).trim()).filter(Boolean);
    requirements = base.map((t) => ({ text: t, group: "Tech" }));
  }

  // 3) 还为空：用 JD 文本提关键词兜底
  if (requirements.length === 0) {
    const kw = extractKeywordsFallback(textBlob);
    requirements = kw.map((t) => ({ text: t, group: "Tech" }));
  }

  // 4) 去重（按小写文本）
  const seen = new Set<string>();
  requirements = requirements.filter((r) => {
    const k = r.text.toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { ...(raw ?? {}), requirements, skills };
}

/* -------- API helpers -------- */
async function getSignedUrlByFileKey(fileKey: string): Promise<string> {
  const res = await http.post<{ url: string }>("/resumes/sign", { fileKey });
  const  url  = res.url;
  if (!url) throw new Error("Signierte URL fehlt im Response");
  return url;
}

 async function parseJob(text: string): Promise<ParsedJobRaw | null> {
  const res = await http.post<ParsedJobRaw | null>("/parse-job", { text });
  return res;
}

async function callMatchMatrix(job: any, resumeSkills: string[]) {
  const res = await http.post("/match-matrix", { job, resume: { skills: resumeSkills } });
  return res;
}

async function requestAiSuggestion(section: string, text: string, jobContext?: string) {
  const res = await http.post<{ suggestion?: string }>("/ai/suggest", { section, text, jobContext });
  return (res?.suggestion ?? "").trim();
}

/* ============== JD Plausibilitätscheck ============== */
function isLikelyJobDescription(text: string): { ok: boolean; reason?: string } {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 100) return { ok: false, reason: "Bitte gib mindestens 100 Zeichen ein." };
  const keywords = [
    /aufgaben|anforderungen|verantwortung|profil|wir bieten|deine mission/i,
    /requirements|responsibilities|your tasks|what you will do/i,
    /erfahrung|jahre|team|remote|standort/i,
    /react|vue|angular|node|typescript|graphql|java|python|sql|docker|kubernetes/i,
  ];
  const hit = keywords.some((re) => re.test(t));
  if (!hit) return { ok: false, reason: "Der Text wirkt nicht wie eine echte Stellenbeschreibung (fehlende typische Schlüsselwörter/Technologien)." };
  return { ok: true };
}

/* ===================== Seite ======================= */
export default function ResumePage() {
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | undefined>(undefined);

  const [refreshKey, setRefreshKey] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [jobParsed, setJobParsed] = useState<any>(null);
  const [match, setMatch] = useState<MatchMatrix | null>(null);

  const [jobContext, setJobContext] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [validMsg, setValidMsg] = useState<string>("");

  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesLang, setSeriesLang] = useState<string>("de");

  const [showQA, setShowQA] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mockUrl, setMockUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem("resume:jobContext");
      if (raw) {
        const ctx = JSON.parse(raw);
        setJobContext(ctx?.notes ?? "");
      }
    } catch {}
  }, []);

  function handlePick(p: { seriesId: string; versionId: string; fileKey: string; fileName: string }) {
    setSeriesId(p.seriesId);
    setVersionId(p.versionId);
    setFileKey(p.fileKey);
    setFilename(p.fileName);
    setMockUrl(null);
  }

  async function previewCurrent() {
    try {
      if (fileKey === "MOCK" && mockUrl) {
        window.open(mockUrl, "_blank");
        return;
      }
      if (!fileKey) return;
      const url = await getSignedUrlByFileKey(fileKey);
      window.open(url, "_blank");
    } catch (e: any) {
      alert(e?.message || "Vorschau fehlgeschlagen");
    }
  }

  const jdCheck = isLikelyJobDescription(jobContext || "");
  const canAnalyze = Boolean((fileKey || mockUrl) && jdCheck.ok);

  /** ✅ 关键：保证 setMatch 传入的是“后端的真实数据”，且 job 不为空 */
  async function handleAnalyze() {
    const isMock = fileKey === "MOCK";
    if (!isMock && (!fileKey || !versionId)) {
      setValidMsg("Bitte wähle links eine Lebenslauf-Version.");
      return;
    }
    const check = isLikelyJobDescription(jobContext || "");
    if (!check.ok) {
      setValidMsg(check.reason || "Bitte gib eine echte Stellenbeschreibung ein.");
      return;
    }
    setValidMsg("");
    setLoading(true);
    try {
      // 1) 简历解析
      const signedUrl = isMock ? (mockUrl as string) : await getSignedUrlByFileKey(fileKey!);
      const parsedResumeResp = await http.post("/resumes/parse", {
        url: signedUrl,
        filename: isMock ? "mock.pdf" : filename,
        versionId: isMock ? "mock-version" : versionId,
      });
      const resumeData = safeUnwrapResume(parsedResumeResp);
      const resumeSkills: string[] = Array.isArray(resumeData.skills) ? resumeData.skills : [];
      setResume(resumeData);

      // 2) JD 解析 + 归一化为 matrix 需要的 job（保证 requirements 非空）
      const parsedJobRaw = await parseJob(jobContext);
      const jobForMatrix = buildJobForMatrix(parsedJobRaw, jobContext);
      setJobParsed(jobForMatrix);

      // 3) 调用 /api/match-matrix —— 不再做二次映射，直接使用后端返回
   const mm = (await callMatchMatrix(jobForMatrix, resumeSkills)) as any;

      // ✅ 直接传后端结构给 AnalysisPanel（仅做轻微兜底）
      const uiMatch: MatchMatrix = {
        total: typeof mm?.total === "number" ? mm.total : Array.isArray(mm?.rows) ? mm.rows.length : 0,
        covered:
          typeof mm?.covered === "number"
            ? mm.covered
            : Array.isArray(mm?.rows)
            ? mm.rows.filter((r: any) => r?.state === "hit").length
            : 0,
        rows: Array.isArray(mm?.rows) ? mm.rows : [],
      };
      setMatch(uiMatch);
      setStep(2); // 确保跳到分析页
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Analyse fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  // Mock 数据
  function handleUseMock() {
    const url =
      "https://tyvshioiuupglckpvgxu.supabase.co/storage/v1/object/sign/resumes/cmfnydtfy0003v9z4iva6cjni/resumes/de/e36de01c-3ee8-4fef-980a-06db58ea055e.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zN2Q1NmYxMS02MTk1LTRjZjgtYmJmZi04MGY1YmEwZDhjZWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZXN1bWVzL2NtZm55ZHRmeTAwMDN2OXo0aXZhNmNqbmkvcmVzdW1lcy9kZS9lMzZkZTAxYy0zZWU4LTRmZWYtOTgwYS0wNmRiNThlYTA1NWUucGRmIiwiaWF0IjoxNzU5MTYwODY2LCJleHAiOjE3OTA2OTY4NjZ9.7RijvDpLz9WC6Y1ascCFBW3mPH5qcIZxWbdu6RSwl3A";

    const rawJD = `
Full Stack · Remote/Hybrid
Responsibilities: build & scale backend/frontend, collaborate, optimize performance, ensure quality, troubleshoot
Backend: Rust, Postgres, GraphQL (event-driven, microservices)
Frontend: Typescript, React, TailwindCSS, Relay
Nice: Stripe, Kubernetes, gRPC, MQTT, RabbitMQ, Grafana, OpenTelemetry
    `.trim();

    setFileKey("MOCK");
    setVersionId("MOCK");
    setFilename("mock.pdf");
    setMockUrl(url);
    setJobContext(rawJD);
    setValidMsg("");

    setTimeout(() => {
      setStep(1);
      handleAnalyze();
    }, 0);
  }

  async function confirmCreateSeries() {
    const title = seriesTitle.trim();
    if (!title) return;
    try {
      const res = await http.post<{ id: string }>("/resumes", { title, language: seriesLang || null });
      const  id  = res.id;
      setShowSeriesModal(false);
      setSeriesTitle("");
      setSeriesLang("de");
      setSeriesId(id);
      setVersionId(null);
      setFileKey(null);
      setFilename(undefined);
      setMockUrl(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Serie konnte nicht erstellt werden");
    }
  }

  function triggerCreateVersion() {
    if (!seriesId) {
      alert("Bitte wähle zuerst eine Serie (links in der Liste).");
      return;
    }
    fileInputRef.current?.click();
  }

  async function onVersionFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!seriesId) {
      alert("Bitte wähle zuerst eine Serie");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", f);

      const upRes = await http.post<{ fileKey: string }>("/resumes/upload", fd);
      const { fileKey } = upRes;

      const vRes = await http.post<{ id: string; fileKey: string; fileName: string }>(`/resumes/${seriesId}/versions`, {
        fileKey,
        fileName: f.name,
      });
      const { id, fileName } = vRes;

      setVersionId(id);
      setFileKey(fileKey);
      setFilename(fileName);
      setMockUrl(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err?.response?.data?.error || err?.message || "Version konnte nicht erstellt werden");
    }
  }

  const Stepper = (
    <div className="mx-auto mb-6 flex w-full max-w-6xl gap-4 px-4 print:hidden">
      {[
        { id: 1, label: "Upload & JD" },
        { id: 2, label: "Analyse" },
        { id: 3, label: "Lebenslauf bearbeiten" },
      ].map((s) => {
        const active = step === (s.id as any);
        const enabled =
          s.id === 1 ||
          (s.id === 2 && (fileKey || mockUrl) && isLikelyJobDescription(jobContext).ok) ||
          (s.id === 3 && resume && match);
        return (
          <button
            key={s.id}
            disabled={!enabled}
            onClick={() => enabled && setStep(s.id as any)}
            className={[
              "flex-1 rounded-2xl border px-5 py-3 text-sm font-medium transition",
              active ? "border-primary/30 bg-primary/10 text-primary" : enabled ? "border-border bg-white hover:bg-background" : "border-border bg-muted/20 text-muted cursor-not-allowed",
            ].join(" ")}
          >
            <span className="mr-2 rounded-full border px-2 py-0.5 text-xs">{s.id}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );

  /* ============== Step 1 ============== */
  const Step1 = (
    <div className="min-h-[calc(100vh-64px)] bg-background  mt-[20px]">
      {Stepper}
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="grid gap-6 md:grid-cols-[360px,1fr]">
          {/* 左列：历史与操作 */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium">Deutsch CV (DE)</div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-border bg-white px-4 py-2 text-sm hover:bg-background"
                  onClick={() => setShowSeriesModal(true)}
                >
                  + Neue Serie
                </button>
                <button type="button" className="rounded-xl border border-border bg-white px-4 py-2 text-sm hover:bg-background" onClick={triggerCreateVersion}>
                  Lebenslauf hochladen
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={onVersionFilePicked}
                />
              </div>
            </div>

            <ResumeHistory key={refreshKey} onSelect={handlePick} />

            {!fileKey && !mockUrl && (
              <div className="mt-4 rounded-2xl border border-dashed border-border p-5 text-center">
                <div className="mx-auto w-full max-w-[260px] rounded-xl bg-muted/10 px-4 py-8 text-sm text-muted">Noch keine Lebenslauf-Version ausgewählt.</div>
              </div>
            )}
          </div>

          {/* 右列：JD */}
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Stellenbeschreibung</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={previewCurrent}
                  disabled={!fileKey && !mockUrl}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${fileKey || mockUrl ? "border-border hover:bg-background" : "border-border text-muted cursor-not-allowed"}`}
                  title={!fileKey && !mockUrl ? "Bitte links eine Version auswählen" : "PDF ansehen"}
                >
                  <Eye className="h-4 w-4" />
                  Aktuellen Lebenslauf ansehen
                </button>

                <button
                  type="button"
                  onClick={handleUseMock}
                  className="inline-flex items-center justify-center rounded-2xl border border-border text-primary-foreground font-white px-3 py-2 text-sm font-medium hover:bg-background  bg-primary"
                  title="Mit Demo-PDF & Muster-JD befüllen und sofort analysieren"
                >
                  Mock Data
                </button>
              </div>
            </div>

            <textarea
              className="w-full rounded-2xl border border-border bg-background p-4 text-sm leading-6 outline-none"
              rows={14}
              placeholder="Füge hier die Stellenbeschreibung ein – desto genauer, desto besser."
              value={jobContext}
              onChange={(e) => setJobContext(e.target.value)}
            />
            <div className="mt-5 flex items-center gap-3">
              <button
                disabled={!canAnalyze || loading}
                onClick={handleAnalyze}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition ${
                  canAnalyze && !loading ? "bg-primary hover:opacity-95 active:opacity-90" : "bg-muted text-white/70 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analysiere …
                  </>
                ) : (
                  "Analyse starten"
                )}
              </button>
              <button
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-white px-5 py-2.5 text-sm font-medium hover:bg-background"
                onClick={() => {
                  setJobContext("");
                  setValidMsg("");
                }}
              >
                Zurücksetzen
              </button>
              {!canAnalyze && <span className="text-xs text-muted">Bitte wähle links eine Lebenslauf-Version (oder Mock Data) und füge eine echte Stellenbeschreibung (≥ 100 Zeichen) ein.</span>}
            </div>
            {validMsg && <p className="mt-3 text-sm text-rose-600">{validMsg}</p>}
          </div>
        </div>
      </div>

      {/* Modal: Neue Serie */}
      {showSeriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold">Neue Serie erstellen</h3>
            <label className="mb-2 block text-sm">Serienname</label>
            <input
              value={seriesTitle}
              onChange={(e) => setSeriesTitle(e.target.value)}
              placeholder="z. B. Deutsch CV / English CV"
              className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            />
            <label className="mb-2 block text-sm">Sprache (optional)</label>
            <select value={seriesLang} onChange={(e) => setSeriesLang(e.target.value)} className="mb-5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none">
              <option value="de">Deutsch (de)</option>
              <option value="en">Englisch (en)</option>
              <option value="">—</option>
            </select>
            <div className="flex items-center justify-end gap-3">
              <button
                className="rounded-xl border border-border bg-white px-4 py-2 text-sm hover:bg-background"
                onClick={() => {
                  setShowSeriesModal(false);
                  setSeriesTitle("");
                  setSeriesLang("de");
                }}
              >
                Abbrechen
              </button>
              <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-95 active:opacity-90" onClick={confirmCreateSeries}>
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  /* ============== Step 3（Editor） ============== */
  const setByPath = (obj: any, path: string, value: any) => {
    const tokens = tokenizePath(path);
    let cur = obj;
    for (let i = 0; i < tokens.length - 1; i++) {
      const t = tokens[i];
      if ((cur as any)[t] == null) (cur as any)[t] = {};
      cur = (cur as any)[t];
    }
    (cur as any)[tokens[tokens.length - 1] as any] = value;
  };

  const Step3 = (
    <div className="min-h-[calc(100vh-64px)] bg-background  mt-[20px]">
      {Stepper}

      <div className="mx-auto max-w-6xl px-4 pb-6">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div className="rounded-2xl border border-border bg-white px-4 py-2 text-sm text-muted">
            Bearbeite deinen Lebenslauf nach den Vorschlägen. Du kannst danach erneut analysieren.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={previewCurrent}
              disabled={!fileKey && !mockUrl}
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${fileKey || mockUrl ? "border-border bg-white hover:bg-background" : "border-border text-muted cursor-not-allowed"}`}
            >
              <Eye className="h-4 w-4" />
              PDF ansehen
            </button>
            <button onClick={handleAnalyze} className="rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-95 active:opacity-90">
              Erneut analysieren
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-white shadow-sm">
          <div className="h-[calc(100vh-160px)] overflow-y-auto px-2 md:px-4">
            {resume && (
              <ResumeA4Editor
                resume={resume}
                onChange={(path, text) => {
                  const next = structuredClone(resume);
                  if (!next) return;
                  setByPath(next as any, path, text);
                  setResume(next);
                }}
                onSuggest={async (path, cur, context) => {
                  const jd = context?.jobContext ?? "";
                  const s = await requestAiSuggestion(path, cur, jd);
                  const next = structuredClone(resume);
                  if (!next) return;
                  setByPath(next as any, path, s);
                  setResume(next);
                }}
                onUndo={() => {}}
                jobContext={jobContext}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ============== Step 渲染 ============== */
  if (step === 1) return Step1;

  if (step === 2)
    return (
      <div className="min-h-[calc(100vh-64px)] bg-background  mt-[20px]">
        {Stepper}
        <AnalysisPanel
          match={match ?? undefined}
          onNext={() => setStep(3)}
          onStartQA={() => setShowQA(true)}
          pageLimit={50}   // 放大，避免切片后看不到
          showBadge
        />
        {resume && match && (
          <QuestionFlow
            open={showQA}
            onClose={() => setShowQA(false)}
            resume={resume}
            match={match}
            onApplyOptimized={({ optimized }) => {
              setResume(optimized);
              setStep(3);
            }}
          />
        )}
      </div>
    );

  return Step3;
}

/* ============== path utils ============== */
function tokenizePath(path: string): (string | number)[] {
  const parts: (string | number)[] = [];
  path.split(".").forEach((seg) => {
    const re = /(\w+)(\[(\d+)\])?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(seg))) {
      const key = m[1];
      parts.push(key);
      if (m[3] !== undefined) parts.push(Number(m[3]));
    }
  });
  return parts;
}
