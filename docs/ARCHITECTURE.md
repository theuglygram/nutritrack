# NutriTrack — Architecture

Status: **Approved 2026-11-10.** Decision references (ADR-0xx) point to [DECISIONS.md](DECISIONS.md).

---

## 1. Overview

```
 ┌──────────────┐     ┌──────────────┐
 │  apps/web    │     │ apps/mobile  │
 │  Next.js     │     │ Expo / RN    │
 └──────┬───────┘     └──────┬───────┘
        │   shared packages (core, schemas, types, api-client)
        ├────────────────────┤
        ▼                    ▼
 ┌───────────────────────────────────────┐
 │ Supabase                              │
 │  Auth · Postgres (RLS) · Storage      │
 │  Edge Functions (privileged / AI)     │──► Anthropic Claude
 └───────────────────────────────────────┘
```

- Clients talk to Supabase directly for user-owned data, protected by RLS.
- Anything privileged (service-role access, AI provider calls, admin bulk operations) runs only on the
  server. Logic used by both apps runs in **Supabase Edge Functions** (Deno); the Next.js server handles
  web rendering and web-only concerns (ADR-017). Shared packages used by Edge Functions must be pure TS
  and Deno-compatible.

## 2. Approved stack

| Area         | Choice                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Web          | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui                                            |
| Mobile       | React Native, Expo, TypeScript, Expo Router                                                          |
| Backend      | Supabase (Postgres, Auth, Storage)                                                                   |
| Validation   | Zod                                                                                                  |
| Charts       | Recharts (web), react-native-gifted-charts (mobile) — ADR-015                                        |
| Packages     | pnpm workspaces + Turborepo — ADR-014                                                                |
| Server logic | Supabase Edge Functions — ADR-017                                                                    |
| AI           | Anthropic Claude (Haiku 5.5 text, Sonnet 5.5 vision/assistant) behind a provider interface — ADR-012 |
| Payments     | Paystack (web), app-store billing via RevenueCat (mobile) — ADR-019                                  |

## 3. Monorepo layout (proposed)

```
nutritrack/
├─ apps/
│  ├─ web/            Next.js app (user web app + /admin route group, ADR-016)
│  └─ mobile/         Expo app (Expo Router)
├─ packages/
│  ├─ core/           Pure TS business logic: nutrition calculation, unit/serving conversion,
│  │                  BMR/TDEE/target calculation, daily totals. No React, no I/O. Fully unit-tested.
│  ├─ schemas/        Zod schemas shared by clients and server (inputs, API payloads, AI outputs)
│  ├─ types/          Shared TS types, including generated Supabase database types (Stage 02)
│  ├─ api-client/     Typed data-access functions over the Supabase client (created in Stage 03)
│  └─ config/         Shared tsconfig, ESLint, Prettier, Tailwind presets
├─ supabase/
│  ├─ migrations/     SQL migrations (schema, RLS, functions)
│  ├─ seed/           Seed data for food catalogue (sourced data only)
│  └─ functions/      Edge Functions (if adopted)
└─ docs/
```

Rules:

- `packages/core` has zero runtime dependencies on React, Next.js, Expo or Supabase.
- UI components call hooks/services; hooks/services call `api-client` and `core`. Components hold no business logic.
- Web UI components (shadcn/ui) and mobile UI components are separate; logic is shared, not views.

## 4. Data flow

### 4.1 Standard user data (logs, weight, water, profile)

Client → `api-client` → Supabase (anon key + user JWT) → Postgres with RLS (`auth.uid() = user_id`).
Writes that need server validation beyond RLS (e.g. computed snapshots) go through a database function or
server endpoint that validates with the shared Zod schema.

### 4.2 Nutrition calculation

All nutrition math lives in `packages/core`:
`grams = quantity × serving_unit.grams` → `nutrient = per_100g × grams / 100`, with defined rounding.
The same function runs on client (for previews) and server (for stored snapshots). The server value is authoritative.

### 4.3 AI-assisted logging (text and photo)

```
input (text or image)
  → server endpoint (auth + rate limit + Zod-validate input)
  → AI provider: returns structured candidates only
       { label, matched_food_query, quantity, unit, confidence }
  → server validates AI output with Zod; matches candidates to database foods
  → client shows editable candidates (food, unit, quantity, remove, add)
  → user confirms
  → server computes nutrition via packages/core and writes meal_log_items
```

The model never returns or invents nutrient values that get stored. See [AI_RULES.md](AI_RULES.md).

### 4.4 AI assistant

Server endpoint builds context from deterministic queries (targets, recent totals, weight trend), sends it
with the user question to the AI provider under the guardrail system prompt, and stores the conversation.

## 5. Authentication and authorisation

- Supabase Auth with email/password; email confirmation and password reset use 6-digit codes typed into the app (ADR-031). Google and Apple (ADR-025) are added once credentials exist.
- **Web:** sessions live in cookies (`@supabase/ssr`). `apps/web/src/proxy.ts` refreshes the session on every request and gates pages using `getClaims()` (verified JWT). Signed-in screens are client components calling `@nutritrack/api-client` (ADR-032).
- **Mobile:** sessions live on the device in AsyncStorage, refreshed only while the app is in the foreground. Expo Router `Stack.Protected` shows signed-in or signed-out screens based on the session.
- Onboarding is saved atomically by the `complete_onboarding` database function; targets are computed by `packages/core` and the database re-checks age and calorie floors.
- `profiles` row created on sign-up via trigger.
- Roles: `user` (default) and `admin`, stored in `user_roles`; admin checks enforced in RLS policies and server endpoints, never only in UI.

## 6. Secrets and environments

| Secret                    | Where it may live                                 |
| ------------------------- | ------------------------------------------------- |
| Supabase URL, anon key    | Client (public)                                   |
| Supabase service-role key | Server only (Edge Functions / Next.js server env) |
| AI provider keys          | Server only                                       |

- Next.js: only `NEXT_PUBLIC_*` variables reach the browser; secrets never use that prefix.
- Expo: only `EXPO_PUBLIC_*` reach the app bundle; no secrets in the mobile app.
- Environments (ADR-022): local (Supabase CLI), staging and production Supabase projects; web on Vercel; mobile builds and OTA updates via EAS. Region chosen after measuring latency from Lagos.

## 6a. Offline sync (mobile)

Food, water and weight log writes are stored in a local queue when offline and replayed on reconnect
(ADR-018). Records use client-generated UUIDs so replays are idempotent (upsert by id). Server-side
nutrition snapshots are computed on sync.

## 7. Storage

- Bucket `meal-photos`: private; object path `{user_id}/{uuid}.jpg`; RLS on `storage.objects` restricts to owner.
- Images resized/compressed on device before upload.
- Meal photos deleted automatically after 30 days by a scheduled job (ADR-021).
- Food catalogue images (if any): separate public bucket, admin-write only.

## 8. Validation

- Every server entry point validates with schemas from `packages/schemas`.
- AI responses are validated with Zod; invalid output is rejected, not coerced.
- Database constraints (CHECKs, NOT NULLs, FKs) back up application validation.

## 9. Testing and quality

- Unit tests for `packages/core` and `packages/schemas` with Vitest (ADR-023).
- RLS policy tests against a local Supabase instance.
- E2E: Playwright (web), Maestro (mobile).
- `tsc --noEmit`, ESLint and Prettier run across the workspace; CI runs all on every PR.

## 10. Observability

Sentry for error tracking and PostHog for product analytics (ADR-027). AI requests are logged (input reference, model, output,
latency, user edits) for quality review, subject to privacy rules in AI_RULES.md.
