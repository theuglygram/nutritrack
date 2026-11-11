import { deleteCustomFood, getFood, toUserMessage, type FoodDetail } from "@nutritrack/api-client";
import { CUSTOM_FOOD_LABEL, FOOD_LANGUAGE_LABELS, VERIFICATION_LABELS } from "@nutritrack/core";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { NutrientTable, VerificationBadge } from "@/components/food";
import { Panel, PanelError, Skeleton } from "@/components/panel";
import { Body, Button, Heading, Screen } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { FONTS, RADIUS, useColors } from "@/lib/theme";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

type State =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "missing" }
  | { status: "ready"; food: FoodDetail };

export default function FoodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getFood(supabase, id).then(
      (food) => !cancelled && setState(food ? { status: "ready", food } : { status: "missing" }),
      (error: unknown) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  return (
    <Screen edges={[]}>
      {state.status === "loading" ? (
        <Skeleton lines={8} />
      ) : state.status === "error" ? (
        <PanelError
          error={state.error}
          onRetry={() => {
            setState({ status: "loading" });
            setAttempt((a) => a + 1);
          }}
        />
      ) : state.status === "missing" ? (
        <>
          <Heading>Food not found</Heading>
          <Body muted>It may have been removed, or it belongs to someone else.</Body>
        </>
      ) : (
        <Detail food={state.food} />
      )}
    </Screen>
  );
}

function Detail({ food }: { food: FoodDetail }) {
  const c = useColors();
  const portions = [{ label: "100 g", grams: 100 }].concat(
    food.servings.map((s) => ({
      label: `1 ${s.unitName} (${nf.format(s.grams)} g)`,
      grams: s.grams,
    })),
  );
  const [portion, setPortion] = useState(0);
  const [customGrams, setCustomGrams] = useState("");
  const custom = Number(customGrams.replace(",", "."));
  const grams =
    portion === -1 && custom > 0 && custom <= 10000 ? custom : (portions[portion]?.grams ?? 100);
  const status = food.isCustom ? CUSTOM_FOOD_LABEL : VERIFICATION_LABELS[food.verificationStatus];

  const confirmDelete = () =>
    Alert.alert(`Delete “${food.name}”?`, "This can't be undone.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteCustomFood(supabase, food.id)
            .then(() => router.back())
            .catch((e: unknown) => Alert.alert("Couldn't delete", toUserMessage(e)));
        },
      },
    ]);

  return (
    <>
      <View style={{ gap: 8 }}>
        <VerificationBadge status={food.verificationStatus} isCustom={food.isCustom} />
        <Heading>{food.name}</Heading>
        <Body muted>{[food.category, food.cookingMethod].filter(Boolean).join(" · ")}</Body>
      </View>

      <Panel title="Nutrition">
        <Text style={[styles.small, { color: c.muted }]}>Show values for</Text>
        <View style={styles.chips}>
          {portions.map((p, i) => {
            const selected = portion === i;
            return (
              <Pressable
                key={p.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setPortion(i)}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? c.primary : c.border,
                    backgroundColor: selected ? c.primarySoft : c.card,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.small,
                    { color: selected ? c.primary : c.foreground, fontFamily: FONTS.bodyMedium },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
          <View
            style={[
              styles.chip,
              styles.customChip,
              {
                borderColor: portion === -1 ? c.primary : c.border,
                backgroundColor: portion === -1 ? c.primarySoft : c.card,
              },
            ]}
          >
            <TextInput
              accessibilityLabel="Other amount in grams"
              placeholder="Other"
              placeholderTextColor={c.muted}
              keyboardType="decimal-pad"
              value={customGrams}
              onFocus={() => setPortion(-1)}
              onChangeText={(v) => {
                setCustomGrams(v);
                setPortion(-1);
              }}
              style={{ minWidth: 48, color: c.foreground, fontFamily: FONTS.body, fontSize: 14 }}
            />
            <Text style={[styles.small, { color: c.muted }]}>g</Text>
          </View>
        </View>
        <NutrientTable per100g={food.per100g} grams={grams} />
        <Button label="Log this food" onPress={() => undefined} disabled />
        <Text style={[styles.tiny, { color: c.muted, textAlign: "center" }]}>
          Logging food arrives in the next update.
        </Text>
      </Panel>

      <Panel title="Where these numbers come from">
        <Text style={[styles.small, { color: c.foreground }]}>
          <Text style={{ fontFamily: FONTS.bodySemibold }}>{status.label}. </Text>
          <Text style={{ color: c.muted }}>{status.description}</Text>
        </Text>
        {food.source && (
          <View style={{ gap: 6 }}>
            <Text style={[styles.small, { color: c.muted }]}>Source</Text>
            <Text style={[styles.small, { color: c.foreground, fontFamily: FONTS.bodyMedium }]}>
              {food.source.name}
            </Text>
            {food.source.licence && (
              <Text style={[styles.small, { color: c.muted }]}>Licence: {food.source.licence}</Text>
            )}
            {food.source.url && (
              <Pressable
                accessibilityRole="link"
                onPress={() => void Linking.openURL(food.source?.url ?? "")}
              >
                <Text style={[styles.small, { color: c.primary, fontFamily: FONTS.bodySemibold }]}>
                  Visit source
                </Text>
              </Pressable>
            )}
          </View>
        )}
        {food.notes && <Text style={[styles.small, { color: c.muted }]}>{food.notes}</Text>}
      </Panel>

      {food.aliases.length > 0 && (
        <Panel title="Also known as">
          <View style={styles.chips}>
            {food.aliases.map((a) => (
              <View key={a.alias} style={[styles.alias, { backgroundColor: c.surface }]}>
                <Text style={[styles.small, { color: c.foreground }]}>
                  {a.alias}{" "}
                  <Text style={{ color: c.muted }}>· {FOOD_LANGUAGE_LABELS[a.language]}</Text>
                </Text>
              </View>
            ))}
          </View>
        </Panel>
      )}

      {food.isCustom && (
        <Button label="Delete this food" variant="outline" onPress={confirmDelete} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 14, lineHeight: 19, fontFamily: FONTS.body },
  tiny: { fontSize: 12, fontFamily: FONTS.body },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
  },
  customChip: { flexDirection: "row", alignItems: "center", gap: 4 },
  alias: { borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 6 },
});
