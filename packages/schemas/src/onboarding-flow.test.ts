import { describe, expect, it } from "vitest";
import {
  EMPTY_ONBOARDING_DRAFT,
  LAST_ONBOARDING_STEP,
  latestAdultBirthDate,
  onboardingAnswersForPreview,
  validateOnboardingStep,
  type OnboardingDraft,
} from "./onboarding-flow.ts";

const TODAY = "2026-11-10";
const complete: OnboardingDraft = {
  displayName: "Ada",
  sex: "female",
  dateOfBirth: "1990-05-01",
  heightCm: "165",
  weightKg: "70",
  activityLevel: "moderate",
  strengthTrains: "yes",
  goalType: "lose",
  targetWeightKg: "62",
  targetRateKgPerWeek: "0.5",
  consent: false,
};

describe("validateOnboardingStep", () => {
  it("reports only the current step's errors on an empty draft (and never throws)", () => {
    const { errors } = validateOnboardingStep(TODAY, EMPTY_ONBOARDING_DRAFT, 0);
    expect(Object.keys(errors).sort()).toEqual(
      ["dateOfBirth", "displayName", "heightCm", "sex", "weightKg"].sort(),
    );
    expect(errors.displayName).toBe("Enter your name");
  });

  it("lets a completed step pass while later steps are still empty", () => {
    const step1Only: OnboardingDraft = {
      ...EMPTY_ONBOARDING_DRAFT,
      displayName: "Ada",
      sex: "female",
      dateOfBirth: "1990-05-01",
      heightCm: "165",
      weightKg: "70",
    };
    expect(validateOnboardingStep(TODAY, step1Only, 0).errors).toEqual({});
    expect(Object.keys(validateOnboardingStep(TODAY, step1Only, 1).errors)).toEqual([
      "activityLevel",
      "strengthTrains",
    ]);
  });

  it("requires consent only on the last step", () => {
    expect(validateOnboardingStep(TODAY, complete, 2).errors).toEqual({});
    expect(validateOnboardingStep(TODAY, complete, LAST_ONBOARDING_STEP).errors).toEqual({
      consent: "You need to agree before continuing",
    });
    const done = validateOnboardingStep(
      TODAY,
      { ...complete, consent: true },
      LAST_ONBOARDING_STEP,
    );
    expect(done.errors).toEqual({});
    expect(done.data).toMatchObject({
      weightKg: 70,
      strengthTrains: true,
      targetRateKgPerWeek: 0.5,
    });
  });

  it("drops target weight and rate for a maintain goal", () => {
    const { data } = validateOnboardingStep(
      TODAY,
      { ...complete, goalType: "maintain", consent: true },
      LAST_ONBOARDING_STEP,
    );
    expect(data?.targetWeightKg).toBeUndefined();
    expect(data?.targetRateKgPerWeek).toBeUndefined();
  });
});

describe("helpers", () => {
  it("previews once every answer except consent is valid", () => {
    expect(onboardingAnswersForPreview(TODAY, complete)).not.toBeNull();
    expect(onboardingAnswersForPreview(TODAY, { ...complete, weightKg: "" })).toBeNull();
  });

  it("computes the latest adult birth date", () => {
    expect(latestAdultBirthDate(TODAY, 18)).toBe("2008-11-10");
  });
});
