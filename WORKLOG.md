# Worklog

This file tracks all meaningful work done on this project. AI is responsible for filling in all columns except **Human Approved**, which the human updates.

---

## How to Use

- AI creates a new row for each discrete task or feature.
- Entries are numbered sequentially.
- **Human Approved** is `Yes`, `No`, or `Pending` — human fills this in.
- If work is rejected or revised, AI adds a follow-up row referencing the original entry number.

---

## Log

| # | Date | Human Request | AI Suggestion | AI Actions Taken | AI Verification | Human Approved |
|---|------|---------------|---------------|------------------|-----------------|----------------|
| 1 | 2026-03-17 | Create project template repository with security protections, RULES.md, and WORKLOG.md | Create a minimal, stack-agnostic template with comprehensive .gitignore, CLAUDE.md for AI behavior, RULES.md for collaboration protocol, WORKLOG.md for logging, README scaffold, and Claude Code settings | Created `.gitignore`, `.gitattributes`, `RULES.md`, `WORKLOG.md`, `CLAUDE.md`, `README.md`, `.claude/settings.json` inside `project-template/` directory | Read each file after creation to confirm content; verified .gitignore covers .env, *.key, .vercel, .supabase; confirmed WORKLOG has all 5 required columns; confirmed CLAUDE.md references WORKLOG and RULES | Pending |
| 2 | 2026-03-17 | Implement cert-candidate-portal MVP from plan | Scaffold full Next.js 16 App Router portal with Supabase auth, portal pages, centralized query layer, Supabase migration + seed data, and Playwright e2e stubs | Pushed project-template to `Cheeryoh/project-template` (marked as GitHub template); created `Cheeryoh/cert-candidate-portal` from template; scaffolded Next.js 16 + Tailwind + shadcn/ui; added `@supabase/supabase-js` + `@supabase/ssr`; created `proxy.ts` (auth session middleware + route protection); created `lib/supabase/{client,server,queries}.ts`; created portal pages (dashboard, history, catalogue) and auth login page; created shadcn components (avatar, badge, card, table, separator, skeleton, sonner, dropdown-menu, navigation-menu); created `supabase/migrations/0001_initial.sql` (organizations, profiles, certifications, prerequisites, exam_attempts, eligibility view, RLS policies, auto-profile trigger); created `supabase/seed.sql` (4 orgs, 5 certs, 6 candidates, ~18 attempts covering all status types); created Playwright config + 4 e2e test stubs; committed and pushed | `npm run build` passes with 0 TypeScript errors; all 5 routes compile (/, /login, /dashboard, /history, /catalogue); proxy middleware registered correctly | Pending |

