"use client";

import * as React from "react";
import clsx from "clsx";

/** 通用矩形骨架块 */
export function Skeleton({
  className,
  rounded = "md",
  style,
}: {
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  style?: React.CSSProperties;
}) {
  const roundedCls =
    rounded === "none"
      ? ""
      : rounded === "full"
      ? "rounded-full"
      : `rounded-${rounded}`;

  return (
    <div
      className={clsx(
        "animate-pulse bg-gray-200/70 dark:bg-gray-700/40",
        roundedCls,
        className
      )}
      style={style}
    />
  );
}

/** 多行文本骨架 */
export function SkeletonText({
  lines = 3,
  lineHeight = "h-3.5",
  className,
}: {
  lines?: number;
  lineHeight?: string;
  className?: string;
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={clsx(lineHeight, "w-full")} />
      ))}
    </div>
  );
}

/** 圆形骨架（头像/图标） */
export function SkeletonCircle({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={clsx("rounded-full", className)}
      rounded="full"
      style={{ width: size, height: size }}
    />
  );
}

/** 卡片骨架（快速占位） */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-xl border border-border bg-white p-4 shadow-sm",
        className
      )}
    >
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}
