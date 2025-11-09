// --- file: src/components/ui/common/SearchInput.tsx
"use client";

import * as React from "react";
import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;         // 可选：显示右侧小转圈
  disabled?: boolean;
  autoFocus?: boolean;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Suche...",
  className,
  loading,
  disabled,
  autoFocus,
}: Props) {
  return (
    <div className={["relative w-full md:w-72", className ?? ""].join(" ")}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`
          w-full rounded-2xl border border-border bg-white pl-9 pr-9 py-2
          outline-none ring-0
          focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]
          disabled:cursor-not-allowed disabled:opacity-60
        `}
        aria-label={placeholder}
      />
      {value && !loading && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-1 text-muted hover:bg-gray-100"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {loading && (
        <span
          aria-hidden
          className="absolute right-3 top-1/2 -translate-y-1/2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
        />
      )}
    </div>
  );
}
