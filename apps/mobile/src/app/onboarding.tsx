import {
  completeOnboarding,
  isOnboarded,
  localIsoDate,
  previewTargets,
  toUserMessage,
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
  onboardingAnswersForPreview,
  validateOnboardingStep,
  type FieldErrors,
  type OnboardingDraft,
  type OnboardingInput,
} from "@nutritrack/schemas";
import { Redirect, router } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { DateOfBirthField } from "@/components/date-of-birth-field";
import { TargetsSummary } from "@/components/targets-summary";
import {
  Body,
  Button,
  Card,
  Checkbox,
  ChoiceGroup,
  ErrorState,
  FormAlert,
  Heading,
  LoadingState,
  Screen,
  TextField,
} from "@/components/ui";
import { AccountProvider, useAccount } from "@/lib/account";
import { supabase } from "@/lib/supabase";

export default function OnboardingScreen() {
  return (
    <AccountProvider>
      <OnboardingGate />
    </AccountProvider>
  );
}

function OnboardingGate() {
  const { state, reload } = useAccount();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={reload} />;
  if (isOnboarded(state.profile)) return <Redirect href="/" />;
  return <OnboardingForm />;
}

function OnboardingForm() {
  const today = useMemo(() => localIsoDate(), []);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_ONBOARDING_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

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
      await completeOnboarding(supabase, input, today);
      router.replace("/");
    } catch (error) {
      setFormError(toUserMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Body center>{APP_NAME}</Body>
      <Body center muted>
        Step {step + 1} of {ONBOARDING_STEPS.length}
      </Body>
      <Card>
        <Heading>{ONBOARDING_STEPS[step]?.title}</Heading>
        <FormAlert kind="error" message={formError} />

        {step === 0 && (
          <>
            <TextField
              label="What should we call you?"
              value={draft.displayName}
              onChangeText={(t) => set("displayName", t)}
              autoComplete="given-name"
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
            <DateOfBirthField
              value={draft.dateOfBirth}
              onChange={(iso) => set("dateOfBirth", iso)}
              description={`NutriTrack is for adults aged ${MIN_AGE_YEARS} and over.`}
              error={errors.dateOfBirth}
            />
            <TextField
              label="Height (cm)"
              keyboardType="decimal-pad"
              value={draft.heightCm}
              onChangeText={(t) => set("heightCm", t)}
              error={errors.heightCm}
            />
            <TextField
              label="Current weight (kg)"
              keyboardType="decimal-pad"
              value={draft.weightKg}
              onChangeText={(t) => set("weightKg", t)}
              error={errors.weightKg}
            />
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
                { value: "yes", label: "Yes", description: "We'll set a higher protein target" },
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
                  keyboardType="decimal-pad"
                  value={draft.targetWeightKg}
                  onChangeText={(t) => set("targetWeightKg", t)}
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
                {preview.adjustments.map((a) => (
                  <Body key={a}>• {TARGET_ADJUSTMENT_MESSAGES[a]}</Body>
                ))}
                <Body muted>
                  You can change these at any time in Settings. {NOT_MEDICAL_ADVICE}
                </Body>
              </>
            ) : (
              <FormAlert
                kind="error"
                message="Some earlier answers need fixing. Go back and check them."
              />
            )}
            <Checkbox
              label={HEALTH_DATA_CONSENT}
              checked={draft.consent}
              onChange={(v) => set("consent", v)}
              error={errors.consent}
            />
          </>
        )}

        <View style={{ gap: 8 }}>
          <Button
            label={step < LAST_ONBOARDING_STEP ? "Continue" : "Start tracking"}
            loadingLabel="Saving…"
            loading={submitting}
            disabled={step === LAST_ONBOARDING_STEP && !preview}
            onPress={next}
          />
          {step > 0 && (
            <Button
              label="Back"
              variant="outline"
              disabled={submitting}
              onPress={() => {
                setErrors({});
                setStep((s) => s - 1);
              }}
            />
          )}
        </View>
      </Card>
    </Screen>
  );
}
