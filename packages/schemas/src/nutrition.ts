import { NUTRIENT_KEYS, type NutrientKey, type NutrientProfile } from "@nutritrack/core";
import { z } from "zod";

/** A nutrient amount per 100 g: non-negative and finite, or null when unknown (never defaulted to 0). */
const nutrientValue = z.number().finite().nonnegative().nullable();

const nutrientShape = Object.fromEntries(
  NUTRIENT_KEYS.map((key) => [key, nutrientValue]),
) as Record<NutrientKey, typeof nutrientValue>;

export const nutrientProfileSchema = z.object(nutrientShape).strict();

export const servingInputSchema = z
  .object({
    quantity: z.number().finite().positive(),
    gramsPerUnit: z.number().finite().positive(),
  })
  .strict();

export type ServingInput = z.infer<typeof servingInputSchema>;

// Compile-time guarantee that the schema and the core type stay in sync.
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const schemaMatchesCore: Equals<z.infer<typeof nutrientProfileSchema>, NutrientProfile> = true;
void schemaMatchesCore;
