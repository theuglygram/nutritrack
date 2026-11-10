# NutriTrack — Project Instructions

NutriTrack is a premium, Nigerian-first nutrition and calorie-tracking platform for **web, Android and iOS**.
Its differentiator is a food database built around Nigerian meals, ingredients, cooking methods and familiar
serving sizes.

Read these before working on any stage:

| Document                                             | Purpose                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| [docs/PRD.md](docs/PRD.md)                           | Product requirements and acceptance criteria             |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | Approved technical architecture                          |
| [docs/DATABASE.md](docs/DATABASE.md)                 | Implemented schema, relationships and RLS                |
| [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) | Stages, milestones and exit criteria                     |
| [docs/AI_RULES.md](docs/AI_RULES.md)                 | AI safety, food recognition and nutrition accuracy rules |
| [docs/DECISIONS.md](docs/DECISIONS.md)               | Architectural decisions (accepted and open)              |

If a task depends on a decision listed under **Still open** in `docs/DECISIONS.md`, stop and ask. Do not pick an answer.

---

## Approved technology stack

| Area            | Choice                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Web             | Next.js, TypeScript, Tailwind CSS, shadcn/ui                           |
| Mobile          | React Native, Expo, TypeScript, Expo Router                            |
| Backend         | Supabase                                                               |
| Database        | PostgreSQL (Supabase)                                                  |
| Auth            | Supabase Auth                                                          |
| Storage         | Supabase Storage                                                       |
| Charts          | Recharts (web); react-native-gifted-charts (mobile)                    |
| Validation      | Zod                                                                    |
| Package manager | pnpm                                                                   |
| Repository      | Monorepo with Turborepo                                                |
| Server logic    | Supabase Edge Functions (shared); Next.js server for web-only concerns |
| AI              | Anthropic Claude behind a provider-agnostic server interface           |
| Testing         | Vitest, Playwright, Maestro                                            |
| Hosting         | Vercel (web), EAS (mobile), Supabase (local / staging / prod)          |
| Monitoring      | Sentry, PostHog                                                        |

Do not add frameworks, state libraries, ORMs or UI kits outside this list without an approved decision.

---

## Core engineering rules

1. Inspect the existing repository before making changes. Never overwrite working functionality without understanding it.
2. TypeScript in strict mode. Avoid `any`; if unavoidable, justify it in a comment.
3. Keep business logic out of UI components. Put it in shared packages (`packages/*`) so web and mobile use the same code.
4. Share types, Zod schemas and nutrition logic between web and mobile. Never duplicate them per app.
5. Never expose the Supabase service-role key or any AI provider key to client code. Secrets live only in server environments (see ARCHITECTURE.md §6).
6. All schema changes go through Supabase migrations in `supabase/migrations`. Never change the database by hand.
7. Every user-owned table has Row Level Security enabled with explicit policies.
8. Validate all inputs on the server with Zod, even when the client already validated them.
9. Never invent nutrition values or present unverified food data as accurate. Unverified data must be labelled.
10. AI food identification and portion estimates are suggestions. The user must be able to edit them and must confirm them before anything is logged.
11. Nutrition calculations are deterministic code in `packages/core`, never produced by an LLM.
12. Every important operation has loading, success, empty and error states.
13. Layouts are responsive and accessible (labels, contrast, focus order, screen-reader text, touch targets).
14. Do not create unnecessary files, duplicate components or redundant dependencies.
15. Do not leave placeholders while claiming a feature is complete.
16. Do not silently remove features or change architecture. Record architecture changes in `docs/DECISIONS.md`.
17. Keep web and mobile behaviour consistent.

---

## Required workflow for every stage

1. Inspect the relevant files before editing.
2. Explain the implementation approach briefly.
3. Identify files to create or modify.
4. Implement the requested scope only.
5. Run relevant tests, type checks and linting.
6. Fix errors introduced by your changes.
7. Summarize what was implemented.
8. Identify outstanding issues and risks.
9. List manual verification steps.
10. **Wait for approval before moving to the next stage.**

If something is ambiguous, ask before making a major architectural decision.

---

## Commands

Requires Node 24+ and pnpm 12 (pinned via `packageManager`). Run from the repo root:

| Command                                                 | What it does                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm install`                                          | Install all workspace dependencies                                                |
| `pnpm check`                                            | Lint + typecheck + test across the workspace (run before declaring any task done) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test`            | Individual Turborepo tasks                                                        |
| `pnpm format` / `pnpm format:check`                     | Prettier write / verify                                                           |
| `pnpm --filter @nutritrack/web dev`                     | Web app at http://localhost:3000                                                  |
| `pnpm --filter @nutritrack/mobile dev`                  | Expo dev server (scan QR with Expo Go)                                            |
| `pnpm --filter @nutritrack/web build`                   | Production web build                                                              |
| `pnpm db:start` / `pnpm db:stop`                        | Start/stop local Supabase (needs Docker Desktop running)                          |
| `pnpm db:reset`                                         | Rebuild the local database from migrations                                        |
| `pnpm db:test`                                          | pgTAP security tests (run after any migration change)                             |
| `pnpm db:types`                                         | Regenerate `packages/types` from the local database (commit the result)           |
| `pnpm env:local`                                        | Write `apps/web/.env.local` and `apps/mobile/.env` from the running local stack   |
| `pnpm --filter @nutritrack/api-client test:integration` | Auth + onboarding against local Supabase (reads codes from Mailpit)               |
| `pnpm --filter @nutritrack/web test:e2e`                | Playwright end-to-end tests (run `pnpm --filter @nutritrack/web build` first)     |

Conventions:

- Shared packages (`@nutritrack/*`) export TypeScript source, no build step. Inside `packages/core` and `packages/schemas`, relative imports use explicit `.ts` extensions so the code also runs in Deno Edge Functions (ADR-017).
- Versions shared across the repo (TypeScript, React, ESLint) live in the `catalog:` in `pnpm-workspace.yaml`; reference them with `"catalog:"`.
- Add mobile dependencies with `pnpm expo install <pkg>` from `apps/mobile` so versions match the Expo SDK.
- `apps/web/AGENTS.md` and `apps/mobile/AGENTS.md` are framework-maintained notes: Next.js 16 and Expo SDK 58 differ from older versions, so check their docs (`node_modules/next/dist/docs/`, docs.expo.dev) before using an API from memory.
