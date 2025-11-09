"use client";

import * as React from "react";
import clsx from "clsx";

type TopbarProps = {
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
};

export default function Topbar({ title, right, className }: TopbarProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between border-b border-border bg-white px-4 pb-3",
        className
      )}
    >
      <div className="min-w-0">
        {typeof title === "string" ? (
          <h1 className="truncate text-xl font-bold">{title}</h1>
        ) : (
          title
        )}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
