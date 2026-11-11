"use client";

import {
  localIsoDate,
  resetToCalculatedTargets,
  saveTargetOverride,
  updateProfile,
  type Goal,
  type Profile,
} from "@nutritrack/api-client";
import {
  ACTIVITY_LEVEL_LABELS,
  APP_NAME,
  CALORIE_FLOOR_KCAL,
  type ActivityLevel,
} from "@nutritrack/core";
import { profileUpdateSchema, targetOverrideSchema } from "@nutritrack/schemas";
import { useState, type FormEvent } from "react";
import { ChoiceGroup } from "@/components/choice-group";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { SignOutButton } from "@/components/sign-out-button";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from "@/lib/account";
import { errorMessage, fieldErrors, toNumber, type FieldErrors } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

const ACTIVITY_CHOICES = (Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((value) => ({
  value,
  ...ACTIVITY_LEVEL_LABELS[value],
}));

export default function ProfilePage() {
  const { state, reload } = useAccount();
  if (state.status !== "ready") return null;
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Profile" description="Your details and daily targets." />
      {state.goal && <TargetsForm profile={state.profile} goal={state.goal} onSaved={reload} />}
      <ProfileForm profile={state.profile} goal={state.goal} onSaved={reload} />
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground">Signed in to {APP_NAME}.</p>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}

function TargetsForm({
  profile,
  goal,
  onSaved,
}: {
  profile: Profile;
  goal: Goal;
  onSaved: () => Promise<void>;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState<"save" | "reset" | null>(null);
  const floor = profile.sex ? CALORIE_FLOOR_KCAL[profile.sex] : CALORIE_FLOOR_KCAL.male;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = targetOverrideSchema(profile.sex).safeParse({
      calorieTarget: toNumber(String(data.get("calorieTarget"))),
      proteinG: toNumber(String(data.get("proteinG"))),
      carbsG: toNumber(String(data.get("carbsG"))),
      fatG: toNumber(String(data.get("fatG"))),
      waterMl: toNumber(String(data.get("waterMl"))),
    });
    setMessage(null);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending("save");
    try {
      await saveTargetOverride(getSupabase(), profile, goal, parsed.data, localIsoDate());
      await onSaved();
      setMessage({ kind: "success", text: "Your targets are saved." });
    } catch (error) {
      setMessage({ kind: "error", text: errorMessage(error) });
    } finally {
      setPending(null);
    }
  }

  async function onReset() {
    setMessage(null);
    setPending("reset");
    try {
      await resetToCalculatedTargets(getSupabase(), profile, goal, localIsoDate());
      await onSaved();
      setMessage({ kind: "success", text: "Targets recalculated from your profile." });
    } catch (error) {
      setMessage({ kind: "error", text: errorMessage(error) });
    } finally {
      setPending(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Daily targets</h2>
        </CardTitle>
        <CardDescription>
          {goal.is_override
            ? "You're using your own targets."
            : "These are calculated for you. Change any number to use your own."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* key resets the uncontrolled inputs when the saved goal changes */}
        <form key={goal.id} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormAlert kind={message?.kind ?? "error"} message={message?.text ?? null} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Calories (kcal)"
              name="calorieTarget"
              type="number"
              inputMode="numeric"
              min={floor}
              defaultValue={goal.calorie_target}
              description={`Minimum ${floor} kcal for your safety.`}
              error={errors.calorieTarget}
            />
            <TextField
              label="Protein (g)"
              name="proteinG"
              type="number"
              inputMode="numeric"
              defaultValue={goal.protein_g}
              error={errors.proteinG}
            />
            <TextField
              label="Carbs (g)"
              name="carbsG"
              type="number"
              inputMode="numeric"
              defaultValue={goal.carbs_g}
              error={errors.carbsG}
            />
            <TextField
              label="Fat (g)"
              name="fatG"
              type="number"
              inputMode="numeric"
              defaultValue={goal.fat_g}
              error={errors.fatG}
            />
            <TextField
              label="Water (ml)"
              name="waterMl"
              type="number"
              inputMode="numeric"
              defaultValue={goal.water_ml}
              error={errors.waterMl}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending !== null}>
              {pending === "save" ? "Saving…" : "Save my targets"}
            </Button>
            {goal.is_override && (
              <Button type="button" variant="outline" onClick={onReset} disabled={pending !== null}>
                {pending === "reset" ? "Recalculating…" : "Use calculated targets"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ProfileForm({
  profile,
  goal,
  onSaved,
}: {
  profile: Profile;
  goal: Goal | null;
  onSaved: () => Promise<void>;
}) {
  const [activity, setActivity] = useState<ActivityLevel | undefined>(
    profile.activity_level ?? undefined,
  );
  const [trains, setTrains] = useState<"yes" | "no" | undefined>(
    profile.strength_trains === null ? undefined : profile.strength_trains ? "yes" : "no",
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = profileUpdateSchema.safeParse({
      displayName: data.get("displayName"),
      heightCm: toNumber(String(data.get("heightCm"))),
      activityLevel: activity,
      strengthTrains: trains === undefined ? undefined : trains === "yes",
    });
    setMessage(null);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setPending(true);
    try {
      await updateProfile(getSupabase(), parsed.data, goal, localIsoDate());
      await onSaved();
      setMessage({
        kind: "success",
        text: goal?.is_override
          ? "Profile saved. You're using your own targets, so they haven't changed."
          : "Profile saved and your targets have been updated.",
      });
    } catch (error) {
      setMessage({ kind: "error", text: errorMessage(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Your details</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <FormAlert kind={message?.kind ?? "error"} message={message?.text ?? null} />
          <TextField
            label="Name"
            name="displayName"
            autoComplete="given-name"
            defaultValue={profile.display_name ?? ""}
            error={errors.displayName}
          />
          <TextField
            label="Height (cm)"
            name="heightCm"
            type="number"
            inputMode="decimal"
            defaultValue={profile.height_cm ?? ""}
            error={errors.heightCm}
          />
          <ChoiceGroup
            legend="How active are you?"
            choices={ACTIVITY_CHOICES}
            value={activity}
            onChange={setActivity}
            error={errors.activityLevel}
          />
          <ChoiceGroup
            legend="Do you do strength training (weights, gym) regularly?"
            choices={[
              { value: "yes", label: "Yes", description: "Raises your protein target" },
              { value: "no", label: "No" },
            ]}
            value={trains}
            onChange={setTrains}
            error={errors.strengthTrains}
          />
          <Button type="submit" className="self-start" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
