import {
  localIsoDate,
  resetToCalculatedTargets,
  saveTargetOverride,
  signOut,
  toUserMessage,
  updateProfile,
  type Goal,
  type Profile,
} from "@nutritrack/api-client";
import { ACTIVITY_LEVEL_LABELS, CALORIE_FLOOR_KCAL, type ActivityLevel } from "@nutritrack/core";
import {
  firstErrorPerField,
  profileUpdateSchema,
  targetOverrideSchema,
  type FieldErrors,
} from "@nutritrack/schemas";
import { useState } from "react";
import {
  Body,
  Button,
  Card,
  ChoiceGroup,
  FormAlert,
  Heading,
  Screen,
  TextField,
} from "@/components/ui";
import { useAccount } from "@/lib/account";
import { supabase } from "@/lib/supabase";

type Message = { kind: "error" | "success"; text: string } | null;

const toNumber = (v: string) => (v.trim() === "" ? undefined : Number(v));

const ACTIVITY_CHOICES = (Object.keys(ACTIVITY_LEVEL_LABELS) as ActivityLevel[]).map((value) => ({
  value,
  ...ACTIVITY_LEVEL_LABELS[value],
}));

export default function ProfileScreen() {
  const { state, reload } = useAccount();
  const [signingOut, setSigningOut] = useState(false);
  if (state.status !== "ready") return null;

  return (
    <Screen edges={["top"]}>
      <Heading>Profile</Heading>
      {state.goal && (
        // key resets the form when a new goal is saved
        <TargetsForm
          key={state.goal.id}
          profile={state.profile}
          goal={state.goal}
          onSaved={reload}
        />
      )}
      <ProfileForm profile={state.profile} goal={state.goal} onSaved={reload} />
      <Button
        label="Sign out"
        loadingLabel="Signing out…"
        variant="outline"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          // Session change returns the user to sign-in, even if the server call fails.
          await signOut(supabase).catch(() => supabase.auth.signOut({ scope: "local" }));
        }}
      />
    </Screen>
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
  const floor = profile.sex ? CALORIE_FLOOR_KCAL[profile.sex] : CALORIE_FLOOR_KCAL.male;
  const [values, setValues] = useState({
    calorieTarget: String(goal.calorie_target),
    proteinG: String(goal.protein_g),
    carbsG: String(goal.carbs_g),
    fatG: String(goal.fat_g),
    waterMl: String(goal.water_ml),
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<Message>(null);
  const [pending, setPending] = useState<"save" | "reset" | null>(null);
  const set = (key: keyof typeof values) => (text: string) =>
    setValues((v) => ({ ...v, [key]: text }));

  async function onSave() {
    const parsed = targetOverrideSchema(profile.sex).safeParse({
      calorieTarget: toNumber(values.calorieTarget),
      proteinG: toNumber(values.proteinG),
      carbsG: toNumber(values.carbsG),
      fatG: toNumber(values.fatG),
      waterMl: toNumber(values.waterMl),
    });
    setMessage(null);
    if (!parsed.success) return setErrors(firstErrorPerField(parsed.error));
    setErrors({});
    setPending("save");
    try {
      await saveTargetOverride(supabase, profile, goal, parsed.data, localIsoDate());
      setMessage({ kind: "success", text: "Your targets are saved." });
      await onSaved();
    } catch (error) {
      setMessage({ kind: "error", text: toUserMessage(error) });
    } finally {
      setPending(null);
    }
  }

  async function onReset() {
    setMessage(null);
    setPending("reset");
    try {
      await resetToCalculatedTargets(supabase, profile, goal, localIsoDate());
      await onSaved();
    } catch (error) {
      setMessage({ kind: "error", text: toUserMessage(error) });
      setPending(null);
    }
  }

  return (
    <Card>
      <Heading level={2}>Daily targets</Heading>
      <Body muted>
        {goal.is_override
          ? "You're using your own targets."
          : "These are calculated for you. Change any number to use your own."}
      </Body>
      <FormAlert kind={message?.kind ?? "error"} message={message?.text ?? null} />
      <TextField
        label="Calories (kcal)"
        keyboardType="number-pad"
        value={values.calorieTarget}
        onChangeText={set("calorieTarget")}
        description={`Minimum ${floor} kcal for your safety.`}
        error={errors.calorieTarget}
      />
      <TextField
        label="Protein (g)"
        keyboardType="number-pad"
        value={values.proteinG}
        onChangeText={set("proteinG")}
        error={errors.proteinG}
      />
      <TextField
        label="Carbs (g)"
        keyboardType="number-pad"
        value={values.carbsG}
        onChangeText={set("carbsG")}
        error={errors.carbsG}
      />
      <TextField
        label="Fat (g)"
        keyboardType="number-pad"
        value={values.fatG}
        onChangeText={set("fatG")}
        error={errors.fatG}
      />
      <TextField
        label="Water (ml)"
        keyboardType="number-pad"
        value={values.waterMl}
        onChangeText={set("waterMl")}
        error={errors.waterMl}
      />
      <Button
        label="Save my targets"
        loadingLabel="Saving…"
        loading={pending === "save"}
        disabled={pending !== null}
        onPress={onSave}
      />
      {goal.is_override && (
        <Button
          label="Use calculated targets"
          loadingLabel="Recalculating…"
          variant="outline"
          loading={pending === "reset"}
          disabled={pending !== null}
          onPress={onReset}
        />
      )}
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
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [heightCm, setHeightCm] = useState(
    profile.height_cm === null ? "" : String(profile.height_cm),
  );
  const [activity, setActivity] = useState<ActivityLevel | undefined>(
    profile.activity_level ?? undefined,
  );
  const [trains, setTrains] = useState<"yes" | "no" | undefined>(
    profile.strength_trains === null ? undefined : profile.strength_trains ? "yes" : "no",
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<Message>(null);
  const [pending, setPending] = useState(false);

  async function onSave() {
    const parsed = profileUpdateSchema.safeParse({
      displayName,
      heightCm: toNumber(heightCm),
      activityLevel: activity,
      strengthTrains: trains === undefined ? undefined : trains === "yes",
    });
    setMessage(null);
    if (!parsed.success) return setErrors(firstErrorPerField(parsed.error));
    setErrors({});
    setPending(true);
    try {
      await updateProfile(supabase, parsed.data, goal, localIsoDate());
      setMessage({
        kind: "success",
        text: goal?.is_override
          ? "Profile saved. You're using your own targets, so they haven't changed."
          : "Profile saved and your targets have been updated.",
      });
      await onSaved();
    } catch (error) {
      setMessage({ kind: "error", text: toUserMessage(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <Heading level={2}>Your details</Heading>
      <FormAlert kind={message?.kind ?? "error"} message={message?.text ?? null} />
      <TextField
        label="Name"
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="given-name"
        error={errors.displayName}
      />
      <TextField
        label="Height (cm)"
        keyboardType="decimal-pad"
        value={heightCm}
        onChangeText={setHeightCm}
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
      <Button label="Save profile" loadingLabel="Saving…" loading={pending} onPress={onSave} />
    </Card>
  );
}
