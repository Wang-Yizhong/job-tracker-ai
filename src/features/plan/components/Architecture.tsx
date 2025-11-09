// --- file: src/features/overview/components/Architecture.tsx
import React from "react";
import Link from "next/link";
import { BookOpenText, ServerCog, ExternalLink } from "lucide-react";

export default function Architecture() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Architektur & Technologie
      </h2>

      <ul className="space-y-3 text-foreground/90">
        <li>
          <span className="font-bold">Frontend:</span>{" "}
          Next.js (App Router), React, TypeScript, TailwindCSS, shadcn/ui,
          lucide-react
        </li>
        <li>
          <span className="font-bold">Backend:</span>{" "}
          Next.js API Routes, Prisma / Supabase (Postgres, Auth, Storage), axios
          (zentraler API-Client)
        </li>
        <li>
          <span className="font-bold">Infra & AI:</span>{" "}
          Supabase, Upstash Redis, OpenAI API (Parsing, Empfehlungen, Q&A)
        </li>
        <li>
          <span className="font-bold">Deployment & Ops:</span>{" "}
          Vercel (Hosting, CI/CD), GitHub Actions (Tests, Build-Pipeline),
          Monitoring via Vercel Analytics & Supabase Logs, Sicherheit durch
          HTTPS, Auth & CSP
        </li>
      </ul>

      {/* 简单图示 */}
      <div className="mt-6 p-4 rounded-xl bg-muted/20 text-xs text-muted-foreground font-mono">
        <pre>{`User → Next.js App → axios → API Routes → Supabase / Redis → OpenAI
            ↓
        Deployment: Vercel (CI/CD, Hosting)
            ↓
        Monitoring: Vercel Analytics, Supabase Logs`}</pre>
      </div>

      {/* 新增：信息入口 */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="https://github.com/Wang-Yizhong/job-tracker-ai/#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <BookOpenText className="h-5 w-5 text-foreground/80" />
            <div className="text-sm">
              <div className="font-medium text-foreground">Projekt-README</div>
              <div className="text-muted-foreground">Struktur & Nutzung</div>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        </Link>

        <Link
          href="https://www.job-tracker.ink/docs/api"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 hover:bg-muted/30 transition"
        >
          <div className="flex items-center gap-3">
            <ServerCog className="h-5 w-5 text-foreground/80" />
            <div className="text-sm">
              <div className="font-medium text-foreground">API-Dokumentation</div>
              <div className="text-muted-foreground">Swagger / OpenAPI</div>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        </Link>
      </div>
    </div>
  );
}
