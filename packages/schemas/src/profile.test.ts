import { describe, expect, it } from "vitest";
import { passwordSchema, signUpSchema, otpCodeSchema } from "./auth.ts";
import { onboardingSchema, targetOverrideSchema } from "./profile.ts";

const TODAY = "2026-11-10";
const valid = {
  displayName: "Ada",
  sex: "female" as const,
  dateOfBirth: "1990-05-01",
  heightCm: 165,
  weightKg: 70,
  activityLevel: "moderate" as const,
  strengthTrains: true,
  goalType: "lose" as const,
  targetWeightKg: 62,
  targetRateKgPerWeek: 0.5,
  consent: true as const,
};

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues.map((i) => i.message) ?? [];
}

describe("auth schemas", () => {
  it("normalises email and enforces the password policy", () => {
    expect(signUpSchema.parse({ email: "  Ada@Example.COM ", password: "abc12345" }).email).toBe(
      "ada@example.com",
    );
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("allletters").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("accepts only 6-digit codes", () => {
    expect(otpCodeSchema.safeParse(" 123456 ").success).toBe(true);
    expect(otpCodeSchema.safeParse("12345").success).toBe(false);
    expect(otpCodeSchema.safeParse("12345a").success).toBe(false);
  });
});

describe("onboardingSchema", () => {
  it("accepts a complete adult profile", () => {
    expect(onboardingSchema(TODAY).safeParse(valid).success).toBe(true);
  });

  it("rejects under-18s using the supplied date", () => {
    const result = onboardingSchema(TODAY).safeParse({ ...valid, dateOfBirth: "2008-11-11" });
    expect(messages(result)).toContain("NutriTrack is for adults aged 18 and over");
    expect(onboardingSchema(TODAY).safeParse({ ...valid, dateOfBirth: "2008-11-10" }).success).toBe(
      true,
    );
  });

  it("reports a missing or malformed date of birth without throwing", () => {
    for (const dateOfBirth of ["", "01/05/1990", "1990-02-30"]) {
      const result = onboardingSchema(TODAY).safeParse({ ...valid, dateOfBirth });
      expect(messages(result)).toContain("Enter a valid date");
    }
  });

  it("validates a partly filled form without throwing", () => {
    const result = onboardingSchema(TODAY).safeParse({
      displayName: "",
      dateOfBirth: "",
      consent: true,
    });
    expect(result.success).toBe(false);
    expect(messages(result)).toContain("Enter your name");
  });

  it("requires consent", () => {
    expect(onboardingSchema(TODAY).safeParse({ ...valid, consent: false }).success).toBe(false);
  });

  it("requires a target weight in the right direction for lose/gain", () => {
    expect(messages(onboardingSchema(TODAY).safeParse({ ...valid, targetWeightKg: 75 }))).toContain(
      "Target weight should be below your current weight",
    );
    expect(
      messages(
        onboardingSchema(TODAY).safeParse({ ...valid, goalType: "gain", targetWeightKg: 65 }),
      ),
    ).toContain("Target weight should be above your current weight");
    const { targetWeightKg, targetRateKgPerWeek, ...rest } = valid;
    expect(onboardingSchema(TODAY).safeParse({ ...rest, goalType: "maintain" }).success).toBe(true);
  });
});

describe("targetOverrideSchema", () => {
  const targets = { calorieTarget: 1800, proteinG: 100, carbsG: 200, fatG: 60, waterMl: 2500 };

  it("blocks overrides below the floor for the user's sex", () => {
    expect(
      targetOverrideSchema("female").safeParse({ ...targets, calorieTarget: 1200 }).success,
    ).toBe(true);
    expect(
      targetOverrideSchema("female").safeParse({ ...targets, calorieTarget: 1150 }).success,
    ).toBe(false);
    expect(
      targetOverrideSchema("male").safeParse({ ...targets, calorieTarget: 1450 }).success,
    ).toBe(false);
  });

  it("requires whole numbers", () => {
    expect(targetOverrideSchema("male").safeParse({ ...targets, proteinG: 100.5 }).success).toBe(
      false,
    );
  });
});
