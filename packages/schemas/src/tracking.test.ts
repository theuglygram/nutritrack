import { describe, expect, it } from "vitest";
import { waterEntrySchema, weightEntrySchema } from "./tracking.ts";

describe("waterEntrySchema", () => {
  it("accepts a sachet", () => {
    expect(waterEntrySchema.parse({ amountMl: 500, unitLabel: "Sachet" })).toEqual({
      amountMl: 500,
      unitLabel: "Sachet",
    });
  });

  it.each([0, -5, 5001, 2.5])("rejects %s ml", (amountMl) => {
    expect(waterEntrySchema.safeParse({ amountMl }).success).toBe(false);
  });
});

describe("weightEntrySchema", () => {
  const schema = weightEntrySchema("2026-11-10");

  it("accepts today", () => {
    expect(schema.safeParse({ weightKg: 72.4, measuredOn: "2026-11-10" }).success).toBe(true);
  });

  it("rejects future dates and impossible weights", () => {
    expect(schema.safeParse({ weightKg: 72, measuredOn: "2026-11-11" }).success).toBe(false);
    expect(schema.safeParse({ weightKg: 19, measuredOn: "2026-11-10" }).success).toBe(false);
  });
});
