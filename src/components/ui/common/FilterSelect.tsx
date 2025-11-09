// --- file: src/components/ui/common/FilterSelect.tsx
"use client";

import * as React from "react";

export type SelectOption<V extends string | number = string> = {
  value: V;
  label: string;
  disabled?: boolean;
};

type Props<V extends string | number = string> = {
  value: V;
  onChange: (v: V) => void;
  options: SelectOption<V>[];
  placeholder?: string;     // 可选：当 value 可能为空时显示
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function FilterSelect<V extends string | number = string>({
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled,
  ariaLabel = "Filter auswählen",
}: Props<V>) {
  return (
    <div className={["relative", className ?? ""].join(" ")}>
      <select
        value={value as any}
        onChange={(e) => onChange((e.target.value as unknown) as V)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`
          appearance-none rounded-2xl border border-border bg-white pr-9 pl-3 py-2
          focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]
          disabled:cursor-not-allowed disabled:opacity-60
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 右侧小箭头 */}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
      </svg>
    </div>
  );
}
