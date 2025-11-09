// --- file: src/features/resume/components/StepHeader.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export type StepIndex = 1 | 2 | 3;

type Props = {
  /** 当前步骤（1/2/3） */
  current: StepIndex;
  /** 可选：外部受控切换；若不传则内部执行路由跳转 */
  onChange?: (next: StepIndex) => void;
};

const STEPS: Array<{ id: StepIndex; label: string; href: string }> = [
  { id: 1, label: "Upload & JD", href: "/resume" },
  { id: 2, label: "Analyse", href: "/resume/analyse" },
  { id: 3, label: "Lebenslauf bearbeiten", href: "/resume/edit" },
];

export default function StepHeader({ current, onChange }: Props) {
  const router = useRouter();

  const handleGo = React.useCallback(
    (next: StepIndex) => {
      // 1) 优先受控：交给父组件处理
      if (onChange) {
        onChange(next);
        return;
      }
      // 2) 无受控回调时，走路由
      const target = STEPS.find((s) => s.id === next)?.href ?? "/resume";
      router.push(target);
    },
    [onChange, router]
  );

  return (
    <nav className="flex flex-wrap items-center gap-3" aria-label="Schritt-Navigation">
      {STEPS.map((s, idx) => {
        const isActive = s.id === current;
        const isDone = s.id < current;
        const isDisabled = s.id > current;
        const canClick = isDone || isActive;

        return (
          <button
            key={s.id}
            type="button"
            aria-current={isActive ? "step" : undefined}
            aria-disabled={isDisabled}
            onClick={() => canClick && handleGo(s.id)}
            className={[
              "group inline-flex items-center gap-2 rounded-full border px-4 py-2 transition",
              isActive
                ? "bg-primary/10 text-primary border-primary/20"
                : isDone
                ? "bg-white text-foreground border-border hover:bg-muted"
                : "bg-white text-muted-foreground border-border cursor-default",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                isActive
                  ? "bg-primary text-white border-primary"
                  : isDone
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-white text-muted-foreground",
              ].join(" ")}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
            </span>
            <span className="text-sm">{s.label}</span>

            {idx < STEPS.length - 1 && (
              <span aria-hidden className="mx-1 select-none text-muted-foreground/60">
                →
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
