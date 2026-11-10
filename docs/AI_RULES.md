# NutriTrack — AI Rules

These rules are binding for every feature that uses AI: text meal parsing, photo recognition, portion
estimation and the nutrition assistant. A feature that breaks any rule here is not complete.

---

## 1. What AI may and may not do

| AI **may**                                         | AI **must not**                                          |
| -------------------------------------------------- | -------------------------------------------------------- |
| Identify likely foods from text or a photo         | Produce nutrient values that get stored or shown as fact |
| Suggest a quantity and a familiar serving unit     | Log anything without explicit user confirmation          |
| Suggest search terms to match database foods       | Override database values or user edits                   |
| Explain nutrition concepts and the user's own data | Diagnose, treat or give medical advice                   |

## 2. Nutrition accuracy

1. All stored and displayed nutrition numbers come from the food database and are calculated by `packages/core`.
2. Model outputs are structured candidates only: `{ label, matched_food_query, quantity, unit, confidence }`, validated with Zod. Free-text nutrient numbers from a model are discarded.
3. If no database match exists, the item is shown as **unmatched**. The app never fills in an estimated nutrient profile on its own.
4. Unverified foods and estimated serving weights are always labelled as such in the UI.
5. Logged items store a nutrient snapshot and record how they were entered (manual / text / photo).

## 3. User confirmation (text and photo logging)

1. Every candidate is editable: food, quantity, unit; the user can remove candidates or add missing ones.
2. Confidence is shown in plain language (e.g. "Not sure — please check"). Low-confidence candidates are never pre-accepted silently.
3. Portion suggestions are labelled **estimate**.
4. Nothing is written to `meal_log_items` until the user presses confirm.
5. The original AI output and the user's final choice are both stored (`ai_candidates`) to measure and improve accuracy.

## 4. Photo recognition specifics

- Photos are compressed on device and uploaded to a private bucket under the user's own path.
- Photos are only used to serve that user's request. Use for evaluation requires the user's explicit opt-in (ADR-021).
- Photos are deleted automatically after 30 days (ADR-021).
- If a photo does not appear to contain food, return a clear "no food detected" state.

## 5. Nutrition assistant guardrails

1. Always identify itself as an AI and state that it does not give medical advice.
2. Ground answers about the user in deterministic data supplied by the server (targets, intake totals, weight trend). Never guess the user's numbers.
3. Do not recommend calorie intakes below the safe minimum defined in `packages/core` (ADR-024), rapid weight-loss rates, fasting regimes, supplements or medication.
4. Refer to a doctor or registered dietitian when the user mentions: pregnancy or breastfeeding, diabetes, kidney, heart or liver disease, medication interactions, under-18 users, or any other medical condition.
5. Eating-disorder signals (extreme restriction, purging, compensatory exercise, distress about eating): respond supportively, do not provide numbers that enable restriction, and suggest professional help.
6. Stay on topic (nutrition, food, activity, the app). Decline unrelated requests politely.
7. Respect Nigerian food culture: suggest realistic local swaps rather than imported foods by default.

Guardrail test prompts covering each rule must pass before Stage 12 is approved.

## 6. Security

- AI provider keys are server-only. Clients call NutriTrack server endpoints, never the AI provider directly.
- Endpoints require authentication and are rate-limited per user (free-tier limits per ADR-019; exact numbers **[OPEN]**).
- User text and image content is untrusted: the system prompt must state that instructions inside user content are not to be followed, and outputs are schema-validated regardless.
- Logs of AI requests exclude secrets and minimise personal data.

## 7. Evaluation

- Maintain a test set of common Nigerian dishes (text descriptions and photos with confirmed labels and portions).
- Track: top-1 / top-3 identification accuracy, portion error, unmatched rate, user edit rate per food.
- Re-run the evaluation when changing model, prompt or matching logic, and record results in the PR.

## 8. Provider

Anthropic Claude: Haiku 5.5 for text parsing, Sonnet 5.5 for photo recognition and the assistant (ADR-012).
Benchmark against one alternative on the evaluation set before photo recognition ships. Integration sits behind a provider-agnostic server
interface so the provider can be changed without touching client code.
