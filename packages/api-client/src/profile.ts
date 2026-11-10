import { ageInYears, calculateDailyTargets, type DailyTargets } from "@nutritrack/core";
import {
  CONSENT_VERSION,
  onboardingSchema,
  profileUpdateSchema,
  targetOverrideSchema,
  type OnboardingInput,
  type ProfileUpdateInput,
  type TargetOverrideInput,
} from "@nutritrack/schemas";
import type { Tables } from "@nutritrack/types";
import type { NutriTrackClient } from "./client.ts";
import { ApiError, fromPostgrestError } from "./errors.ts";

export type Profile = Tables<"profiles">;
export type Goal = Tables<"user_goals">;

async function requireUserId(client: NutriTrackClient): Promise<string> {
  const { data, error } = await client.auth.getClaims();
  const sub = data?.claims.sub;
  if (error || !sub) throw new ApiError("not_signed_in", "Please sign in to continue.");
  return sub;
}

export async function getMyProfile(client: NutriTrackClient): Promise<Profile> {
  const userId = await requireUserId(client);
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export function isOnboarded(profile: Profile): boolean {
  return profile.onboarding_completed_at !== null;
}

/** The goal in effect on `today` (user's local ISO date), or null before onboarding. */
export async function getActiveGoal(client: NutriTrackClient, today: string): Promise<Goal | null> {
  const { data, error } = await client
    .from("user_goals")
    .select("*")
    .lte("effective_from", today)
    .order("effective_from", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

/** Preview the targets onboarding will save, computed by packages/core. */
export function previewTargets(input: OnboardingInput, today: string): DailyTargets {
  return calculateDailyTargets({
    sex: input.sex,
    ageYears: ageInYears(input.dateOfBirth, today),
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    goalType: input.goalType,
    targetRateKgPerWeek: input.targetRateKgPerWeek,
    strengthTrains: input.strengthTrains,
  });
}

/** Saves profile, consent, first weigh-in and first goal in one database transaction. */
export async function completeOnboarding(
  client: NutriTrackClient,
  rawInput: OnboardingInput,
  today: string,
): Promise<DailyTargets> {
  const input = onboardingSchema(today).parse(rawInput);
  const targets = previewTargets(input, today);
  const { error } = await client.rpc("complete_onboarding", {
    p_display_name: input.displayName,
    p_sex: input.sex,
    p_date_of_birth: input.dateOfBirth,
    p_height_cm: input.heightCm,
    p_activity_level: input.activityLevel,
    p_strength_trains: input.strengthTrains,
    p_weight_kg: input.weightKg,
    p_measured_on: today,
    p_goal_type: input.goalType,
    p_target_rate_kg_per_week: input.goalType === "maintain" ? 0 : targets.rateKgPerWeek,
    p_calorie_target: targets.calorieTarget,
    p_protein_g: targets.proteinG,
    p_carbs_g: targets.carbsG,
    p_fat_g: targets.fatG,
    p_water_ml: targets.waterMl,
    p_consent_version: CONSENT_VERSION,
    // Not applicable to "maintain": omitted, so the database stores null.
    ...(input.goalType !== "maintain" && input.targetWeightKg !== undefined
      ? { p_target_weight_kg: input.targetWeightKg }
      : {}),
  });
  if (error) throw fromPostgrestError(error);
  return targets;
}

/** Saves the user's own targets as a new goal row (history is kept; the newest wins). */
export async function saveTargetOverride(
  client: NutriTrackClient,
  profile: Profile,
  current: Goal,
  rawOverride: TargetOverrideInput,
  today: string,
): Promise<void> {
  const override = targetOverrideSchema(profile.sex).parse(rawOverride);
  const { error } = await client.from("user_goals").insert({
    goal_type: current.goal_type,
    target_weight_kg: current.target_weight_kg,
    target_rate_kg_per_week: current.target_rate_kg_per_week,
    calorie_target: override.calorieTarget,
    protein_g: override.proteinG,
    carbs_g: override.carbsG,
    fat_g: override.fatG,
    water_ml: override.waterMl,
    is_override: true,
    effective_from: today,
  });
  if (error) throw fromPostgrestError(error);
}

/** Replaces an override with freshly calculated targets from the current profile and weight. */
export async function resetToCalculatedTargets(
  client: NutriTrackClient,
  profile: Profile,
  current: Goal,
  today: string,
): Promise<DailyTargets> {
  if (!profile.sex || !profile.date_of_birth || !profile.height_cm || !profile.activity_level) {
    throw new ApiError("validation", "Finish setting up your profile first.");
  }
  const { data: latest, error: weightError } = await client
    .from("weight_entries")
    .select("weight_kg")
    .order("measured_on", { ascending: false })
    .limit(1)
    .single();
  if (weightError) throw fromPostgrestError(weightError);

  const targets = calculateDailyTargets({
    sex: profile.sex,
    ageYears: ageInYears(profile.date_of_birth, today),
    heightCm: profile.height_cm,
    weightKg: latest.weight_kg,
    activityLevel: profile.activity_level,
    goalType: current.goal_type,
    targetRateKgPerWeek: current.target_rate_kg_per_week ?? undefined,
    strengthTrains: profile.strength_trains ?? false,
  });
  const { error } = await client.from("user_goals").insert({
    goal_type: current.goal_type,
    target_weight_kg: current.target_weight_kg,
    target_rate_kg_per_week: targets.rateKgPerWeek,
    calorie_target: targets.calorieTarget,
    protein_g: targets.proteinG,
    carbs_g: targets.carbsG,
    fat_g: targets.fatG,
    water_ml: targets.waterMl,
    is_override: false,
    effective_from: today,
  });
  if (error) throw fromPostgrestError(error);
  return targets;
}

/**
 * Saves profile changes. Unless the user has overridden their targets, targets are recalculated
 * from the updated profile so they never go stale. Returns the updated profile.
 */
export async function updateProfile(
  client: NutriTrackClient,
  rawInput: ProfileUpdateInput,
  current: Goal | null,
  today: string,
): Promise<Profile> {
  const input = profileUpdateSchema.parse(rawInput);
  const userId = await requireUserId(client);
  const { data: profile, error } = await client
    .from("profiles")
    .update({
      display_name: input.displayName,
      height_cm: input.heightCm,
      activity_level: input.activityLevel,
      strength_trains: input.strengthTrains,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  if (current && !current.is_override) {
    await resetToCalculatedTargets(client, profile, current, today);
  }
  return profile;
}

/** Everything the signed-in area needs on load: profile and the goal in effect today. */
export async function loadAccount(
  client: NutriTrackClient,
  today: string,
): Promise<{ profile: Profile; goal: Goal | null }> {
  const [profile, goal] = await Promise.all([getMyProfile(client), getActiveGoal(client, today)]);
  return { profile, goal };
}
