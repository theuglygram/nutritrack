import { z } from "zod";

/** Search box input: 2–60 characters after trimming. */
export const foodSearchQuerySchema = z
  .string()
  .trim()
  .min(2, { error: "Type at least 2 letters" })
  .max(60, { error: "Use 60 characters or fewer" });

/** Units a user can give their own food's serving in (grams per unit are entered by them). */
export const CUSTOM_FOOD_SERVING_UNITS = [
  "serving",
  "piece",
  "plate",
  "wrap",
  "cup",
  "slice",
  "ladle",
  "cooking spoon",
  "derica",
  "mudu",
] as const;

const grams = (label: string) =>
  z
    .number({ error: `Enter ${label} in grams` })
    .min(0, { error: `${label} can't be negative` })
    .max(100, { error: `${label} can't be more than 100 g per 100 g` });

const optionalGrams = (label: string) => grams(label).optional();

/**
 * A user's own food, per 100 g. Bounds match the food_nutrients check constraints; macros can't
 * add up to more than the 100 g they're part of.
 */
export const customFoodSchema = z
  .object({
    name: z.string().trim().min(1, { error: "Enter a name" }).max(120),
    category: z.string().trim().max(60).optional(),
    energyKcal: z
      .number({ error: "Enter calories per 100 g" })
      .min(0, { error: "Calories can't be negative" })
      .max(900, { error: "No food has more than 900 kcal per 100 g" }),
    proteinG: grams("Protein"),
    carbsG: grams("Carbs"),
    fatG: grams("Fat"),
    fibreG: optionalGrams("Fibre"),
    sugarG: optionalGrams("Sugar"),
    sodiumMg: z
      .number()
      .min(0, { error: "Sodium can't be negative" })
      .max(40000, { error: "Sodium looks too high" })
      .optional(),
    serving: z
      .object({
        unit: z.enum(CUSTOM_FOOD_SERVING_UNITS),
        grams: z
          .number({ error: "Enter the serving weight in grams" })
          .gt(0, { error: "Enter a weight above 0 g" })
          .max(5000, { error: "Enter at most 5,000 g" }),
      })
      .optional(),
  })
  .refine((f) => f.proteinG + f.carbsG + f.fatG <= 100, {
    error: "Protein, carbs and fat can't add up to more than 100 g per 100 g",
    path: ["fatG"],
  });

export type CustomFoodInput = z.infer<typeof customFoodSchema>;
