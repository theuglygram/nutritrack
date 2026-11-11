import {
  listMyFoods,
  searchFoods,
  type FoodSearchResult,
  type MyFood,
} from "@nutritrack/api-client";
import { FOOD_LANGUAGE_LABELS } from "@nutritrack/core";
import { router, useFocusEffect } from "expo-router";
import { ChevronRight, Plus, Search, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { VerificationBadge } from "@/components/food";
import { PanelError, Skeleton } from "@/components/panel";
import { Heading, Screen } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { FONTS, RADIUS, TOUCH_TARGET, useColors } from "@/lib/theme";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const EXAMPLES = ["ewa", "dodo", "isu", "shinkafa", "groundnut", "palm oil"];

type Results =
  | { status: "loading"; query: string }
  | { status: "error"; query: string; error: unknown }
  | { status: "ready"; query: string; items: FoodSearchResult[] };

export default function FoodSearchScreen() {
  const c = useColors();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [attempt, setAttempt] = useState(0);
  const term = query.trim();

  // Search 250 ms after typing pauses; stale responses are ignored.
  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setResults({ status: "loading", query: term });
      searchFoods(supabase, term).then(
        (items) => !cancelled && setResults({ status: "ready", query: term, items }),
        (error: unknown) => !cancelled && setResults({ status: "error", query: term, error }),
      );
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, attempt]);

  return (
    <Screen edges={["top"]}>
      <View style={styles.headerRow}>
        <Heading>Food</Heading>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add your own food"
          onPress={() => router.push("/food/new")}
          style={[styles.addButton, { borderColor: c.border, backgroundColor: c.card }]}
        >
          <Plus color={c.foreground} size={18} />
          <Text style={[styles.small, { color: c.foreground, fontFamily: FONTS.bodySemibold }]}>
            Add
          </Text>
        </Pressable>
      </View>
      <View style={[styles.searchBox, { borderColor: c.border, backgroundColor: c.card }]}>
        <Search color={c.muted} size={20} />
        <TextInput
          accessibilityLabel="Search foods"
          placeholder="Try “ewa”, “dodo” or “rice”"
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={[styles.searchInput, { color: c.foreground }]}
        />
        {query !== "" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQuery("")}
            hitSlop={10}
          >
            <X color={c.muted} size={20} />
          </Pressable>
        )}
      </View>

      {term.length < 2 || !results ? (
        <Idle onExample={setQuery} />
      ) : results.status === "loading" ? (
        <Skeleton lines={5} />
      ) : results.status === "error" ? (
        <PanelError error={results.error} onRetry={() => setAttempt((a) => a + 1)} />
      ) : results.items.length === 0 ? (
        <View style={[styles.empty, { borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>
            No foods match “{results.query}”.
          </Text>
          <Text style={[styles.small, { color: c.muted }]}>
            Our Nigerian food database is still growing. You can add this food yourself — only you
            will see it.
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/food/new")}
            style={{ minHeight: TOUCH_TARGET, justifyContent: "center" }}
          >
            <Text style={[styles.small, { color: c.primary, fontFamily: FONTS.bodySemibold }]}>
              Add your own food
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Text accessibilityLiveRegion="polite" style={[styles.small, { color: c.muted }]}>
            {results.items.length} {results.items.length === 1 ? "food" : "foods"} for “
            {results.query}”
          </Text>
          <View style={[styles.list, { borderColor: c.border, backgroundColor: c.card }]}>
            {results.items.map((food, i) => (
              <ResultRow key={food.id} food={food} first={i === 0} />
            ))}
          </View>
        </View>
      )}
    </Screen>
  );
}

function ResultRow({ food, first }: { food: FoodSearchResult; first: boolean }) {
  const c = useColors();
  const kcal = food.energyKcal === null ? "unknown" : nf.format(food.energyKcal);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${food.name}, ${kcal} kilocalories per 100 grams${food.matchedAlias ? `, matched ${food.matchedAlias.alias}` : ""}`}
      onPress={() => router.push({ pathname: "/food/[id]", params: { id: food.id } })}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
        pressed && { backgroundColor: c.surface },
      ]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.label, { color: c.foreground }]}>{food.name}</Text>
        {food.matchedAlias && (
          <Text style={[styles.small, { color: c.muted }]}>
            “{food.matchedAlias.alias}” · {FOOD_LANGUAGE_LABELS[food.matchedAlias.language]}
          </Text>
        )}
        <VerificationBadge status={food.verificationStatus} isCustom={food.isCustom} />
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: c.foreground, fontFamily: FONTS.headingSemibold, fontSize: 18 }}>
          {food.energyKcal === null ? "—" : nf.format(food.energyKcal)}
        </Text>
        <Text style={[styles.tiny, { color: c.muted }]}>kcal / 100 g</Text>
      </View>
      <ChevronRight color={c.muted} size={18} />
    </Pressable>
  );
}

function Idle({ onExample }: { onExample: (q: string) => void }) {
  const c = useColors();
  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 10 }}>
        <Text style={[styles.small, { color: c.muted }]}>Try a local name</Text>
        <View style={styles.chips}>
          {EXAMPLES.map((ex) => (
            <Pressable
              key={ex}
              accessibilityRole="button"
              onPress={() => onExample(ex)}
              style={[styles.chip, { borderColor: c.border, backgroundColor: c.card }]}
            >
              <Text style={[styles.small, { color: c.foreground, fontFamily: FONTS.bodyMedium }]}>
                {ex}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <MyFoods />
      <Text style={[styles.small, { color: c.muted }]}>
        Values come from documented sources and are labelled until our dietitian has reviewed them.
        Nigerian dishes like jollof and egusi soup will be added once their recipes are sourced.
        Logging food arrives in the next update.
      </Text>
    </View>
  );
}

function MyFoods() {
  const c = useColors();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; error: unknown }
    | { status: "ready"; items: MyFood[] }
  >({ status: "loading" });

  const load = useCallback(() => {
    let cancelled = false;
    listMyFoods(supabase).then(
      (items) => !cancelled && setState({ status: "ready", items }),
      (error: unknown) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh when returning from "add" or "delete".
  useFocusEffect(load);

  return (
    <View style={{ gap: 10 }}>
      <Text
        accessibilityRole="header"
        style={{ color: c.foreground, fontFamily: FONTS.headingSemibold, fontSize: 18 }}
      >
        Your foods
      </Text>
      {state.status === "loading" ? (
        <Skeleton lines={2} />
      ) : state.status === "error" ? (
        <PanelError error={state.error} onRetry={load} />
      ) : state.items.length === 0 ? (
        <Text style={[styles.small, styles.empty, { color: c.muted, borderColor: c.border }]}>
          Foods you add yourself appear here.
        </Text>
      ) : (
        <View style={[styles.list, { borderColor: c.border, backgroundColor: c.card }]}>
          {state.items.map((f, i) => (
            <Pressable
              key={f.id}
              accessibilityRole="link"
              onPress={() => router.push({ pathname: "/food/[id]", params: { id: f.id } })}
              style={[
                styles.row,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
              ]}
            >
              <Text style={[styles.label, { flex: 1, color: c.foreground }]}>{f.name}</Text>
              <Text style={[styles.small, { color: c.muted }]}>
                {f.energyKcal === null ? "—" : `${nf.format(f.energyKcal)} kcal / 100 g`}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  searchInput: { flex: 1, fontSize: 17, fontFamily: FONTS.body, minHeight: TOUCH_TARGET },
  list: { borderWidth: 1, borderRadius: RADIUS.lg, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: RADIUS.md, padding: 16, gap: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: "center",
  },
  label: { fontSize: 16, fontFamily: FONTS.bodySemibold },
  small: { fontSize: 14, lineHeight: 19, fontFamily: FONTS.body },
  tiny: { fontSize: 12, fontFamily: FONTS.body },
});
