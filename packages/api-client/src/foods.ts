import type { NutrientProfile } from "@nutritrack/core";
import { customFoodSchema, foodSearchQuerySchema, type CustomFoodInput } from "@nutritrack/schemas";
import type { Database } from "@nutritrack/types";
import type { NutriTrackClient } from "./client.ts";
import { ApiError, fromPostgrestError } from "./errors.ts";

type VerificationStatus = Database["public"]["Enums"]["verification_status"];
type FoodLanguage = "en" | "yo" | "ig" | "ha" | "pcm";

export type FoodSearchResult = {
  id: string;
  name: string;
  category: string | null;
  verificationStatus: VerificationStatus;
  isCustom: boolean;
  sourceName: string | null;
  /** Per 100 g; null = unknown. */
  energyKcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  /** Set when a local or alternative name matched better than the food's own name. */
  matchedAlias: { alias: string; language: FoodLanguage } | null;
};

export type FoodServing = { unitName: string; grams: number; isEstimate: boolean };

export type FoodDetail = {
  id: string;
  name: string;
  category: string | null;
  cookingMethod: string | null;
  verificationStatus: VerificationStatus;
  isCustom: boolean;
  isComposite: boolean;
  notes: string | null;
  source: {
    name: string;
    citation: string | null;
    url: string | null;
    licence: string | null;
  } | null;
  /** Per 100 g; null = unknown (never shown as zero). */
  per100g: NutrientProfile;
  servings: FoodServing[];
  aliases: { alias: string; language: FoodLanguage }[];
};

/** Fuzzy search by name or local name. Returns [] for queries shorter than 2 characters. */
export async function searchFoods(
  client: NutriTrackClient,
  rawQuery: string,
  limit = 20,
): Promise<FoodSearchResult[]> {
  const parsed = foodSearchQuerySchema.safeParse(rawQuery);
  if (!parsed.success) return [];
  const { data, error } = await client.rpc("search_foods", {
    p_query: parsed.data,
    p_limit: limit,
  });
  if (error) throw fromPostgrestError(error);
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    verificationStatus: r.verification_status,
    isCustom: r.is_custom,
    sourceName: r.source_name,
    energyKcal: r.energy_kcal,
    proteinG: r.protein_g,
    carbsG: r.carbs_g,
    fatG: r.fat_g,
    matchedAlias:
      r.matched_alias && r.matched_language
        ? { alias: r.matched_alias, language: r.matched_language as FoodLanguage }
        : null,
  }));
}

/** Everything the food detail screen shows. Null when the food doesn't exist or isn't visible. */
export async function getFood(client: NutriTrackClient, id: string): Promise<FoodDetail | null> {
  const { data, error } = await client
    .from("foods")
    .select(
      `id, name, category, verification_status, owner_user_id, is_composite, notes,
       cooking_methods(name),
       data_sources(name, citation, url, licence),
       food_nutrients(energy_kcal, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg),
       food_servings(grams, is_estimate, serving_units(name)),
       food_aliases(alias, language)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (!data) return null;
  const n = data.food_nutrients;
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    cookingMethod: data.cooking_methods?.name ?? null,
    verificationStatus: data.verification_status,
    isCustom: data.owner_user_id !== null,
    isComposite: data.is_composite,
    notes: data.notes,
    source: data.data_sources,
    per100g: {
      energyKcal: n?.energy_kcal ?? null,
      proteinG: n?.protein_g ?? null,
      carbsG: n?.carbs_g ?? null,
      fatG: n?.fat_g ?? null,
      fibreG: n?.fibre_g ?? null,
      sugarG: n?.sugar_g ?? null,
      sodiumMg: n?.sodium_mg ?? null,
    },
    servings: data.food_servings
      .map((s) => ({ unitName: s.serving_units.name, grams: s.grams, isEstimate: s.is_estimate }))
      .sort((a, b) => a.grams - b.grams),
    aliases: data.food_aliases.map((a) => ({
      alias: a.alias,
      language: a.language as FoodLanguage,
    })),
  };
}

/** Creates a private food for the signed-in user (always unverified). Returns its id. */
export async function createCustomFood(
  client: NutriTrackClient,
  rawInput: CustomFoodInput,
): Promise<string> {
  const input = customFoodSchema.parse(rawInput);
  const { data, error } = await client.rpc("create_custom_food", {
    p_name: input.name,
    p_category: input.category ?? "",
    p_energy_kcal: input.energyKcal,
    p_protein_g: input.proteinG,
    p_carbs_g: input.carbsG,
    p_fat_g: input.fatG,
    ...(input.fibreG !== undefined ? { p_fibre_g: input.fibreG } : {}),
    ...(input.sugarG !== undefined ? { p_sugar_g: input.sugarG } : {}),
    ...(input.sodiumMg !== undefined ? { p_sodium_mg: input.sodiumMg } : {}),
    ...(input.serving
      ? { p_serving_unit: input.serving.unit, p_serving_grams: input.serving.grams }
      : {}),
  });
  if (error) throw fromPostgrestError(error);
  return data;
}

export type MyFood = { id: string; name: string; energyKcal: number | null; createdAt: string };

/** The signed-in user's own foods, newest first. */
export async function listMyFoods(client: NutriTrackClient): Promise<MyFood[]> {
  const { data: claims } = await client.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) throw new ApiError("not_signed_in", "Please sign in to continue.");
  const { data, error } = await client
    .from("foods")
    .select("id, name, created_at, food_nutrients(energy_kcal)")
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  return data.map((f) => ({
    id: f.id,
    name: f.name,
    energyKcal: f.food_nutrients?.energy_kcal ?? null,
    createdAt: f.created_at,
  }));
}

/** Deletes one of the user's own foods. Fails if the food has been logged (kept for history). */
export async function deleteCustomFood(client: NutriTrackClient, id: string): Promise<void> {
  const { error } = await client.from("foods").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new ApiError(
        "validation",
        "This food is in your food log, so it can't be deleted.",
        error,
      );
    }
    throw fromPostgrestError(error);
  }
}
