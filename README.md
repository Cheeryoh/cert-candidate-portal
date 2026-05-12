# Cert Candidate Portal

> Candidate-facing certification portal for AI-powered, performance-based credentialing programs

A full-stack web application managing the end-to-end learner journey — eligibility verification, exam launch, AI-scored submission, and credential history. Built as part of an independent research initiative to reimagine certification in an AI-first world.

Pairs with [Performance Lab](https://github.com/Cheeryoh/performance-lab) for exam delivery and AI scoring.

---

## What This Solves

Traditional certification portals are passive — a course catalog and a "Schedule Exam" button. This portal is active:

- **Eligibility-gated** — Candidates cannot enroll in exams they are not ready for. Prerequisites are enforced at the database layer, not just the UI.
- **Performance-based** — Exams are not multiple choice. Candidates complete real tasks in live, isolated environments provisioned per-attempt.
- **AI-scored** — Submissions are graded on a 4D rubric (Delegation, Description, Discernment, Diligence) by Claude API, not a Scantron.
- **Audit-ready** — Every attempt, score, and review decision is logged for program governance and reporting.

---

## Candidate Journey

```
Login (magic link) → Dashboard → Exam Catalogue → Launch Exam → Performance Lab → Results → History
```

---

## Key Features

| Feature | Description |
|---------|-------------|
| Magic link auth | Passwordless — candidates authenticate via email link (Supabase Auth) |
| Eligibility enforcement | Prerequisites enforced at DB layer — ineligible inserts blocked by trigger |
| Exam catalogue | Role-based exam listings with live prerequisite status indicators |
| Exam launch | Secure handoff to Performance Lab — provisions isolated exam environment per attempt |
| Attempt history | Full record of past attempts, scores, and 4D rubric breakdowns |
| Security hardened | Rate limiting, CSP headers, deny-by-default routing, RLS on all tables |

---

## Program Architecture

This portal is one half of a two-system certification stack:

```
cert-candidate-portal       <->       performance-lab
(learner identity,                    (exam environment,
 eligibility, history)                 AI scoring, submission)
          |                                    |
               Supabase (shared DB + auth)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (PostgreSQL, Row-Level Security, Auth) |
| Deployment | Vercel |
| Testing | Playwright (E2E — auth, dashboard, catalogue, history, exam flows) |
| Exam Delivery | [Performance Lab](https://github.com/Cheeryoh/performance-lab) via handoff API |
