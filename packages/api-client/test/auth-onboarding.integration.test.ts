/**
 * End-to-end against a running local Supabase (`pnpm db:start`), exactly as the apps call it.
 * Reads real confirmation / reset codes from the local Mailpit inbox.
 * Run: pnpm --filter @nutritrack/api-client test:integration (env set by scripts/integration-env).
 */
import { calculateDailyTargets } from "@nutritrack/core";
import type { OnboardingInput } from "@nutritrack/schemas";
import { beforeAll, describe, expect, it } from "vitest";
import {
  ApiError,
  completeOnboarding,
  createNutriTrackClient,
  fromPostgrestError,
  getActiveGoal,
  getMyProfile,
  isOnboarded,
  requestPasswordReset,
  resetPassword,
  resetToCalculatedTargets,
  saveTargetOverride,
  signIn,
  signOut,
  signUp,
  verifySignUpCode,
  type NutriTrackClient,
} from "../src/index.ts";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const mailpit = process.env.MAILPIT_URL;
const configured = Boolean(url && key && mailpit);

const TODAY = "2026-11-10";
const PASSWORD = "jollof2026";
const NEW_PASSWORD = "suya4ever9";

function newClient(): NutriTrackClient {
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required");
  return createNutriTrackClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Polls Mailpit for the newest email to `email` whose subject contains `subject`; returns its 6-digit code. */
async function latestCode(email: string, subject: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const res = await fetch(
      `${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const body = (await res.json()) as { messages: { ID: string; Subject: string }[] };
    const match = body.messages.find((m) => m.Subject.includes(subject));
    if (match) {
      const msg = (await (await fetch(`${mailpit}/api/v1/message/${match.ID}`)).json()) as {
        Text: string;
        HTML: string;
      };
      const code = /\b(\d{6})\b/.exec(msg.Text || msg.HTML)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No "${subject}" email with a code arrived for ${email}`);
}

async function expectApiError(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toSatisfy((e: unknown) => e instanceof ApiError && e.code === code);
}

describe.skipIf(!configured)("auth + onboarding against local Supabase", () => {
  const email = `it-${Date.now()}@example.com`;
  const client = newClient();

  const onboarding: OnboardingInput = {
    displayName: "Ada Integration",
    sex: "female",
    dateOfBirth: "1990-05-01",
    heightCm: 165,
    weightKg: 70,
    activityLevel: "moderate",
    strengthTrains: true,
    goalType: "lose",
    targetWeightKg: 62,
    targetRateKgPerWeek: 0.5,
    consent: true,
  };

  beforeAll(async () => {
    await signUp(client, { email, password: PASSWORD });
  });

  it("blocks sign-in until the email is confirmed", async () => {
    await expectApiError(signIn(newClient(), { email, password: PASSWORD }), "email_not_confirmed");
  });

  it("rejects a wrong code, then confirms with the emailed code", async () => {
    const code = await latestCode(email, "confirmation code");
    const wrong = code === "000000" ? "111111" : "000000";
    await expectApiError(verifySignUpCode(client, { email, code: wrong }), "invalid_code");
    await verifySignUpCode(client, { email, code });
    const profile = await getMyProfile(client);
    expect(isOnboarded(profile)).toBe(false);
  });

  it("completes onboarding atomically with targets from packages/core", async () => {
    const targets = await completeOnboarding(client, onboarding, TODAY);
    expect(targets).toEqual(
      calculateDailyTargets({
        sex: "female",
        ageYears: 36,
        heightCm: 165,
        weightKg: 70,
        activityLevel: "moderate",
        goalType: "lose",
        targetRateKgPerWeek: 0.5,
        strengthTrains: true,
      }),
    );
    const profile = await getMyProfile(client);
    expect(isOnboarded(profile)).toBe(true);
    expect(profile.strength_trains).toBe(true);
    expect(profile.consent_version).not.toBeNull();

    const goal = await getActiveGoal(client, TODAY);
    expect(goal).toMatchObject({
      calorie_target: targets.calorieTarget,
      protein_g: targets.proteinG,
      target_weight_kg: 62,
      is_override: false,
    });
  });

  it("enforces the calorie floor in the database, not just the UI", async () => {
    const { error } = await client.from("user_goals").insert({
      goal_type: "lose",
      calorie_target: 1000,
      protein_g: 80,
      carbs_g: 100,
      fat_g: 30,
      water_ml: 2500,
      is_override: true,
    });
    if (!error) throw new Error("Expected the insert to be rejected");
    expect(fromPostgrestError(error).code).toBe("calorie_floor");
  });

  it("saves an override, then resets to calculated targets", async () => {
    const profile = await getMyProfile(client);
    const goal = await getActiveGoal(client, TODAY);
    if (!goal) throw new Error("Expected an active goal after onboarding");
    await saveTargetOverride(
      client,
      profile,
      goal,
      { calorieTarget: 1900, proteinG: 120, carbsG: 200, fatG: 60, waterMl: 3000 },
      TODAY,
    );
    expect(await getActiveGoal(client, TODAY)).toMatchObject({
      calorie_target: 1900,
      is_override: true,
    });

    const recalculated = await resetToCalculatedTargets(client, profile, goal, TODAY);
    expect(await getActiveGoal(client, TODAY)).toMatchObject({
      calorie_target: recalculated.calorieTarget,
      is_override: false,
    });
  });

  it("keeps each user's data private through the API", async () => {
    const other = newClient();
    const otherEmail = `it-other-${Date.now()}@example.com`;
    await signUp(other, { email: otherEmail, password: PASSWORD });
    await verifySignUpCode(other, {
      email: otherEmail,
      code: await latestCode(otherEmail, "confirmation code"),
    });

    const { data: profiles } = await other.from("profiles").select("id");
    expect(profiles).toHaveLength(1);
    const { data: goals } = await other.from("user_goals").select("id");
    expect(goals).toHaveLength(0);
  });

  it("resets the password with an emailed code", async () => {
    await signOut(client);
    const anon = newClient();
    await requestPasswordReset(anon, { email });
    const code = await latestCode(email, "password reset code");
    await resetPassword(anon, { email, code, password: NEW_PASSWORD });

    await expectApiError(signIn(newClient(), { email, password: PASSWORD }), "invalid_credentials");
    await signIn(newClient(), { email, password: NEW_PASSWORD });
  });

  it("does not reveal whether an email is registered when resetting", async () => {
    await requestPasswordReset(newClient(), { email: `nobody-${Date.now()}@example.com` });
  });
});
