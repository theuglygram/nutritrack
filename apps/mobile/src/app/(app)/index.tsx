import {
  DASHBOARD_WEIGHT_DAYS,
  addWater,
  deleteLogEntry,
  deleteWater,
  toUserMessage,
  type Goal,
  type LogEntry,
  type Profile,
  type WaterEntry,
  type WeightEntry,
} from "@nutritrack/api-client";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  NOT_MEDICAL_ADVICE,
  WATER_PORTIONS,
  dailyTip,
  firstName,
  formatLitres,
  greetingFor,
  groupByMealSlot,
  isoDaysBefore,
  progressToward,
  sumLoggedNutrients,
  sumWaterMl,
  summariseWeights,
  type MealSlot,
} from "@nutritrack/core";
import { router } from "expo-router";
import {
  Camera,
  ChevronRight,
  Coffee,
  Cookie,
  Droplet,
  Lightbulb,
  MessageSquareText,
  Moon,
  PenLine,
  Search,
  Sun,
  Trash2,
  Undo2,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import { waterEntrySchema } from "@nutritrack/schemas";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CalorieFigures, CalorieRing, MacroProgress, ProgressBar } from "@/components/nutrition";
import { Panel, PanelError, Skeleton } from "@/components/panel";
import { Screen } from "@/components/ui";
import { WeighInForm, WeightTrend } from "@/components/weight";
import { useAccount } from "@/lib/account";
import { useDashboard, type DashboardState } from "@/lib/dashboard";
import { supabase } from "@/lib/supabase";
import { FONTS, RADIUS, TOUCH_TARGET, useColors, type Colors } from "@/lib/theme";

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });
const kcalFmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

export default function HomeScreen() {
  const { state } = useAccount();
  if (state.status !== "ready") return null; // The layout shows loading and error states.
  return <Dashboard profile={state.profile} goal={state.goal} />;
}

function Dashboard({ profile, goal }: { profile: Profile; goal: Goal | null }) {
  const c = useColors();
  const { state, reload, refresh, refreshing, today } = useDashboard();
  const [now] = useState(() => new Date());
  const data = state.status === "ready" ? state.data : null;
  const log = data?.log.ok ? data.log.data : null;
  const totals = sumLoggedNutrients(log ?? []);
  const retry = () => void reload();

  return (
    <Screen edges={["top"]} refreshing={refreshing} onRefresh={() => void refresh()}>
      <Header profile={profile} now={now} entries={log?.length ?? null} />

      {!goal ? (
        <Panel title="No targets yet">
          <Text style={[s.body, { color: c.muted }]}>
            Your dashboard needs daily targets. Set them in Profile.
          </Text>
        </Panel>
      ) : (
        <>
          <Panel title="Calories today">
            {data && !data.log.ok ? (
              <PanelError error={data.log.error} onRetry={retry} />
            ) : !data ? (
              <Skeleton lines={5} />
            ) : (
              <View style={{ gap: 20 }}>
                <View style={{ alignItems: "center", gap: 16 }}>
                  <CalorieRing consumed={totals.energyKcal} target={goal.calorie_target} />
                  <CalorieFigures consumed={totals.energyKcal} target={goal.calorie_target} />
                </View>
                <View style={[s.divider, { backgroundColor: c.border }]} />
                <MacroProgress
                  protein={{ consumed: totals.proteinG, target: goal.protein_g }}
                  carbs={{ consumed: totals.carbsG, target: goal.carbs_g }}
                  fat={{ consumed: totals.fatG, target: goal.fat_g }}
                />
                {totals.hasUnknownValues && (
                  <Text style={[s.small, { color: c.muted }]}>
                    Some foods have missing nutrient values, so totals may be lower than what you
                    ate.
                  </Text>
                )}
              </View>
            )}
          </Panel>

          <QuickActions />
          <TipCard state={state} goal={goal} now={now} />
          <MealsCard state={state} onChanged={reload} onRetry={retry} />
          <WaterCard state={state} targetMl={goal.water_ml} onChanged={reload} onRetry={retry} />
          <WeightCard state={state} goal={goal} today={today} onChanged={reload} onRetry={retry} />
        </>
      )}
      <Text style={[s.tiny, { color: c.muted }]}>{NOT_MEDICAL_ADVICE}</Text>
    </Screen>
  );
}

function Header({
  profile,
  now,
  entries,
}: {
  profile: Profile;
  now: Date;
  entries: number | null;
}) {
  const c = useColors();
  const name = firstName(profile.display_name);
  const hour = now.getHours();
  const message =
    entries === null || entries === 0
      ? hour < 12
        ? "Ready to make today count?"
        : "There's still plenty of day to make count."
      : `You've logged ${entries} ${entries === 1 ? "item" : "items"} today. Keep it going.`;
  return (
    <View style={s.header}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[s.small, { color: c.muted }]}>{dateFmt.format(now)}</Text>
        <Text accessibilityRole="header" style={[s.h1, { color: c.foreground }]}>
          {greetingFor(hour)}
          {name ? `, ${name}` : ""}
        </Text>
        <Text style={[s.body, { color: c.muted }]}>{message}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Your profile"
        onPress={() => router.navigate("/profile")}
        style={[s.avatar, { backgroundColor: c.primary, borderColor: c.primarySoft }]}
      >
        <Text style={{ color: c.primaryForeground, fontFamily: FONTS.heading, fontSize: 18 }}>
          {(name ?? "?").charAt(0).toUpperCase()}
        </Text>
      </Pressable>
    </View>
  );
}

/** `href` set = the feature exists (food search, Stage 04); otherwise shown disabled as "Soon". */
const ACTIONS: { label: string; icon: LucideIcon; href?: "/food" }[] = [
  { label: "Search", icon: Search, href: "/food" },
  { label: "Describe", icon: MessageSquareText },
  { label: "Quick entry", icon: PenLine },
];

/** Logging arrives in Stages 04–05 (photo in Stage 11): shown disabled, and says so. */
function QuickActions() {
  const c = useColors();
  return (
    <View style={{ gap: 10 }}>
      <View style={s.rowBetween}>
        <Text accessibilityRole="header" style={[s.h2, { color: c.foreground }]}>
          Log food
        </Text>
        <Text style={[s.small, { color: c.muted }]}>Coming soon</Text>
      </View>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel="Snap your meal. Photo recognition is coming soon."
        style={[s.snap, { backgroundColor: c.forest }]}
      >
        <View style={[s.actionIcon, { backgroundColor: c.accent }]}>
          <Camera color={c.accentForeground} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { color: c.onForest }]}>Snap your meal</Text>
          <Text style={[s.small, { color: c.onForest, opacity: 0.8 }]}>
            Photo recognition · Soon
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            accessibilityRole="button"
            accessibilityState={{ disabled: !a.href }}
            accessibilityLabel={a.href ? `${a.label} foods` : `${a.label}. Coming soon.`}
            disabled={!a.href}
            onPress={() => a.href && router.navigate(a.href)}
            style={({ pressed }) => [
              s.action,
              { backgroundColor: c.card, borderColor: c.border },
              a.href ? { opacity: pressed ? 0.7 : 1 } : null,
            ]}
          >
            <View style={[s.actionIcon, { backgroundColor: c.primarySoft }]}>
              <a.icon color={c.primary} size={20} />
            </View>
            <Text style={[s.small, { color: c.foreground, fontFamily: FONTS.bodySemibold }]}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TipCard({ state, goal, now }: { state: DashboardState; goal: Goal; now: Date }) {
  const c = useColors();
  const data = state.status === "ready" ? state.data : null;
  const tip =
    data && data.log.ok && data.water.ok
      ? dailyTip({
          hour: now.getHours(),
          entryCount: data.log.data.length,
          totals: sumLoggedNutrients(data.log.data),
          targets: { calorieTarget: goal.calorie_target, proteinG: goal.protein_g },
          waterMl: sumWaterMl(data.water.data),
          waterTargetMl: goal.water_ml,
        })
      : null;
  if (data && !tip) return null; // a section failed; its own card shows the error
  return (
    <View style={[s.tip, { backgroundColor: c.forest }]}>
      <View style={[s.row, { gap: 8 }]}>
        <View style={[s.tipIcon, { backgroundColor: c.accent }]}>
          <Lightbulb color={c.accentForeground} size={16} />
        </View>
        <Text accessibilityRole="header" style={[s.label, { color: c.onForest }]}>
          Today&apos;s note
        </Text>
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={{
          color: c.onForest,
          fontFamily: FONTS.bodyMedium,
          fontSize: 17,
          lineHeight: 24,
        }}
      >
        {tip?.message ?? "Loading today's note…"}
      </Text>
      <Text style={[s.tiny, { color: c.onForest, opacity: 0.75 }]}>
        Based on your own logs and targets. Personalised AI insights are coming later.
      </Text>
    </View>
  );
}

const SLOT_ICONS: Record<MealSlot, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

function MealsCard({
  state,
  onChanged,
  onRetry,
}: {
  state: DashboardState;
  onChanged: () => Promise<void>;
  onRetry: () => void;
}) {
  const c = useColors();
  const data = state.status === "ready" ? state.data : null;
  return (
    <Panel title="Today's meals">
      {!data ? (
        <Skeleton lines={5} />
      ) : !data.log.ok ? (
        <PanelError error={data.log.error} onRetry={onRetry} />
      ) : (
        <View style={{ gap: 18 }}>
          {MEAL_SLOTS.map((slot) => {
            const items = groupByMealSlot(data.log.ok ? data.log.data : [])[slot];
            const Icon = SLOT_ICONS[slot];
            return (
              <View key={slot} style={{ gap: 8 }}>
                <View style={s.rowBetween}>
                  <View style={[s.row, { gap: 10 }]}>
                    <View style={[s.slotIcon, { backgroundColor: c.surface }]}>
                      <Icon color={c.primary} size={18} />
                    </View>
                    <Text accessibilityRole="header" style={[s.label, { color: c.foreground }]}>
                      {MEAL_SLOT_LABELS[slot]}
                    </Text>
                  </View>
                  {items.length > 0 && (
                    <Text
                      style={[s.small, { color: c.foreground, fontFamily: FONTS.bodySemibold }]}
                    >
                      {kcalFmt.format(sumLoggedNutrients(items).energyKcal)} kcal
                    </Text>
                  )}
                </View>
                {items.length === 0 ? (
                  <Text style={[s.small, s.empty, { color: c.muted, borderColor: c.border }]}>
                    Nothing logged for {MEAL_SLOT_LABELS[slot].toLowerCase()} yet.
                  </Text>
                ) : (
                  items.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} onChanged={onChanged} c={c} />
                  ))
                )}
              </View>
            );
          })}
        </View>
      )}
    </Panel>
  );
}

function EntryRow({
  entry,
  onChanged,
  c,
}: {
  entry: LogEntry;
  onChanged: () => Promise<void>;
  c: Colors;
}) {
  const serving = entry.serving_unit_name
    ? `${nf.format(entry.quantity)} ${entry.serving_unit_name} · ${nf.format(entry.grams)} g`
    : `${nf.format(entry.grams)} g`;
  const confirmDelete = () =>
    Alert.alert("Delete this entry?", `${entry.food_name}, ${serving}`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteLogEntry(supabase, entry.id)
            .then(onChanged)
            .catch((e: unknown) => Alert.alert("Couldn't delete", toUserMessage(e)));
        },
      },
    ]);
  return (
    <View style={[s.entry, { backgroundColor: c.surface }]}>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[s.label, { color: c.foreground }]}>
          {entry.food_name}
        </Text>
        <Text style={[s.small, { color: c.muted }]}>{serving}</Text>
      </View>
      <Text style={[s.small, { color: c.foreground, fontFamily: FONTS.bodySemibold }]}>
        {entry.energy_kcal === null ? "Unknown" : `${kcalFmt.format(entry.energy_kcal)} kcal`}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${entry.food_name}`}
        onPress={confirmDelete}
        hitSlop={8}
        style={s.iconButton}
      >
        <Trash2 color={c.muted} size={18} />
      </Pressable>
    </View>
  );
}

function WaterCard({
  state,
  targetMl,
  onChanged,
  onRetry,
}: {
  state: DashboardState;
  targetMl: number;
  onChanged: () => Promise<void>;
  onRetry: () => void;
}) {
  const data = state.status === "ready" ? state.data : null;
  return (
    <Panel title="Water">
      {!data ? (
        <Skeleton lines={3} />
      ) : !data.water.ok ? (
        <PanelError error={data.water.error} onRetry={onRetry} />
      ) : (
        <WaterTracker entries={data.water.data} targetMl={targetMl} onChanged={onChanged} />
      )}
    </Panel>
  );
}

function WaterTracker({
  entries,
  targetMl,
  onChanged,
}: {
  entries: WaterEntry[];
  targetMl: number;
  onChanged: () => Promise<void>;
}) {
  const c = useColors();
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [custom, setCustom] = useState("");
  const drunk = sumWaterMl(entries);
  const p = progressToward(drunk, targetMl);
  const last = entries.at(-1);

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setPending(key);
    setStatus(null);
    try {
      await action();
      await onChanged();
      setStatus({ kind: "success", text: success });
    } catch (e) {
      setStatus({ kind: "error", text: toUserMessage(e) });
    } finally {
      setPending(null);
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <View style={s.rowBetween}>
        <Text style={{ color: c.muted, fontFamily: FONTS.body, fontSize: 15 }}>
          <Text style={{ color: c.foreground, fontFamily: FONTS.heading, fontSize: 26 }}>
            {formatLitres(drunk)}
          </Text>{" "}
          of {formatLitres(targetMl)}
        </Text>
        <Text style={[s.small, { color: c.muted }]}>
          {p.remaining > 0 ? `${formatLitres(p.remaining)} to go` : "Target reached"}
        </Text>
      </View>
      <ProgressBar
        fraction={p.fraction}
        color={c.water}
        height={12}
        label="Water drunk today"
        valueText={`${formatLitres(drunk)} of ${formatLitres(targetMl)}, ${p.percent}%`}
      />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {WATER_PORTIONS.map((portion) => (
          <Pressable
            key={portion.id}
            accessibilityRole="button"
            accessibilityLabel={`Add a ${portion.label.toLowerCase()}, ${portion.ml} millilitres`}
            accessibilityState={{ disabled: pending !== null, busy: pending === portion.id }}
            disabled={pending !== null}
            onPress={() =>
              run(
                portion.id,
                () => addWater(supabase, { amountMl: portion.ml, unitLabel: portion.label }),
                `Added a ${portion.label.toLowerCase()} (${portion.ml} ml).`,
              )
            }
            style={({ pressed }) => [
              s.portion,
              { borderColor: c.border, backgroundColor: c.card },
              (pressed || pending === portion.id) && { opacity: 0.6 },
            ]}
          >
            <View style={[s.row, { gap: 4 }]}>
              <Droplet color={c.water} size={14} />
              <Text style={[s.small, { color: c.foreground, fontFamily: FONTS.bodySemibold }]}>
                {portion.label}
              </Text>
            </View>
            <Text style={[s.tiny, { color: c.muted }]}>{portion.ml} ml</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          accessibilityLabel="Other amount in millilitres"
          placeholder="Other amount (ml)"
          placeholderTextColor={c.muted}
          keyboardType="number-pad"
          value={custom}
          onChangeText={setCustom}
          style={[s.input, { borderColor: c.border, color: c.foreground }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add other amount"
          disabled={pending !== null}
          onPress={() => {
            const parsed = waterEntrySchema.safeParse({
              amountMl: custom.trim() === "" ? undefined : Number(custom),
            });
            if (!parsed.success) {
              setStatus({
                kind: "error",
                text: parsed.error.issues[0]?.message ?? "Enter an amount in ml",
              });
              return;
            }
            void run(
              "custom",
              () => addWater(supabase, { amountMl: parsed.data.amountMl, unitLabel: "ml" }),
              `Added ${parsed.data.amountMl} ml.`,
            ).then(() => setCustom(""));
          }}
          style={[s.addButton, { backgroundColor: c.surface }]}
        >
          <Text style={[s.small, { color: c.foreground, fontFamily: FONTS.bodySemibold }]}>
            Add
          </Text>
        </Pressable>
      </View>
      <View style={[s.rowBetween, { minHeight: 32 }]}>
        <Text
          accessibilityLiveRegion="polite"
          style={[s.small, { flex: 1, color: status?.kind === "error" ? c.destructive : c.muted }]}
        >
          {status?.text ?? (entries.length === 0 ? "No water logged yet today." : "")}
        </Text>
        {last && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Undo last, remove ${last.amount_ml} millilitres`}
            disabled={pending !== null}
            onPress={() =>
              run("undo", () => deleteWater(supabase, last.id), `Removed ${last.amount_ml} ml.`)
            }
            style={[s.row, { gap: 4, minHeight: TOUCH_TARGET, paddingHorizontal: 4 }]}
          >
            <Undo2 color={c.primary} size={16} />
            <Text style={[s.small, { color: c.primary, fontFamily: FONTS.bodySemibold }]}>
              Undo
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function WeightCard({
  state,
  goal,
  today,
  onChanged,
  onRetry,
}: {
  state: DashboardState;
  goal: Goal;
  today: string;
  onChanged: () => Promise<void>;
  onRetry: () => void;
}) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const data = state.status === "ready" ? state.data : null;
  const recent: WeightEntry[] = data?.weights.ok ? data.weights.data : [];
  const latest = data?.latestWeight.ok ? data.latestWeight.data : null;
  const points = latest && !recent.some((r) => r.id === latest.id) ? [latest, ...recent] : recent;
  const summary = summariseWeights(
    points,
    isoDaysBefore(today, DASHBOARD_WEIGHT_DAYS),
    goal.target_weight_kg,
  );
  const failed = data && (!data.weights.ok || !data.latestWeight.ok);
  const change = summary?.change ?? null;

  return (
    <Panel
      title="Weight"
      action={
        <Pressable
          accessibilityRole="link"
          onPress={() => router.navigate("/progress")}
          style={[s.row, { minHeight: TOUCH_TARGET }]}
        >
          <Text style={[s.small, { color: c.primary, fontFamily: FONTS.bodySemibold }]}>
            Progress
          </Text>
          <ChevronRight color={c.primary} size={16} />
        </Pressable>
      }
    >
      {!data ? (
        <Skeleton lines={3} />
      ) : failed ? (
        <PanelError
          error={
            !data.weights.ok
              ? data.weights.error
              : !data.latestWeight.ok
                ? data.latestWeight.error
                : null
          }
          onRetry={onRetry}
        />
      ) : (
        <View style={{ gap: 14 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {summary ? (
            <View style={{ flexDirection: "row", gap: 16 }}>
              <Stat label="Current" value={`${nf.format(summary.current.weight_kg)} kg`} />
              <Stat
                label="Target"
                value={
                  goal.target_weight_kg === null ? "—" : `${nf.format(goal.target_weight_kg)} kg`
                }
              />
              <Stat
                label={`${DASHBOARD_WEIGHT_DAYS} days`}
                value={
                  change === null
                    ? "—"
                    : `${change > 0 ? "+" : change < 0 ? "−" : ""}${nf.format(Math.abs(change))} kg`
                }
              />
            </View>
          ) : (
            <Text style={[s.small, { color: c.muted }]}>No weigh-ins yet.</Text>
          )}
          {recent.length > 1 ? (
            <WeightTrend
              entries={recent}
              targetKg={goal.target_weight_kg}
              width={width}
              height={96}
            />
          ) : (
            summary && (
              <Text style={[s.small, s.empty, { color: c.muted, borderColor: c.border }]}>
                One weigh-in so far. Log another to start your trend.
              </Text>
            )
          )}
          <WeighInForm today={today} onSaved={onChanged} />
        </View>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[s.tiny, { color: c.muted }]}>{label}</Text>
      <Text style={{ color: c.foreground, fontFamily: FONTS.headingSemibold, fontSize: 18 }}>
        {value}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingTop: 4 },
  h1: { fontSize: 28, lineHeight: 32, fontFamily: FONTS.heading, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontFamily: FONTS.headingSemibold },
  body: { fontSize: 16, lineHeight: 22, fontFamily: FONTS.body },
  label: { fontSize: 16, fontFamily: FONTS.bodySemibold },
  small: { fontSize: 14, lineHeight: 19, fontFamily: FONTS.body },
  tiny: { fontSize: 12, lineHeight: 16, fontFamily: FONTS.body },
  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  divider: { height: StyleSheet.hairlineWidth },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  snap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: RADIUS.lg + 4,
    padding: 16,
    minHeight: 72,
  },
  action: { flex: 1, borderWidth: 1, borderRadius: RADIUS.lg, padding: 12, gap: 8, opacity: 0.85 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tip: { borderRadius: RADIUS.lg + 4, padding: 18, gap: 10 },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: RADIUS.md,
    paddingLeft: 12,
    minHeight: 56,
  },
  input: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  addButton: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  portion: {
    flex: 1,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});
