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
