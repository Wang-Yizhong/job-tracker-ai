// --- file: src/features/resume/hooks/useGapCoach.ts
"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import type { ResumeData, MatchMatrix } from "@/features/resume/types";
import { postGapQuestions, rewriteResume } from "@/features/resume/api/resumeApi";

/** Chat UI 消息（教练/用户） */
export type ChatViewMsg = { role: "coach" | "user"; text: string };
/** 传给 API 的对话消息 */
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

/** 能力缺口问题（用于 rewrite-resume） */
type GapQuestion = {
  id: string;
  skill: string;
  must?: boolean;
  question: string;
  hint?: string;
};

export const MIN_CHARS = 20;
export const MAX_CHARS = 500;
const MAX_MESSAGES = 5;

export type UseGapCoachParams = {
  open: boolean;
  resume: ResumeData;
  match: MatchMatrix;
  /** 若父组件想预置答案（可选） */
  answers?: Record<string, string>;
  /** 成功应用到简历时的回调（可选） */
  onApplyOptimized?: (payload: {
    optimized: ResumeData;
    summaryDraft?: string;
    bulletDraft?: string;
  }) => void;
};

export function useGapCoach({
  open,
  resume,
  match,
  answers = {},
  onApplyOptimized,
}: UseGapCoachParams) {
  const [messages, setMessages] = React.useState<ChatViewMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [left, setLeft] = React.useState(MAX_MESSAGES);
  const [busy, setBusy] = React.useState(false);
  const [qa, setQA] = React.useState<{ questions: GapQuestion[]; answers: Record<string, string> }>(
    { questions: [], answers: { ...answers } }
  );

  const seqRef = React.useRef(1);

  /** 取第一个缺口项（state !== "hit"，优先 must） */
  const firstMissingSkill = React.useMemo(() => {
    const rows = Array.isArray(match?.rows) ? match.rows : [];
    const first = [...rows]
      .filter((r: any) => r?.state !== "hit")
      .sort(
        (a: any, b: any) =>
          Number(Boolean(b?.req?.must)) - Number(Boolean(a?.req?.must))
      )[0];
    return first?.req?.text || null;
  }, [match]);

  /** 打开时初始化引导消息 */
  React.useEffect(() => {
    if (!open) return;
    setMessages([]);
    setInput("");
    setLeft(MAX_MESSAGES);
    setBusy(false);
    setQA({ questions: [], answers: { ...answers } });

    const base =
      "Ich bin dein JOB Coach.\n\n" +
      "Bitte antworte im STAR-Format und achte auf:\n" +
      "• Situation/Ort/Zeit/Unternehmen (z. B. 2023, Berlin, ACME)\n" +
      "• Deine Aufgabe/Rolle\n" +
      "• Deine Aktionen (Tools/Frameworks, Vorgehen)\n" +
      "• Ergebnis in Zahlen (+%, -ms, +Nutzer)\n\n" +
      `Mindestens ${MIN_CHARS} Zeichen pro Nachricht, maximal ${MAX_CHARS}. Deine Angaben fließen direkt in den Lebenslauf ein.`;

    const hint = firstMissingSkill ? `\n\nStarte gern mit einer konkreten Erfahrung zu „${firstMissingSkill}“.` : "";
    setMessages([{ role: "coach", text: base + hint }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, firstMissingSkill]);

  /** 别名，兼容旧的 QuestionFlow 写法 */
  const setUserInput = React.useCallback((v: string) => setInput(v), []);

  /** 判定是否像乱码/无效输入（简单启发） */
  const looksLikeGibberish = (t: string) => {
    const s = t.trim();
    if (!s) return true;
    if (/(.)\1{12,}/i.test(s)) return true; // 连续相同字符
    if (!/[a-zA-ZäöüÄÖÜß0-9]/.test(s)) return true; // 缺少可读字符
    return false;
  };

  /** 只保留最近 8 条对话传给后端 */
  const toApiDialog = (viewMsgs: ChatViewMsg[]): ChatMsg[] =>
    viewMsgs.slice(-8).map((m) => ({
      role: m.role === "coach" ? "assistant" : "user",
      content: m.text,
    }));

  const belowMin = input.trim().length > 0 && input.trim().length < MIN_CHARS;

  /** 发送当前输入 → /v1/resumes/gap-questions（通过 resumeApi） */
  const sendMutation = useMutation({
    mutationFn: async (payload: {
      dialog: ChatMsg[];
      userInput: string;
      resume: ResumeData;
      match: MatchMatrix;
    }) => {
      const res = await postGapQuestions(payload);
      return res;
    },
  });

  const send = React.useCallback(async () => {
    const raw = input.trim();
    if (!raw) return;

    if (raw.length < MIN_CHARS) {
      setMessages((m) => [...m, { role: "coach", text: `Deine Antwort ist etwas knapp. Bitte mind. ${MIN_CHARS} Zeichen.` }]);
      return;
    }
    if (raw.length > MAX_CHARS) {
      setMessages((m) => [...m, { role: "coach", text: `Bitte leicht kürzen (>${MAX_CHARS} Zeichen).` }]);
      return;
    }
    if (looksLikeGibberish(raw)) {
      setMessages((m) => [
        ...m,
        {
          role: "coach",
          text:
            "Deine Antwort wirkt schwer verständlich. Versuche es im STAR-Format (Ort/Zeit/Unternehmen, Rolle, Aktionen, messbares Ergebnis).",
        },
      ]);
      return;
    }
    if (left <= 0) {
      setMessages((m) => [...m, { role: "coach", text: "Demo-Limit erreicht. Danke für dein Verständnis!" }]);
      return;
    }

    setMessages((m) => [...m, { role: "user", text: raw }]);
    setLeft((n) => n - 1);
    setInput("");
    setBusy(true);

    try {
      const dialog = toApiDialog(messages.concat([{ role: "user", text: raw }]));
      const res = await sendMutation.mutateAsync({
        dialog,
        userInput: raw,
        resume,
        match,
      });

      const assistantText =
        (res as any)?.message?.content && typeof (res as any).message.content === "string"
          ? (res as any).message.content.trim()
          : "";

      const focusSkill =
        (res as any)?.message?.meta?.focusSkill || firstMissingSkill || "Allgemein";

      if (assistantText) {
        setMessages((m) => [...m, { role: "coach", text: assistantText }]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "coach", text: "Danke! Falls du Zahlen/Tools ergänzen kannst, wäre das perfekt." },
        ]);
      }

      // 记录到 Q/A，供后续 rewrite 使用
      const id = `q${seqRef.current++}`;
      const firstLine = assistantText.split(/\n+/)[0]?.slice(0, 120) || `Rückfrage zu ${focusSkill}`;
      setQA((prev) => ({
        questions: [...prev.questions, { id, skill: String(focusSkill), question: firstLine }],
        answers: { ...prev.answers, [id]: raw },
      }));
    } catch (e: any) {
      const msg = e?.message || "Die Anfrage ist fehlgeschlagen. Bitte später erneut versuchen.";
      setMessages((m) => [...m, { role: "coach", text: msg }]);
    } finally {
      setBusy(false);
    }
  }, [input, left, messages, resume, match, firstMissingSkill, sendMutation]);

  /** 应用到简历 → /v1/resumes/rewrite（通过 resumeApi） */
  const applyMutation = useMutation({
    mutationFn: async (payload: {
      resume: ResumeData;
      questions: GapQuestion[];
      answers: Record<string, string>;
    }) => {
      const optimized = await rewriteResume(payload);
      return optimized;
    },
  });

  const applyToCv = React.useCallback(async () => {
    try {
      if (Object.keys(qa.answers).length === 0) {
        setMessages((m) => [
          ...m,
          { role: "coach", text: "Bitte beantworte mindestens eine Frage im STAR-Format." },
        ]);
        return;
      }
      setBusy(true);

      const optimized = await applyMutation.mutateAsync({
        resume,
        questions: qa.questions,
        answers: qa.answers,
      });

      onApplyOptimized?.({
        optimized: optimized as ResumeData,
        summaryDraft: undefined,
        bulletDraft: undefined,
      });
    } catch (e: any) {
      const msg = e?.message || "Optimierung fehlgeschlagen. Bitte später erneut versuchen.";
      setMessages((m) => [...m, { role: "coach", text: msg }]);
    } finally {
      setBusy(false);
    }
  }, [qa, resume, applyMutation, onApplyOptimized]);

  return {
    // state
    messages,
    input,
    setInput,
    /** 兼容别名（避免组件报错） */
    setUserInput,
    left,
    busy,
    belowMin,

    // constants
    MIN_CHARS,
    MAX_CHARS,

    // actions
    send,
    applyToCv,
  };
}
