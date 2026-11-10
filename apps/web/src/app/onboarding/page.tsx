"use client";

import {
  completeOnboarding,
  isOnboarded,
  localIsoDate,
  previewTargets,
} from "@nutritrack/api-client";
import {
  ACTIVITY_LEVEL_LABELS,
  APP_NAME,
  GOAL_TYPE_LABELS,
  HEALTH_DATA_CONSENT,
  MIN_AGE_YEARS,
  NOT_MEDICAL_ADVICE,
  RATE_OPTIONS_KG_PER_WEEK,
  SEX_LABELS,
  TARGET_ADJUSTMENT_MESSAGES,
  type ActivityLevel,
} from "@nutritrack/core";
import {
  EMPTY_ONBOARDING_DRAFT,
  LAST_ONBOARDING_STEP,
  ONBOARDING_STEPS,
  latestAdultBirthDate,
  onboardingAnswersForPreview,
  validateOnboardingStep,
  type FieldErrors,
  type OnboardingDraft,
  type OnboardingInput,
} from "@nutritrack/schemas";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorState, LoadingState } from "@/components/account-status";
import { ChoiceGroup } from "@/components/choice-group";
import { FormAlert } from "@/components/form-alert";
import { TargetsSummary } from "@/components/targets-summary";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { useAccount } from "@/lib/account";
import { errorMessage } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

type Draft = OnboardingDraft;
const STEPS = ONBOARDING_STEPS;

export default function OnboardingPage() {
  const { state, reload } = useAccount();
  const router = useRouter();
  const alreadyDone = state.status === "ready" && isOnboarded(state.profile);

  useEffect(() => {
    if (alreadyDone) router.replace("/");
  }, [alreadyDone, router]);

  if (state.status === "loading" || alreadyDone) return <LoadingState />;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={reload} />;
  return <OnboardingForm />;
}

function OnboardingForm() {
  const router = useRouter();
  const today = useMemo(() => localIsoDate(), []);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_ONBOARDING_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), [step]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Preview once every answer before the review step is valid.
  const preview = useMemo(() => {
    if (step !== LAST_ONBOARDING_STEP) return null;
    const answers = onboardingAnswersForPreview(today, draft);
    return answers ? previewTargets(answers, today) : null;
  }, [draft, step, today]);

  function next() {
    const { errors: stepErrors, data } = validateOnboardingStep(today, draft, step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    if (step < LAST_ONBOARDING_STEP) {
      setStep((s) => s + 1);
      return;
    }
    if (data) void submit(data);
  }

  async function submit(input: OnboardingInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      await completeOnboarding(getSupabase(), input, today);
      router.replace("/");
      router.refresh();
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  const maxBirthDate = useMemo(() => latestAdultBirthDate(today, MIN_AGE_YEARS), [today]);

  return (
    <main className="flex flex-1 justify-center px-4 py-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <p className="text-center text-xl font-bold tracking-tight">{APP_NAME}</p>
        <p className="text-center text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
                {STEPS[step]!.title}
              </h1>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              noValidate
              className="flex flex-col gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              <FormAlert kind="error" message={formError} />

              {step === 0 && (
                <>
                  <TextField
                    label="What should we call you?"
                    autoComplete="given-name"
                    value={draft.displayName}
                    onChange={(e) => set("displayName", e.target.value)}
                    error={errors.displayName}
                  />
                  <ChoiceGroup
                    legend="Sex"
                    choices={(["female", "male"] as const).map((v) => ({
                      value: v,
                      label: SEX_LABELS[v],
                    }))}
                    value={draft.sex}
                    onChange={(v) => set("sex", v)}
                    error={errors.sex}
                  />
                  <TextField
                    label="Date of birth"
                    type="date"
                    max={maxBirthDate}
                    autoComplete="bday"
                    value={draft.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    description={`NutriTrack is for adults aged ${MIN_AGE_YEARS} and over.`}
                    error={errors.dateOfBirth}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Height (cm)"
                      type="number"
                      inputMode="decimal"
                      value={draft.heightCm}
                      onChange={(e) => set("heightCm", e.target.value)}
                      error={errors.heightCm}
                    />
                    <TextField
                      label="Current weight (kg)"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={draft.weightKg}
                      onChange={(e) => set("weightKg", e.target.value)}
                      error={errors.weightKg}
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <ChoiceGroup
                    legend="How active are you?"
                    choices={(Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((v) => ({
                      value: v,
                      ...ACTIVITY_LEVEL_LABELS[v],
                    }))}
                    value={draft.activityLevel}
                    onChange={(v) => set("activityLevel", v)}
                    error={errors.activityLevel}
                  />
                  <ChoiceGroup
                    legend="Do you do strength training (weights, gym) regularly?"
                    choices={[
                      {
                        value: "yes",
                        label: "Yes",
                        description: "We'll set a higher protein target",
                      },
                      { value: "no", label: "No" },
                    ]}
                    value={draft.strengthTrains}
                    onChange={(v) => set("strengthTrains", v)}
                    error={errors.strengthTrains}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <ChoiceGroup
                    legend="What's your goal?"
                    choices={(["lose", "maintain", "gain"] as const).map((v) => ({
                      value: v,
                      label: GOAL_TYPE_LABELS[v],
                    }))}
                    value={draft.goalType}
                    onChange={(v) =>
                      setDraft((d) => ({ ...d, goalType: v, targetRateKgPerWeek: undefined }))
                    }
                    error={errors.goalType}
                  />
                  {draft.goalType && draft.goalType !== "maintain" && (
                    <>
                      <TextField
                        label="Target weight (kg)"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={draft.targetWeightKg}
                        onChange={(e) => set("targetWeightKg", e.target.value)}
                        error={errors.targetWeightKg}
                      />
                      <ChoiceGroup
                        legend={
                          draft.goalType === "lose"
                            ? "How fast would you like to lose?"
                            : "How fast would you like to gain?"
                        }
                        choices={RATE_OPTIONS_KG_PER_WEEK[draft.goalType].map((r) => ({
                          value: String(r),
                          label: `${r} kg a week`,
                        }))}
                        value={draft.targetRateKgPerWeek}
                        onChange={(v) => set("targetRateKgPerWeek", v)}
                        error={errors.targetRateKgPerWeek}
                      />
                    </>
                  )}
                </>
              )}

              {step === LAST_ONBOARDING_STEP && (
                <>
                  {preview ? (
                    <>
                      <TargetsSummary targets={preview} />
                      {preview.adjustments.length > 0 && (
                        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
                          {preview.adjustments.map((a) => (
                            <li key={a}>{TARGET_ADJUSTMENT_MESSAGES[a]}</li>
                          ))}
                        </ul>
                      )}
                      <p className="text-sm text-muted-foreground">
                        You can change these at any time in Settings. {NOT_MEDICAL_ADVICE}
                      </p>
                    </>
                  ) : (
                    <FormAlert
                      kind="error"
                      message="Some earlier answers need fixing. Go back and check them."
                    />
                  )}
                  <Field
                    orientation="horizontal"
                    data-invalid={Boolean(errors.consent) || undefined}
                  >
                    <Checkbox
                      id="consent"
                      checked={draft.consent}
                      onCheckedChange={(c) => set("consent", c === true)}
                      aria-invalid={Boolean(errors.consent) || undefined}
                    />
                    <FieldLabel htmlFor="consent" className="font-normal leading-snug">
                      {HEALTH_DATA_CONSENT}
                    </FieldLabel>
                  </Field>
                  {errors.consent && <FieldError>{errors.consent}</FieldError>}
                </>
              )}

              <div className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={step === 0 || submitting}
                  onClick={() => {
                    setErrors({});
                    setStep((s) => s - 1);
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || (step === LAST_ONBOARDING_STEP && !preview)}
                >
                  {step < LAST_ONBOARDING_STEP
                    ? "Continue"
                    : submitting
                      ? "Saving…"
                      : "Start tracking"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
