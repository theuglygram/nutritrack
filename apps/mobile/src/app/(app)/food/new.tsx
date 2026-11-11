import { createCustomFood, toUserMessage } from "@nutritrack/api-client";
import {
  CUSTOM_FOOD_SERVING_UNITS,
  customFoodSchema,
  firstErrorPerField,
  type FieldErrors,
} from "@nutritrack/schemas";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Body, Button, FormAlert, Screen, TextField } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { FONTS, useColors } from "@/lib/theme";

const toNumber = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));

const EMPTY = {
  name: "",
  category: "",
  energyKcal: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  fibreG: "",
  sugarG: "",
  sodiumMg: "",
  servingGrams: "",
};

type Unit = (typeof CUSTOM_FOOD_SERVING_UNITS)[number];

export default function NewFoodScreen() {
  const c = useColors();
  const [form, setForm] = useState(EMPTY);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof EMPTY) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setMessage(null);
    const parsed = customFoodSchema.safeParse({
      name: form.name,
      category: form.category.trim() || undefined,
      energyKcal: toNumber(form.energyKcal),
      proteinG: toNumber(form.proteinG),
      carbsG: toNumber(form.carbsG),
      fatG: toNumber(form.fatG),
      fibreG: toNumber(form.fibreG),
      sugarG: toNumber(form.sugarG),
      sodiumMg: toNumber(form.sodiumMg),
      serving:
        unit || form.servingGrams
          ? { unit: unit ?? "serving", grams: toNumber(form.servingGrams) }
          : undefined,
    });
    if (!parsed.success) {
      setErrors(firstErrorPerField(parsed.error));
      setMessage("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const id = await createCustomFood(supabase, parsed.data);
      router.replace({ pathname: "/food/[id]", params: { id } });
    } catch (e) {
      setMessage(toUserMessage(e));
      setPending(false);
    }
  }

  const num = (label: string, key: keyof typeof EMPTY) => (
    <TextField
      label={label}
      keyboardType="decimal-pad"
      value={form[key]}
      onChangeText={set(key)}
      error={errors[key]}
    />
  );

  return (
    <Screen edges={["bottom"]}>
      <Body muted>Only you will see it. Copy the values from a food label, per 100 g.</Body>
      <FormAlert kind="error" message={message} />
      <TextField label="Name" value={form.name} onChangeText={set("name")} error={errors.name} />
      <TextField
        label="Category (optional)"
        value={form.category}
        onChangeText={set("category")}
        placeholder="e.g. Snacks"
      />

      <Text accessibilityRole="header" style={[styles.h2, { color: c.foreground }]}>
        Per 100 g
      </Text>
      {num("Calories (kcal)", "energyKcal")}
      {num("Protein (g)", "proteinG")}
      {num("Carbs (g)", "carbsG")}
      {num("Fat (g)", "fatG")}
      {num("Fibre (g, optional)", "fibreG")}
      {num("Sugar (g, optional)", "sugarG")}
      {num("Sodium (mg, optional)", "sodiumMg")}
      <Body muted>
        Leave optional values empty if the label doesn&apos;t show them — they&apos;ll be marked
        unknown, not zero.
      </Body>

      <Text accessibilityRole="header" style={[styles.h2, { color: c.foreground }]}>
        Serving size (optional)
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Serving unit" style={styles.chips}>
        {CUSTOM_FOOD_SERVING_UNITS.map((u) => {
          const selected = unit === u;
          return (
            <Pressable
              key={u}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setUnit(selected ? null : u)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? c.primary : c.border,
                  backgroundColor: selected ? c.primarySoft : c.card,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? c.primary : c.foreground,
                  fontFamily: FONTS.bodyMedium,
                  fontSize: 14,
                }}
              >
                {u}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {num("Weight of one (g)", "servingGrams")}
      {errors["serving.grams"] && (
        <Text style={{ color: c.destructive, fontFamily: FONTS.body }}>
          {errors["serving.grams"]}
        </Text>
      )}

      <Button label="Save food" loading={pending} loadingLabel="Saving…" onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 18, fontFamily: FONTS.headingSemibold, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
  },
});
