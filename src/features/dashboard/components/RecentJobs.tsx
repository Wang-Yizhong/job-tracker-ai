"use client";
import * as React from "react";
import { formatDateDisplay } from "@/utils/date";
import { JOB_STATUS_LABEL, JOB_STATUS_CLS } from "@/features/jobs/types";

type RecentJobsProps = {
  list: { id: string; title: string; company: string; status: string; createdAt?: string | null }[];
};

export default function RecentJobs({ list }: RecentJobsProps) {
  return (
    // ⬇️ 外层样式与其它卡片统一
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">Letzte Aktivitäten</h2>
        {/* 如果以后需要“Alle anzeigen”，可以在这里加链接 */}
      </div>

      {(!list || list.length === 0) ? (
        <p className="text-sm text-muted">Keine neuen Positionen.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {list.slice(0, 3).map((job) => (
            <li
              key={job.id}
              className="
                group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3
                py-2.5 first:pt-0 last:pb-0
                hover:bg-gray-50 rounded-lg px-2 -mx-2
              "
            >
              {/* 左侧圆点图标（与主题色一致） */}
              <span className="h-2 w-2 rounded-full bg-primary/70 group-hover:bg-primary/80" />

              {/* 中间：公司 + 职位（两行紧凑） */}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground" title={job.company}>
                  {job.company}
                </div>
                <div className="truncate text-xs text-muted" title={job.title}>
                  {job.title}
                </div>
              </div>

              {/* 状态徽章（小尺寸，统一色系） */}
              <span
                className={`justify-self-end rounded-full border px-2 py-0.5 text-[11px] leading-4 font-medium ${JOB_STATUS_CLS[job.status as keyof typeof JOB_STATUS_CLS]}`}
              >
                {JOB_STATUS_LABEL[job.status as keyof typeof JOB_STATUS_LABEL]}
              </span>

              {/* 日期（等宽数字，右对齐） */}
              <span className="justify-self-end text-xs font-medium text-muted tabular-nums">
                {formatDateDisplay(job.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
