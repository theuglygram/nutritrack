/**
 * End-to-end against a running local Supabase (`pnpm db:start`), exactly as the apps call it.
 * Reads real confirmation / reset codes from the local Mailpit inbox.
 * Run: pnpm --filter @nutritrack/api-client test:integration (env set by scripts/integration-env).
 */
import { calculateDailyTargets } from "@nutritrack/core";
import type { OnboardingInput } from "@nutritrack/schemas";
import { beforeAll, describe, expect, it } from "vitest";
import { configured, latestCode, newClient } from "./helpers.ts";
import {
  ApiError,
  completeOnboarding,
  fromPostgrestError,
  getActiveGoal,
  getMyProfile,
  isOnboarded,
  requestPasswordReset,
  resendSignUpCode,
  resetPassword,
  resetToCalculatedTargets,
  saveTargetOverride,
  signIn,
  signOut,
  signUp,
  verifySignUpCode,
} from "../src/index.ts";

const TODAY = "2026-11-10";
const PASSWORD = "jollof2026";
const NEW_PASSWORD = "suya4ever9";

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
    const code = await latestCode(email, "confirmation code", () =>
      resendSignUpCode(client, email),
    );
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
