// --- file: src/app/resume/page.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, Eye } from "lucide-react";
import ResumeHistory from "../../components/resumes/ResumeHistory";
import ResumeA4Editor from "../../components/resumes/ResumeA4Editor";
import AnalysisPanel, { MatchMatrix } from "../../components/resumes/AnalysisPanel";
import QuestionFlow from "../../components/resumes/QuestionFlow";
import api from "@/lib/axios";
import type { ResumeData } from "@/types/resume";

/* =================== Helpers & APIs =================== */
async function getSignedUrlByFileKey(fileKey: string): Promise<string> {
  try {
    const data = await api.post<{ url: string }>("/resumes/sign", { fileKey });
    if (!data?.url) throw new Error("Signierte URL fehlt im Response");
    return data.url;
  } catch (err: any) {
    throw new Error(err?.response?.data?.error || err?.message || "Signierte URL konnte nicht erstellt werden");
  }
}

async function parseJob(text: string) {
  try {
    const data = await api.post("/parse-job", { text });
    return data;
  } catch (err: any) {
    throw new Error(err?.response?.data?.error || err?.message || "Stellenbeschreibung konnte nicht geparst werden");
  }
}

async function buildMatchMatrix(job: any, resumeSkills: string[]) {
  try {
    const data = await api.post("/match-matrix", {
      job,
      resume: { skills: resumeSkills },
    });
    return data;
  } catch (err: any) {
    throw new Error(err?.response?.data?.error || err?.message || "Match-Matrix konnte nicht erstellt werden");
  }
}

async function requestAiSuggestion(section: string, text: string, jobContext?: string) {
  try {
    const data = await api.post<{ suggestion?: string }>("/ai/suggest", { section, text, jobContext });
    return (data?.suggestion ?? "").trim();
  } catch (err: any) {
    throw new Error(err?.response?.data?.error || err?.message || "Vorschlag fehlgeschlagen");
  }
}

/* ============== JD Plausibilitätscheck ============== */
function isLikelyJobDescription(text: string): { ok: boolean; reason?: string } {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 100)
    return { ok: false, reason: "Bitte gib mindestens 100 Zeichen ein." };
  const keywords = [
    /aufgaben|anforderungen|verantwortung|profil|wir bieten|deine mission/i,
    /requirements|responsibilities|your tasks|what you will do/i,
    /erfahrung|jahre|team|remote|standort/i,
    /react|vue|angular|node|typescript|graphql|java|python|sql|docker|kubernetes/i,
  ];
  const hit = keywords.some((re) => re.test(t));
  if (!hit) {
    return {
      ok: false,
      reason:
        "Der Text wirkt nicht wie eine echte Stellenbeschreibung (fehlende typische Schlüsselwörter/Technologien).",
    };
  }
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

  const historyRef = useRef<Record<string, string[]>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ⭐ 新增：mock pdf url 状态
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

  function handlePick(p: {
    seriesId: string;
    versionId: string;
    fileKey: string;
    fileName: string;
  }) {
    setSeriesId(p.seriesId);
    setVersionId(p.versionId);
    setFileKey(p.fileKey);
    setFilename(p.fileName);
    setMockUrl(null); // 一旦选择真实版本，清掉 mock
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

  async function handleAnalyze() {
    // 对真实与模拟两种情况统一处理
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
      // 1) 获取简历可访问 URL
      const signedUrl = isMock
        ? (mockUrl as string)
        : await getSignedUrlByFileKey(fileKey!);

      // 2) 解析简历
      const parsed = await api.post("/resumes/parse", {
        url: signedUrl,
        filename: isMock ? "mock.pdf" : filename,
        versionId: isMock ? "mock-version" : versionId,
      });
      const resumeData: ResumeData = (parsed as any)?.data ?? parsed;
      setResume(resumeData);

      // 3) 解析 JD
      const parsedJob = await parseJob(jobContext);
      setJobParsed(parsedJob);

      // 4) 构建匹配矩阵
      const mm = await buildMatchMatrix(parsedJob, resumeData.skills || []);
      const normalized: MatchMatrix = {
        total: mm?.total ?? (mm?.rows?.length ?? 0),
        covered: mm?.covered ?? (mm?.rows?.filter((r: any) => r.state === "hit")?.length ?? 0),
        rows: (mm?.rows ?? []).map((r: any) => ({
          skill: r.skill,
          state: r.state,
          must: r.must,
          suggestion: r.suggestion,
        })),
      };
      setMatch(normalized);

      setStep(2);
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || "Analyse fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  // ⭐ 新增：使用模拟数据（填充 JD 并自动分析）
  function handleUseMock() {
    const url =
      "https://tyvshioiuupglckpvgxu.supabase.co/storage/v1/object/sign/resumes/cmfnydtfy0003v9z4iva6cjni/resumes/de/e36de01c-3ee8-4fef-980a-06db58ea055e.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zN2Q1NmYxMS02MTk1LTRjZjgtYmJmZi04MGY1YmEwZDhjZWQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZXN1bWVzL2NtZm55ZHRmeTAwMDN2OXo0aXZhNmNqbmkvcmVzdW1lcy9kZS9lMzZkZTAxYy0zZWU4LTRmZWYtOTgwYS0wNmRiNThlYTA1NWUucGRmIiwiaWF0IjoxNzU5MTYwODY2LCJleHAiOjE3OTA2OTY4NjZ9.7RijvDpLz9WC6Y1ascCFBW3mPH5qcIZxWbdu6RSwl3A";

    // 原文替换 bace -> ABC（大小写、所有格）
    const rawJD = `
Vollständige Stellenbeschreibung
Full Stack
Full Time
Offices in Dortmund and Berlin
Remote (based in Germany or within Europe) or hybrid
All Genders
English, optional German
Start: asap

HEY!!

Want to shape the future of urban logistics and redefine local shopping for retailers, brands, and consumers? Yes?! Then you're in the right place to make a difference!

About bace

At bace, we’re not just another parcel locker - we’re building the future of urban logistics with a fully agnostic, multi-service hub network. Our smart hubs consolidate logistics, support local commerce, and create a seamless experience for retailers, brands, and consumers alike.

Here’s a snapshot of our recent milestones:

€3M+ funding secured & backed by strategic investors (including key players from retail & logistics)
Successfully tested our first hub in front of the BVB Stadium over 10 months in 23/24
Market launch in the beginning of Q3 2025 with major partners
Exclusive partnership with Pickshare to launch One Delivery - a game-changer in bundled last-mile deliveries
Real-world impact because our hubs aren’t just empty boxes - they revolutionize last-mile logistics with a seamless user experience, consolidating deliveries to reduce traffic, cut emissions, and create greener, more livable cities.
This is your chance to be part of a startup that’s moving fast, scaling smart, and transforming urban logistics from the ground up. Join us!

Responsibilities & Tasks as a Full Stack Dev. @ bace

As our Full Stack Developer, you’ll play a key role in building and maintaining the platform that powers bace’s smart logistics hubs. You’ll work across both the backend and frontend, ensuring that our platform delivers exceptional performance, scalability, and user experience.

What You’ll Do

Build and Scale: Develop and maintain both backend and frontend components of our platform.
Collaborate: Work closely with product and engineering teams to define, design, and implement new features.
Optimize Performance: Monitor system performance, identify bottlenecks, and make improvements.
Ensure Quality: Write clean, maintainable code and perform code reviews to ensure best practices.
Troubleshoot: Identify and resolve issues related to backend, frontend, and infrastructure.
Fact: We need your skills

Backend (min. 3 years): Experience with microservices & backend web applications, event sourcing, event driven architecture, task queues and distributed systems.
Required: Rust, Postgres, GraphQL
Nice to have: Stripe, Kubernetes, gRPC, MQTT, RabbitMQ, Grafana, Opentelemetry

Frontend (min. 1-2 years): Experience in Mobile App & Web development
Required: Typescript, React, TailwindCSS, Relay
Nice to have: Stripe, ShadCN, Tanstack, Zustand, Capacitor, BetterAuth
    `.trim();

    const jdABC = rawJD
      .replace(/bace’s/gi, "ABC’s")
      .replace(/bace/gi, "ABC")
      .replace(/About ABC/i, "About ABC") // 保持标题正确
      .replace(/@ ABC/i, "@ ABC");

    // 设置 Mock 状态：标记 fileKey/versionId 为 MOCK，存入 mockUrl
    setFileKey("MOCK");
    setVersionId("MOCK");
    setFilename("mock.pdf");
    setMockUrl(url);
    setJobContext(jdABC);
    setValidMsg("");

    // 直接触发分析（等待 React 应用 state，再调用）
    setTimeout(() => {
      setStep(1); // 确保停留在 Step 1 的 UI 也可以
      handleAnalyze();
    }, 0);
  }

  async function confirmCreateSeries() {
    const title = seriesTitle.trim();
    if (!title) return;

    try {
      const created = await api.post<{ id: string }>("/resumes", {
        title,
        language: seriesLang || null,
      });

      setShowSeriesModal(false);
      setSeriesTitle("");
      setSeriesLang("de");

      setSeriesId(created.id);
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
      const upData = await api.post<{ fileKey: string }>("/resumes/upload", fd);

      const vData = await api.post<{ id: string; fileKey: string; fileName: string }>(`/resumes/${seriesId}/versions`, {
        fileKey: upData.fileKey,
        fileName: f.name,
      });

      setVersionId(vData.id);
      setFileKey(vData.fileKey);
      setFilename(vData.fileName);
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
              active
                ? "border-primary/30 bg-primary/10 text-primary"
                : enabled
                ? "border-border bg-white hover:bg-background"
                : "border-border bg-muted/20 text-muted cursor-not-allowed",
            ].join(" ")}
          >
            <span className="mr-2 rounded-full border px-2 py-0.5 text-xs">
              {s.id}
            </span>
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
                <button
                  type="button"
                  className="rounded-xl border border-border bg-white px-4 py-2 text-sm hover:bg-background"
                  onClick={triggerCreateVersion}
                >
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
                <div className="mx-auto w-full max-w-[260px] rounded-xl bg-muted/10 px-4 py-8 text-sm text-muted">
                  Noch keine Lebenslauf-Version ausgewählt.
                </div>
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
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
                    (fileKey || mockUrl) ? "border-border hover:bg-background" : "border-border text-muted cursor-not-allowed"
                  }`}
                  title={!fileKey && !mockUrl ? "Bitte links eine Version auswählen" : "PDF ansehen"}
                >
                  <Eye className="h-4 w-4" />
                  Aktuellen Lebenslauf ansehen
                </button>

                {/* ⭐ 新增：使用模拟数据按钮 */}
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
              {!canAnalyze && (
                <span className="text-xs text-muted">
                  Bitte wähle links eine Lebenslauf-Version (oder Mock Data) und füge eine echte Stellenbeschreibung (≥ 100 Zeichen) ein.
                </span>
              )}
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
            <select
              value={seriesLang}
              onChange={(e) => setSeriesLang(e.target.value)}
              className="mb-5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none"
            >
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
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-95 active:opacity-90"
                onClick={confirmCreateSeries}
              >
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
              className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
                (fileKey || mockUrl) ? "border-border bg-white hover:bg-background" : "border-border text-muted cursor-not-allowed"
              }`}
            >
              <Eye className="h-4 w-4" />
              PDF ansehen
            </button>
            <button
              onClick={handleAnalyze}
              className="rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-95 active:opacity-90"
            >
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
          pageLimit={14}
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
