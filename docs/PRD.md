# NutriTrack — Product Requirements Document

Status: **v1.0** — approved 2026-11-10. Decisions are referenced by ADR number in [DECISIONS.md](DECISIONS.md). Items marked **[OPEN]** are still unresolved.

---

## 1. Problem

Most calorie-tracking apps are built around Western foods and serving sizes. Nigerians who want to manage
their weight or build muscle cannot easily log meals such as jollof rice, eba with egusi, amala with ewedu,
moi moi, suya or puff-puff, and cannot express portions the way they actually eat them (a wrap of eba,
a derica of rice, a piece of meat). The result is inaccurate logs or giving up on tracking.

## 2. Vision

Help Nigerians understand their food intake, calories, macros and weight progress, using foods, cooking
methods and serving sizes they recognise.

## 3. Differentiator

A food database designed around:

- **Nigerian meals** — composite dishes (soups, stews, swallows, rice dishes, street food, snacks).
- **Ingredients** — local staples (cassava, yam, plantain, beans, palm oil, crayfish, ogiri, etc.).
- **Cooking methods** — e.g. boiled, fried, roasted, stewed; method changes oil content and calories.
- **Familiar serving sizes** — e.g. wrap, derica, mudu, cooking spoon, piece, plate, sachet, bottle.

Each serving unit must map to a gram weight with a documented source. Where a gram weight is not yet
measured or sourced, the unit must be shown as an estimate and not presented as accurate.

## 4. Target users (personas)

| Persona                    | Goal                              | Key needs                                                           |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| **Weight loser**           | Lose body fat                     | Calorie target with a deficit, simple daily logging, weight trend   |
| **Gym enthusiast**         | Build muscle / body recomposition | Protein and macro targets, accurate portions, progress charts       |
| **Weight gainer**          | Gain weight healthily             | Calorie surplus target, energy-dense food suggestions, weight trend |
| **Everyday healthy eater** | Eat better, understand food       | Low-effort logging, clear nutrition insights, water tracking        |

## 5. Platforms

Web (responsive), Android and iOS. Feature parity is the default; any platform-specific gap must be documented.

---

## 6. Functional requirements

Release scope (ADR-026): **Release 1** = 6.1–6.4, 6.7–6.9 and admin food management (6.11).
**Release 2** = 6.5 photo recognition, 6.6 portion estimation, 6.10 assistant, and admin AI review queues.

### 6.1 Account and onboarding (Release 1)

- Sign up, sign in, sign out, password reset via Supabase Auth with email and password. Email is confirmed with a 6-digit code typed into the app; password reset uses a code too (ADR-031). Google and Apple sign-in (ADR-025) follow once credentials exist.
- Explicit consent to processing of health data at sign-up (ADR-021).
- Onboarding collects: name, sex, date of birth (18+ only), height, current weight, activity level, whether the user strength-trains, goal (lose / maintain / gain), target weight and weekly rate.
- The app computes daily calorie and macro targets deterministically: Mifflin–St Jeor BMR × activity factor (ADR-024). Macros: protein 1.6 g/kg for strength trainers, otherwise 1.2 g/kg (max 35% of calories); fat 25% of calories; carbs the rest (ADR-031). Any safety adjustment is explained to the user.
- Users can view and override their targets.
- Safety: the app never recommends below 1,200 kcal (female) / 1,500 kcal (male), loss faster than ~1% body weight per week, or gain outside 0.25–0.5 kg/week (ADR-024, pending dietitian sign-off), and shows a "not medical advice" notice.

**Acceptance:** a new user can finish onboarding and see daily targets; editing profile data recalculates targets; overrides persist.

### 6.2 Food database and search (Release 1)

- Search foods by name, including local and alternative names (e.g. Yoruba, Igbo, Hausa, Pidgin names) and common misspellings.
- Each food shows: name, aliases, nutrition per 100 g, available serving units with gram weights, cooking method (if relevant), data source, verification status.
- Foods have a **verification status**: verified (sourced and reviewed), unverified (submitted or estimated). Unverified foods are visibly labelled.
- Users can create **custom foods** (private to them) with their own values; these are always labelled user-entered.

**Acceptance:** searching "eba", "garri" or "jollof" returns the relevant items; every result shows source and status; no nutrition value appears without a source.

### 6.3 Manual food logging (Release 1)

- Log a food to a meal slot (breakfast, lunch, dinner, snack) for a given date.
- Choose a serving unit and quantity (e.g. 1.5 wraps); grams are computed deterministically.
- Edit and delete logged items. Copy a previous meal or day. Recent and favourite foods.
- Nutrition values are **snapshotted** at log time so later database corrections do not silently rewrite history.

**Acceptance:** logging, editing and deleting update daily totals immediately; totals match the deterministic calculation.

### 6.4 Text-based meal logging (Release 1)

- User types a description, e.g. "2 wraps of eba with egusi soup and 1 piece of beef".
- The system parses it into candidate items (food, quantity, unit) and matches each to database foods.
- Parsing may use an LLM, but **nutrition values come only from the database** (see [AI_RULES.md](AI_RULES.md)).
- The user reviews every candidate, can change food, quantity, unit or remove it, then confirms. Nothing is logged without confirmation.
- Unmatched items are shown as unmatched, with options to search manually or create a custom food.

**Acceptance:** the example sentence produces editable candidates; confirming logs exactly what the user approved.

### 6.5 AI food photo recognition (Release 2)

- User takes or uploads a photo of a meal.
- The system returns candidate foods with confidence levels, matched to database foods.
- Low-confidence results are clearly flagged. The user edits and confirms before logging.
- Photos are stored privately and deleted automatically after 30 days (ADR-021).

**Acceptance:** a photo produces editable candidates or a clear "couldn't identify" state; nothing is logged without confirmation.

### 6.6 Portion estimation (Release 2)

- For photo and text logging, the system suggests a portion in a familiar unit (e.g. "about 2 wraps").
- Estimates are labelled as estimates, editable, and must be confirmed.
- Optional reference aids (e.g. plate size, hand comparison) **[OPEN]**.

**Acceptance:** each suggested portion can be changed before confirming; the label "estimate" is shown.

### 6.7 Calorie and macro tracking (Release 1)

- Daily view: calories consumed vs target, remaining, and protein / carbohydrate / fat vs targets.
- Per-meal breakdown.
- Weekly and monthly history charts.
- Micronutrients (fibre, sodium, sugar, etc.) shown only where the data source provides them **[OPEN: which nutrients in v1]**.

**Acceptance:** totals equal the sum of snapshotted logged items; empty days show an empty state, not zeros presented as data.

### 6.8 Weight tracking (Release 1)

- Log weight with date; edit and delete entries.
- Chart with trend line over selectable ranges; progress toward target weight.
- Updating current weight offers to recalculate targets.

### 6.9 Water tracking (Release 1)

- Quick-add water in familiar units (glass, sachet "pure water", bottle) with defined millilitre values.
- Daily water target (default 2.5 L, ADR-024), progress indicator, history.

### 6.10 AI nutrition assistant (Release 2)

- Chat assistant that answers nutrition questions and gives guidance grounded in the user's own logged data and targets.
- Must follow guardrails in [AI_RULES.md](AI_RULES.md): not medical advice, no extreme diets, referral language for medical conditions and eating-disorder signals.
- Any numbers it quotes about the user's intake come from deterministic queries, not model guesses.
- Rate-limited on the free tier (ADR-019); exact limits **[OPEN]**.

### 6.11 Administrator dashboard (Release 1: food management; Release 2: AI review queues)

- Role-restricted (admin only).
- Manage foods, aliases, nutrients, serving units, cooking methods and recipes; record sources; change verification status.
- Review queue: user-submitted foods, AI mis-identifications and user corrections.
- Basic usage metrics (sign-ups, active users, logs per day).
- Audit log of admin changes.
- Lives at `/admin` inside the web app (ADR-016).

---

## 7. Non-functional requirements

- **Performance:** usable on low-end Android devices and slow or intermittent mobile data; small payloads; images compressed before upload.
- **Offline:** mobile food, water and weight logs are queued offline and synced later (ADR-018).
- **Accessibility:** WCAG 2.1 AA target on web; platform accessibility APIs on mobile.
- **Privacy and security:** RLS on all user data; secrets server-side only; health data treated as sensitive personal data under the Nigeria Data Protection Act 2023; account deletion and data export (ADR-021, pending legal review).
- **Localisation:** English UI; food search in English, Yoruba, Igbo, Hausa and Pidgin; metric units only (ADR-020).
- **Reliability:** every important operation has loading, success, empty and error states.
- **Accuracy:** every nutrition value traceable to a source; estimates always labelled.

## 8. Out of scope for first release

To be confirmed **[OPEN]**. Candidates: wearable and health-platform integrations, meal plans, recipe builder for users, social features, barcode scanning, coaching marketplace.

## 9. Success metrics (proposed, need approval)

- Day-7 and day-30 retention.
- Median logs per active user per day.
- Share of searches returning a verified result.
- AI candidate acceptance rate without edits, and correction rate per food.
- Share of logs created by text/photo vs manual.

## 10. Monetisation

Freemium (ADR-019): all tracking free; AI features rate-limited on the free tier. Paystack on web, app-store
billing in the apps, unified via RevenueCat. Pricing and exact limits **[OPEN]**.
