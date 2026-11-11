import { MAX_WATER_ENTRY_ML } from "@nutritrack/core";
import { z } from "zod";

/** Matches the water_entries check constraints (1–5000 ml, label ≤ 30 characters). */
export const waterEntrySchema = z.object({
  amountMl: z
    .int({ error: "Enter a whole number of millilitres" })
    .min(1, { error: "Enter an amount above 0 ml" })
    .max(MAX_WATER_ENTRY_ML, { error: `Add at most ${MAX_WATER_ENTRY_ML} ml at a time` }),
  unitLabel: z.string().trim().max(30).optional(),
});

export type WaterEntryInput = z.infer<typeof waterEntrySchema>;

/** Matches the weight_entries check constraint (20–400 kg). One weigh-in per day. */
export function weightEntrySchema(today: string) {
  return z.object({
    weightKg: z
      .number({ error: "Enter your weight in kg" })
      .min(20, { error: "Enter a weight between 20 and 400 kg" })
      .max(400, { error: "Enter a weight between 20 and 400 kg" }),
    measuredOn: z.iso
      .date()
      .refine((d) => d <= today, { error: "The date can't be in the future" }),
  });
}

export type WeightEntryInput = z.infer<ReturnType<typeof weightEntrySchema>>;
