# 🌟 Job Tracker with AI

A **full-stack web app** to track job applications, analyze job descriptions with AI,  
and help job seekers reduce stress with motivational support.

---

## 🧭 Overview

This project is a **modern dashboard-style job management platform** built with the latest web technologies.  
It helps job seekers **organize applications**, **analyze job descriptions**, and **stay motivated** during the job-hunting journey.

---

## ✨ Features (MVP)

- 👤 **User Accounts** — Register / Login / Secure sessions  
- 💼 **Job CRUD** — Create, Read, Update, Delete job entries  
- 🏢 **Company Management** — Manage employers and job sources  
- 🧩 **Application Stages** — Saved → Applied → Interview → Offer → Rejected  
- 🗂️ **Simple Kanban View** — Visualize job progress  

---

## ⚙️ Tech Stack

| Layer | Technologies |
|:------|:--------------|
| **Frontend** | Next.js (App Router) • TypeScript |
| **Styling** | Tailwind CSS • shadcn/ui |
| **Forms & Validation** | React Hook Form • Zod |
| **Backend / API** | Next.js API Routes • Prisma • PostgreSQL |
| **Authentication** | NextAuth.js |
| **Deployment** | Vercel + Neon / Supabase |
| **State & Data** | React Query v5 • Zustand |
| **Dev Tools** | ESLint • Prettier • GitHub Actions |

---

## 🧩 Project Structure

```txt
src/
├── app/
│   ├── layout.tsx                      # Root layout (<html>, <body>, Providers, Toaster)
│   ├── providers.tsx                   # Global Providers (React Query, Theme, Zustand)
│   ├── globals.css                     # Global styles & Tailwind tokens
│   │
│   ├── (dashboard)/                    # Authenticated user area
│   │   └── jobs/                       # Jobs feature pages
│   │       ├── page.tsx                # Page orchestration (query + CRUD + modals)
│   │       └── layout.tsx              # Optional nested layout
│   │
│   └── api/                            # Server-side API routes
│       └── v1/
│           └── jobs/
│               └── route.ts            # Prisma + Zod + JSON response
│
├── features/
│   └── jobs/                           # 🧩 Jobs domain module
│       ├── components/
│       │   ├── JobForm.tsx             # Form UI (react-hook-form + zodResolver)
│       │   └── JobsTable.tsx           # Table UI (DataTable + actions)
│       │
│       ├── hooks/
│       │   └── useJobs.ts              # CRUD hooks (React Query)
│       │
│       ├── api/
│       │   └── jobsApi.ts              # REST API client (via axios)
│       │
│       ├── schemas/
│       │   └── job-form.schema.ts      # Zod schema + JobFormValues type
│       │
│       └── types.ts                    # Job domain types + labels
│
├── components/
│   └── ui/                             # Shared UI components (shadcn/ui)
│       ├── common/
│       │   ├── DataTable.tsx           # Generic table (sorting, pagination)
│       │   ├── Modal.tsx               # Reusable modal
│       │   └── ...
│       ├── layout/
│       │   └── Topbar.tsx              # App header
│       └── toaster.tsx                 # Global toast notifications
│
├── hooks/
│   ├── use-toast.ts                    # Toast hook
│   ├── use-debounce.ts                 # Debounce helper
│   └── use-data-table.ts               # Shared table state (pagination/sort/search)
│
├── lib/
│   └── api/
│       ├── http.ts                     # Axios instance + interceptors + CSRF handling
│       └── config.ts                   # API base URL + version helpers
│
└── utils/
    └── format-date.ts                  # Date formatting utilities
```txt
JobsPage (page.tsx)
   ↓
useJobsQuery()
   ↓
useDataTable() + jobsApi.list()
   ↓
http.get("/api/v1/jobs")
   ↓
/api/v1/jobs/route.ts
   ↓
Prisma / Database / Supabase

🚀 Getting Started
git clone https://github.com/Wang-Yizhong/job-tracker-ai.git
cd job-tracker-ai
npm install
cp .env.example .env
npm run dev
