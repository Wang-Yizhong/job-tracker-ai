import React from "react";

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
    </div>
  );
}
