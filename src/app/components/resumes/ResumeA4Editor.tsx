// --- file: src/components/resumes/ResumeA4Editor.tsx
"use client";
import React, { useState, useEffect } from "react";
import type { ResumeData } from "@/types/resume";
import {
  Sparkles,
  Undo2,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileDown,
  X,
} from "lucide-react";

/**
 * 德式审美 + 打印分页优化版
 * - 只对需要保护的小单元使用 avoid（标题、首条 bullet、单个 li）
 * - Section 不再禁止分页
 * - 打印时解除 A4 预览尺寸（min-h/固定宽度）
 * - 交互元素统一 print:hidden
 */

type Props = {
  resume: ResumeData;
  onChange: (path: string, value: string) => void;
  onSuggest: (
    path: string,
    current: string,
    context: { resume: ResumeData; jobContext?: string }
  ) => void;
  onUndo: (path: string) => void;
  showExportButton?: boolean;
  onExport?: () => void;
  jobContext?: string;
};

export default function ResumeA4Editor({
  resume,
  onChange,
  onSuggest,
  onUndo,
  showExportButton = true,
  onExport,
  jobContext,
}: Props) {
  const suggest = (path: string, current: string) => {
    onSuggest(path, current, { resume, jobContext });
  };

  /** 删除技能（扁平列表：移除后回写数组，并清空尾部残值） */
  const removeSkillByIndex = (idx: number) => {
    const arr = (resume.skills || []).slice();
    if (idx < 0 || idx >= arr.length) return;
    arr.splice(idx, 1);
    arr.forEach((v, i) => onChange(`skills[${i}]`, v));
    const originalLen = (resume.skills || []).length;
    for (let i = arr.length; i < originalLen; i++) onChange(`skills[${i}]`, "");
  };

  /** 在末尾新增技能 */
  const addSkill = (v: string) => {
    const nextIndex = resume.skills?.length ?? 0;
    onChange(`skills[${nextIndex}]`, v);
  };

  return (
    <div className="relative">
      {/* 屏幕提示（打印隐藏）：关闭浏览器 Headers/Footers */}
      {/* <div className="print:hidden mb-3 text-xs text-muted">
        提示：导出 PDF 前请在浏览器打印设置中关闭 “Headers and footers（页眉页脚）”。
      </div> */}

      <div
          id="resume-print"
  className="
    resume-sheet relative mx-auto w-[210mm] min-h-[297mm]
    rounded-2xl bg-white p-10 shadow-xl
    print:rounded-none print:shadow-none
    print:w-auto print:max-w-none print:min-h-0 print:h-auto print:p-0
  "
      >
       {/*  {showExportButton && (
          <button
            type="button"
            onClick={onExport ?? (() => window.print())}
            className="print:hidden absolute right-4 top-4 inline-flex items-center gap-2 rounded-md border border-border bg-white/90 px-3.5 py-2 text-sm shadow hover:bg-white"
            title="Als PDF exportieren (über Browser speichern)"
          >
            <FileDown className="h-4 w-4" />
            PDF exportieren
          </button>
        )} */}

        {/* 头部：姓名 + 职位 + 联系方式 */}
        <header className="mb-6 border-b border-border/80 pb-4">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
            <div>
              <EditableInline
                className="text-3xl font-extrabold tracking-tight leading-tight"
                value={resume.name}
                placeholder="Ihr Name"
                onSave={(v) => onChange("name", v)}
              />
              <EditableInline
                className="mt-1 text-[15px] text-muted"
                value={resume.title ?? ""}
                placeholder="Berufsbezeichnung / Schwerpunkt"
                onSave={(v) => onChange("title", v)}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] text-foreground md:text-right">
              <ContactLine
                icon={<MapPin className="h-4 w-4" />}
                text={resume.address ?? ""}
                onSave={(v) => onChange("address", v)}
                showActions={false}
                onSuggest={() => {}}
                onUndo={() => onUndo("address")}
              />
              <ContactLine
                icon={<Mail className="h-4 w-4" />}
                text={resume.email ?? ""}
                onSave={(v) => onChange("email", v)}
                showActions={false}
                onSuggest={() => {}}
                onUndo={() => onUndo("email")}
              />
              <ContactLine
                icon={<Phone className="h-4 w-4" />}
                text={resume.phone ?? ""}
                onSave={(v) => onChange("phone", v)}
                showActions={false}
                onSuggest={() => {}}
                onUndo={() => onUndo("phone")}
              />
              <ContactLine
                icon={<Globe className="h-4 w-4" />}
                text={resume.website ?? ""}
                onSave={(v) => onChange("website", v)}
                showActions={false}
                onSuggest={() => {}}
                onUndo={() => onUndo("website")}
              />
            </div>
          </div>
        </header>

        {/* Profil（允许 AI 建议） */}
        <Section title="Profil">
          <EditableBlock
            value={resume.summary ?? ""}
            placeholder="Kurze Zusammenfassung + Kernkompetenzen + Highlights …"
            onSave={(v) => onChange("summary", v)}
            onSuggest={() => suggest("summary", resume.summary ?? "")}
            onUndo={() => onUndo("summary")}
          />
        </Section>

        {/* Fähigkeiten（扁平展示；可编辑 & 删除；打印紧凑） */}
        <Section title="Fähigkeiten">
          <div className="mb-1 flex flex-wrap gap-2 print:gap-1">
            {(resume.skills || [])
              .filter(Boolean)
              .map((s, i) => (
                <SkillTag
                  key={i}
                  value={s}
                  onSave={(v) => onChange(`skills[${i}]`, v)}
                  onDelete={() => removeSkillByIndex(i)}
                />
              ))}
          </div>

          {(!resume.skills ||
            resume.skills.filter(Boolean).length === 0) && (
            <p className="text-sm text-muted">
              Noch keine Fähigkeiten. Hier klicken zum Hinzufügen:{" "}
              <AddInline onSave={(v) => addSkill(v)} />
            </p>
          )}

          {resume.skills && resume.skills.filter(Boolean).length > 0 && (
            <div className="mt-2">
              <AddInline
                placeholder="Skill hinzufügen…"
                onSave={addSkill}
              />
            </div>
          )}
        </Section>

        {/* Berufserfahrung（允许 AI 建议：role & highlights） */}
        <Section title="Berufserfahrung">
          <div className="space-y-5">
            {resume.experiences?.map((exp, i) => (
              <article
                key={i}
                className="
                  experience card rounded-lg border border-border p-4
                  print:border-0 print:p-0 print:break-inside-auto
                "
              >
                <div
                  className="
                    experience-header
                    flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between
                  "
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <EditableInline
                      className="font-semibold text-foreground"
                      value={exp.role}
                      placeholder="Position"
                      onSave={(v) => onChange(`experiences[${i}].role`, v)}
                    />
                    <span className="text-muted">@</span>
                    <EditableInline
                      className="font-medium text-foreground"
                      value={exp.company}
                      placeholder="Firma/Team"
                      onSave={(v) =>
                        onChange(`experiences[${i}].company`, v)
                      }
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <EditableInline
                      className="text-muted"
                      value={exp.period}
                      placeholder="Zeitraum"
                      onSave={(v) =>
                        onChange(`experiences[${i}].period`, v)
                      }
                    />
                    {exp.location && (
                      <span className="text-muted">{exp.location}</span>
                    )}
                    <RowActions
                      onSuggest={() =>
                        suggest(`experiences[${i}].role`, exp.role)
                      }
                      onUndo={() => onUndo(`experiences[${i}].role`)}
                    />
                  </div>
                </div>

                {/* 标题+首条要点同页 */}
                <div className="experience-firstlines">
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-3 list-disc space-y-2 pl-5">
                      <li>
                        <EditableInline
                          value={exp.highlights[0]}
                          placeholder="Ergebnisorientierte Leistung (mit Verb beginnen)"
                          onSave={(v) =>
                            onChange(
                              `experiences[${i}].highlights[0]`,
                              v
                            )
                          }
                        />
                        <RowActions
                          onSuggest={() =>
                            suggest(
                              `experiences[${i}].highlights[0]`,
                              exp.highlights?.[0] ?? ""
                            )
                          }
                          onUndo={() =>
                            onUndo(
                              `experiences[${i}].highlights[0]`
                            )
                          }
                          compact
                        />
                      </li>
                    </ul>
                  )}
                </div>

                {/* 其余要点允许分页 */}
                {exp.highlights && exp.highlights.length > 1 && (
                  <ul className="mt-2 list-disc space-y-2 pl-5">
                    {exp.highlights.slice(1).map((h, j) => (
                      <li key={j + 1}>
                        <EditableInline
                          value={h}
                          placeholder="Ergebnisorientierte Leistung (mit Verb beginnen)"
                          onSave={(v) =>
                            onChange(
                              `experiences[${i}].highlights[${j + 1}]`,
                              v
                            )
                          }
                        />
                        <RowActions
                          onSuggest={() =>
                            suggest(
                              `experiences[${i}].highlights[${j + 1}]`,
                              h
                            )
                          }
                          onUndo={() =>
                            onUndo(
                              `experiences[${i}].highlights[${j + 1}]`
                            )
                          }
                          compact
                        />
                      </li>
                    ))}
                  </ul>
                )}

                {/* 新增一条要点 */}
                <div className="mt-2">
                  <AddInline
                    placeholder="Highlight hinzufügen (Enter zum Speichern)"
                    onSave={(v) =>
                      onChange(
                        `experiences[${i}].highlights[${
                          exp.highlights?.length ?? 0
                        }]`,
                        v
                      )
                    }
                  />
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* Ausbildung（固定信息：仅编辑，不提供 AI 建议） */}
        {resume.education && resume.education.length > 0 && (
          <Section title="Ausbildung">
            <div className="space-y-3">
              {resume.education.map((ed, i) => (
                <div
                  key={i}
                  className="
                    flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between
                  "
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <EditableInline
                      className="font-medium"
                      value={ed.school}
                      placeholder="Schule/Fakultät"
                      onSave={(v) =>
                        onChange(`education[${i}].school`, v)
                      }
                    />
                    {ed.degree && <span className="text-muted">•</span>}
                    <EditableInline
                      className="text-muted"
                      value={ed.degree ?? ""}
                      placeholder="Abschluss/Fachrichtung"
                      onSave={(v) =>
                        onChange(`education[${i}].degree`, v)
                      }
                    />
                  </div>
                  <EditableInline
                    className="text-sm text-muted"
                    value={ed.period ?? ""}
                    placeholder="Zeitraum"
                    onSave={(v) =>
                      onChange(`education[${i}].period`, v)
                    }
                  />
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ===================== 视图小组件 ===================== */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // 关键：不再禁止分页；改为允许自动分页
  return (
    <section className="mb-6 print:break-inside-auto">
      <h3 className="mb-2 border-l-4 border-primary pl-3 text-[15px] font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ContactLine({
  icon,
  text,
  onSave,
  onSuggest,
  onUndo,
  showActions = true,
}: {
  icon: React.ReactNode;
  text: string;
  onSave: (v: string) => void;
  onSuggest: () => void;
  onUndo: () => void;
  showActions?: boolean;
}) {
  return (
    <div className="group flex items-center justify-start gap-2 md:justify-end">
      {icon}
      <EditableInline
        className="max-w-[280px] truncate md:max-w-[340px]"
        value={text}
        placeholder="—"
        onSave={onSave}
      />
      {showActions && <InlineActions onSuggest={onSuggest} onUndo={onUndo} />}
    </div>
  );
}

function InlineActions({
  onSuggest,
  onUndo,
}: {
  onSuggest: () => void;
  onUndo: () => void;
}) {
  return (
    <span className="ml-1 hidden items-center gap-1 text-xs text-muted group-hover:flex print:hidden">
      <button className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5" onClick={onSuggest}>
        <Sparkles className="h-3.5 w-3.5" /> Vorschlag
      </button>
      <button className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5" onClick={onUndo}>
        <Undo2 className="h-3.5 w-3.5" /> Rückgängig
      </button>
    </span>
  );
}

function RowActions({
  onSuggest,
  onUndo,
  compact,
}: {
  onSuggest: () => void;
  onUndo: () => void;
  compact?: boolean;
}) {
  return (
    <span
      className={`ml-2 hidden items-center gap-1 text-xs text-muted md:inline-flex print:hidden ${
        compact ? "" : "mt-1"
      }`}
    >
      <button className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5" onClick={onSuggest}>
        <Sparkles className="h-3.5 w-3.5" /> Vorschlag
      </button>
      <button className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5" onClick={onUndo}>
        <Undo2 className="h-3.5 w-3.5" /> Rückgängig
      </button>
    </span>
  );
}

/** SkillTag：禁用 AI 建议，仅“编辑/删除”；打印时紧凑边框 */
function SkillTag({
  value,
  onSave,
  onDelete,
}: {
  value: string;
  onSave: (v: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  useEffect(() => setVal(value), [value]);

  return (
    <span className="chip group relative inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
      {editing ? (
        <input
          className="min-w-[120px] bg-transparent outline-none"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onSave(val);
          }}
          autoFocus
        />
      ) : (
        <span>{val}</span>
      )}
      {/* 删除 */}
      <button
        className="absolute -right-2 -top-2 hidden rounded-full border border-border bg-white p-0.5 text-muted shadow-sm group-hover:block print:hidden"
        title="Entfernen"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </button>
      {/* 悬浮：仅编辑按钮（无 AI） */}
      <span className="hidden items-center gap-1 text-xs text-muted group-hover:flex print:hidden">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1"
        >
          <Pencil className="h-3.5 w-3.5" /> Bearbeiten
        </button>
      </span>
    </span>
  );
}

function EditableInline({
  value,
  onSave,
  placeholder,
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  const [isComposing, setIsComposing] = useState(false);
  const committedRef = React.useRef(false);

  useEffect(() => {
    if (!editing) setVal(value ?? "");
  }, [value, editing]);

  const commit = () => {
    if (committedRef.current) return;
    committedRef.current = true;
    setEditing(false);
    onSave(val);
  };
  const cancel = () => {
    committedRef.current = true;
    setVal(value ?? "");
    setEditing(false);
  };

  return editing ? (
    <input
      className={`w-full border-b border-border bg-transparent outline-none ${className}`}
      value={val}
      placeholder={placeholder}
      onChange={(e) => setVal(e.target.value)}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      onKeyDown={(e) => {
        if (isComposing) return;
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      onBlur={commit}
      autoFocus
      onFocus={() => {
        committedRef.current = false;
      }}
    />
  ) : (
    <span
      className={`cursor-text ${className}`}
      onClick={() => setEditing(true)}
      title="Zum Bearbeiten klicken"
    >
      {val || <span className="text-muted">{placeholder ?? "—"}</span>}
    </span>
  );
}

function EditableBlock({
  value,
  onSave,
  placeholder,
  onSuggest,
  onUndo,
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  onSuggest: () => void;
  onUndo: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  useEffect(() => setVal(value ?? ""), [value]);

  return (
    <div className="group relative">
      {editing ? (
        <textarea
          rows={4}
          className="w-full rounded-lg border border-border bg-background p-3 text-sm leading-relaxed"
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onSave(val);
          }}
          autoFocus
        />
      ) : (
        <p
          className="whitespace-pre-wrap text-sm leading-relaxed text-foreground"
          onClick={() => setEditing(true)}
        >
          {val || <span className="text-muted">{placeholder ?? "—"}</span>}
        </p>
      )}
      <div className="absolute right-0 top-0 hidden gap-2 group-hover:flex print:hidden">
        <button
          onClick={() => setEditing((v) => !v)}
          className="rounded border border-border px-2 py-1 text-xs"
        >
          <Pencil className="mr-1 inline h-3.5 w-3.5" /> Bearbeiten
        </button>
        <button
          onClick={onSuggest}
          className="rounded border border-border px-2 py-1 text-xs"
        >
          <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Vorschlag
        </button>
        <button
          onClick={onUndo}
          className="rounded border border-border px-2 py-1 text-xs"
        >
          <Undo2 className="mr-1 inline h-3.5 w-3.5" /> Rückgängig
        </button>
      </div>
    </div>
  );
}

function AddInline({
  onSave,
  placeholder = "Hinzufügen…",
}: {
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [val, setVal] = useState("");
  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="text-sm text-blue-600 underline print:hidden"
      >
        + {placeholder}
      </button>
    );
  }
  return (
    <input
      className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-sm"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        setAdding(false);
        if (val.trim()) onSave(val.trim());
        setVal("");
      }}
      autoFocus
      placeholder={placeholder}
    />
  );
}
