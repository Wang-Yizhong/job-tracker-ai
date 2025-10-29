# Job Tracker with AI

A full-stack web app to track job applications, analyze job descriptions with AI, 
and help job seekers reduce stress with motivational support.

## Features (MVP)
- User accounts
- Job CRUD (create / read / update / delete)
- Company management
- Application stages (Saved → Applied → Interview → Offer → Rejected)
- Simple Kanban view

## Tech Stack
- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- NextAuth.js (auth)
- Deployment: Vercel + Neon/Supabase

## Project Structure(Under Construction)
src/
├── app/
│   ├── (dashboard)/
│   │   ├── jobs/
│   │   │   ├── page.tsx                  ← Page container (UI orchestration)
│   │   │   └── layout.tsx (optional)
│   │   └── ...
│   └── api/
│       └── v1/
│           └── jobs/
│               └── route.ts              ← Backend logic (Next.js API Route)
│
├── components/
│   ├── ui/
│   │   ├── data-table/
│   │   │   ├── DataTable.tsx             ← Shared table component
│   │   │   ├── DataTablePagination.tsx   ← Shared pagination component
│   │   │   └── DataTableToolbar.tsx (optional)
│   │   ├── filters/
│   │   │   ├── SearchInput.tsx
│   │   │   └── StatusSelect.tsx
│   │   ├── layout/
│   │   │   └── Topbar.tsx
│   │   └── modals/
│   │       └── ConfirmModal.tsx
│
├── features/
│   └── jobs/
│       ├── components/
│       │   ├── JobsTable.tsx             ← Feature-specific table
│       │   ├── JobsFilterBar.tsx         ← Feature-specific filters
│       │   └── JobForm.tsx               ← Create / Edit form
│       │
│       ├── jobs.service.ts               ← API layer (CRUD via axios)
│       ├── use-jobs.ts                   ← Hook for state & data fetching
│       └── types.ts                      ← Job types
│
├── hooks/
│   ├── use-data-table.ts                 ← Shared pagination/sort/filter logic
│   ├── use-debounce.ts                   ← Shared debounce utility
│
├── lib/
│   ├── api/
│   │   ├── http.ts                       ← axios instance
│   │   ├── config.ts                     ← Base URL / version
│   │   └── routes.ts                     ← Centralized API endpoints
│   └── utils/
│       └── format-date.ts
│
└── types/
    └── index.ts                          ← Global shared types

    
## Dataflow
JobsPage (page.tsx)
   ↓
useJobsQuery()
   ↓
useDataTable() + jobsService.list()
   ↓
http.get(API.jobs.base)
   ↓
/api/v1/jobs/route.ts
   ↓
Database / Prisma / Supabase



## Roadmap
- AI job description analysis
- Motivational messages
- Search & filtering
- Statistics dashboard

## Getting Started
```bash
git clone https://github.com/<yourname>/job-tracker-ai.git
cd job-tracker-ai
npm install
cp .env.example .env
npm run dev
