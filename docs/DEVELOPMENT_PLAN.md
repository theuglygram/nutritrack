# NutriTrack — Development Plan

Each stage follows the workflow in [CLAUDE.md](../CLAUDE.md) and ends at an **approval gate**: no stage starts
until the previous one is approved. Scope split follows ADR-026 in [DECISIONS.md](DECISIONS.md).

## Release 1 — core tracking

| #   | Stage                                                      | Key decisions          |
| --- | ---------------------------------------------------------- | ---------------------- |
| 00  | Project context and documentation                          | —                      |
| 01  | Monorepo scaffold and tooling                              | ADR-014, 022, 023, 027 |
| 02  | Supabase schema, RLS and migrations                        | ADR-018, 019, 021      |
| 03  | Authentication and onboarding                              | ADR-020, 024, 025      |
| 04  | Food database and seed pipeline                            | ADR-013                |
| 05  | Manual and text-based logging                              | ADR-012, 017           |
| 06  | Daily dashboard: calories and macros                       | ADR-015                |
| 07  | Weight and water tracking                                  | —                      |
| 08  | Admin dashboard (food management)                          | ADR-016                |
| 09  | Hardening: accessibility, performance, offline sync, tests | ADR-018                |
| 10  | Release 1                                                  | ADR-021, 022           |

## Release 2 — AI features

| #   | Stage                                             | Key decisions     |
| --- | ------------------------------------------------- | ----------------- |
| 11  | AI photo recognition and portion estimation       | ADR-012, 019, 021 |
| 12  | AI nutrition assistant                            | ADR-012, 019      |
| 13  | Admin review queues for AI corrections; Release 2 | ADR-016           |

---

### Stage 00 — Project context ✅

- **Deliverables:** CLAUDE.md and docs/*.
- **Exit:** documents and decisions approved (2026-11-10).

### Stage 01 — Monorepo scaffold ✅

- **Scope:** git init, pnpm workspace + Turborepo, `apps/web` (Next.js + Tailwind + shadcn/ui), `apps/mobile` (Expo + Expo Router), `packages/core|schemas|config`, strict tsconfig, ESLint, Prettier, Vitest, CI. `packages/types` and `packages/api-client` move to Stage 02 (nothing to put in them before the database exists). Sentry/PostHog wiring deferred to Stage 09.
- **Exit:** `pnpm install`, typecheck, lint and test pass; both apps start and render a basic home screen; one shared `core` function imported by both apps.

### Stage 02 — Database ✅

- **Scope:** Supabase local setup, migrations for the tables in DATABASE.md, RLS policies, `is_admin()`, triggers (profile creation, audit log), entitlement tables, generated types (`packages/types`), pgTAP RLS tests and CI job. Staging/prod projects are created later, after the region latency check (before Release 1).
- **Exit:** migrations apply cleanly from zero; RLS tests prove users cannot read or write other users' data.

### Stage 03 — Auth and onboarding

- **Scope:** email/password, Google and Apple sign-in, password reset, onboarding, target calculation (ADR-024) in `packages/core`, profile editing, target override, consent capture, `packages/api-client` (typed Supabase clients for web and mobile, ADR-030), web dark mode.
- **Exit:** unit tests for target calculation including floors and rate limits; flows work on web and mobile with all four UI states.

### Stage 04 — Food database

- **Scope:** import pipeline from approved sources, aliases (en/yo/ig/ha/pcm), serving units with measured gram weights, cooking methods, fuzzy search, custom foods.
- **Exit:** every seeded food has a source; search returns expected results for a test list of Nigerian dishes.

### Stage 05 — Logging

- **Scope:** manual logging, edit/delete, copy meal, recents/favourites; text logging via Edge Function (Claude Haiku), candidate review and confirm.
- **Exit:** totals match `packages/core` calculations; nothing logged from text without confirmation.

### Stage 06 — Dashboard

- **Scope:** daily summary, per-meal breakdown, weekly/monthly charts (Recharts web, gifted-charts mobile).
- **Exit:** charts render on web and mobile; empty states for days with no data.

### Stage 07 — Weight and water

- **Scope:** weight entries and trend chart; water quick-add with local units and daily target.
- **Exit:** CRUD and charts working on both platforms.

### Stage 08 — Admin dashboard

- **Scope:** `/admin` in `apps/web`: food CRUD, sources, verification workflow, user food submissions, usage metrics, audit log viewer.
- **Exit:** non-admins blocked at database and server level, not just UI.

### Stage 09 — Hardening

- **Scope:** mobile offline queue-and-sync, accessibility audit, low-end device and slow-network testing, Playwright and Maestro E2E, Sentry and PostHog, data export/deletion, security review.
- **Exit:** agreed accessibility and performance checks pass.

### Stage 10 — Release 1

- **Scope:** production environment, Vercel deploy, EAS builds, store listings, privacy policy (after legal review).
- **Exit:** production smoke test passes on web, Android and iOS.

### Stage 11 — Photo recognition and portions

- **Scope:** capture/upload, compression, private storage with 30-day deletion, recognition Edge Function (Claude Sonnet), candidate matching, portion suggestion, review/confirm, correction capture, free-tier limits, provider benchmark.
- **Exit:** evaluation on the Nigerian dish test set recorded (AI_RULES.md §7); confirmation always required.

### Stage 12 — AI assistant

- **Scope:** chat UI, Edge Function with grounded context, guardrails, rate limits, conversation history.
- **Exit:** guardrail test prompts pass (AI_RULES.md §5).

### Stage 13 — AI review queues and Release 2

- **Scope:** admin review of AI mis-identifications and user corrections; Release 2 deploy.
- **Exit:** production smoke test of AI features on all platforms.
