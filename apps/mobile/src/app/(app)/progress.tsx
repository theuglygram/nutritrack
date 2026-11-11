import {
  deleteWater,
  deleteWeight,
  getWaterForDay,
  getWeightHistory,
  localIsoDate,
  toUserMessage,
  type WaterEntry,
  type WeightEntry,
} from "@nutritrack/api-client";
import { formatLitres, isoDaysBefore, summariseWeights, sumWaterMl } from "@nutritrack/core";
import { Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Panel, PanelError, Skeleton } from "@/components/panel";
import { Heading, Screen } from "@/components/ui";
import { WeighInForm, WeightTrend } from "@/components/weight";
import { useAccount } from "@/lib/account";
import { supabase } from "@/lib/supabase";
import { FONTS, RADIUS, TOUCH_TARGET, useColors } from "@/lib/theme";

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
] as const;

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });
const dayFmt = new Intl.DateTimeFormat("en-NG", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const timeFmt = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" });

type Load<T> =
  { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: T };

function settle<T>(p: Promise<T>): Promise<Load<T>> {
  return p.then(
    (data) => ({ status: "ready", data }),
    (error: unknown) => ({ status: "error", error }),
  );
}

export default function ProgressScreen() {
  const c = useColors();
  const { state: account } = useAccount();
  const [today] = useState(() => localIsoDate());
  const [days, setDays] = useState<number>(90);
  const [weights, setWeights] = useState<Load<WeightEntry[]>>({ status: "loading" });
  const [water, setWater] = useState<Load<WaterEntry[]>>({ status: "loading" });
  const [width, setWidth] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeights = useCallback(
    () => settle(getWeightHistory(supabase, today, days)),
    [today, days],
  );
  const fetchWater = useCallback(() => settle(getWaterForDay(supabase, new Date())), []);

  useEffect(() => {
    let cancelled = false;
    void fetchWeights().then((next) => !cancelled && setWeights(next));
    return () => {
      cancelled = true;
    };
  }, [fetchWeights]);

  useEffect(() => {
    let cancelled = false;
    void fetchWater().then((next) => !cancelled && setWater(next));
    return () => {
      cancelled = true;
    };
  }, [fetchWater]);

  const reloadWeights = async () => setWeights(await fetchWeights());
  const reloadWater = async () => setWater(await fetchWater());

  if (account.status !== "ready") return null;
  const goal = account.goal;
  const targetKg = goal?.target_weight_kg ?? null;
  const summary =
    weights.status === "ready"
      ? summariseWeights(weights.data, isoDaysBefore(today, days), targetKg)
      : null;

  const confirmDelete = (title: string, onConfirm: () => Promise<void>) =>
    Alert.alert(title, undefined, [
      { text: "Keep", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          onConfirm().catch((e: unknown) => Alert.alert("Couldn't delete", toUserMessage(e)));
        },
      },
    ]);

  return (
    <Screen
      edges={["top"]}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void Promise.all([reloadWeights(), reloadWater()]).finally(() => setRefreshing(false));
      }}
    >
      <Heading>Progress</Heading>

      <Panel title="Weight trend">
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Time range"
          style={[styles.segment, { backgroundColor: c.surface }]}
        >
          {RANGES.map((r) => {
            const selected = days === r.days;
            return (
              <Pressable
                key={r.days}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setWeights({ status: "loading" });
                  setDays(r.days);
                }}
                style={[styles.segmentItem, selected && { backgroundColor: c.card }]}
              >
                <Text
                  style={{
                    fontFamily: selected ? FONTS.bodySemibold : FONTS.body,
                    color: selected ? c.foreground : c.muted,
                  }}
                >
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {weights.status === "loading" ? (
          <Skeleton lines={4} />
        ) : weights.status === "error" ? (
          <PanelError error={weights.error} onRetry={() => void reloadWeights()} />
        ) : !summary ? (
          <Text style={[styles.small, styles.empty, { color: c.muted, borderColor: c.border }]}>
            No weigh-ins in this period. Log one below to start your trend.
          </Text>
        ) : (
          <View style={{ gap: 14 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            <View style={styles.figures}>
              <Figure label="Current" value={`${nf.format(summary.current.weight_kg)} kg`} />
              <Figure
                label="Target"
                value={targetKg === null ? "Not set" : `${nf.format(targetKg)} kg`}
              />
              <Figure
                label="Change"
                value={
                  summary.change === null
                    ? "—"
                    : `${summary.change > 0 ? "+" : summary.change < 0 ? "−" : ""}${nf.format(Math.abs(summary.change))} kg`
                }
              />
              <Figure
                label="To target"
                value={summary.toTarget === null ? "—" : `${nf.format(summary.toTarget)} kg`}
              />
            </View>
            {weights.data.length > 1 ? (
              <WeightTrend entries={weights.data} targetKg={targetKg} width={width} height={180} />
            ) : (
              <Text style={[styles.small, styles.empty, { color: c.muted, borderColor: c.border }]}>
                One weigh-in so far. Your trend line appears after your next one.
              </Text>
            )}
          </View>
        )}
      </Panel>

      <Panel title="Log a weigh-in">
        <Text style={[styles.small, { color: c.muted }]}>
          One weigh-in per day. Saving again today replaces today&apos;s entry.
        </Text>
        <WeighInForm today={today} onSaved={reloadWeights} />
        {weights.status === "ready" &&
          [...weights.data]
            .reverse()
            .slice(0, 10)
            .map((w) => (
              <Row
                key={w.id}
                label={dayFmt.format(new Date(`${w.measured_on}T00:00:00Z`))}
                value={`${nf.format(w.weight_kg)} kg`}
                deleteLabel={`Delete weigh-in from ${w.measured_on}`}
                onDelete={() =>
                  confirmDelete("Delete this weigh-in?", async () => {
                    await deleteWeight(supabase, w.id);
                    await reloadWeights();
                  })
                }
              />
            ))}
      </Panel>

      <Panel title="Water today">
        {water.status === "loading" ? (
          <Skeleton lines={3} />
        ) : water.status === "error" ? (
          <PanelError error={water.error} onRetry={() => void reloadWater()} />
        ) : water.data.length === 0 ? (
          <Text style={[styles.small, { color: c.muted }]}>
            No water logged yet today. Add some from Home.
          </Text>
        ) : (
          <>
            <Text style={{ color: c.muted, fontFamily: FONTS.body }}>
              <Text style={{ color: c.foreground, fontFamily: FONTS.heading, fontSize: 26 }}>
                {formatLitres(sumWaterMl(water.data))}
              </Text>
              {goal ? ` of ${formatLitres(goal.water_ml)}` : ""}
            </Text>
            {[...water.data].reverse().map((w) => {
              const time = timeFmt.format(new Date(w.logged_at));
              return (
                <Row
                  key={w.id}
                  label={`${time}${w.unit_label && w.unit_label !== "ml" ? ` · ${w.unit_label}` : ""}`}
                  value={`${w.amount_ml} ml`}
                  deleteLabel={`Delete ${w.amount_ml} millilitres logged at ${time}`}
                  onDelete={() =>
                    confirmDelete("Delete this water entry?", async () => {
                      await deleteWater(supabase, w.id);
                      await reloadWater();
                    })
                  }
                />
              );
            })}
          </>
        )}
      </Panel>
    </Screen>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={[styles.figure, { backgroundColor: c.surface }]}>
      <Text style={[styles.small, { color: c.muted }]}>{label}</Text>
      <Text style={{ color: c.foreground, fontFamily: FONTS.headingSemibold, fontSize: 20 }}>
        {value}
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  deleteLabel,
  onDelete,
}: {
  label: string;
  value: string;
  deleteLabel: string;
  onDelete: () => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.row, { borderTopColor: c.border }]}>
      <Text style={[styles.small, { flex: 1, color: c.muted }]}>{label}</Text>
      <Text style={{ color: c.foreground, fontFamily: FONTS.bodySemibold }}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        onPress={onDelete}
        style={styles.iconButton}
      >
        <Trash2 color={c.muted} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  small: { fontSize: 14, lineHeight: 19, fontFamily: FONTS.body },
  empty: { borderWidth: 1, borderStyle: "dashed", borderRadius: RADIUS.md, padding: 14 },
  segment: { flexDirection: "row", borderRadius: RADIUS.md, padding: 4 },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.sm,
  },
  figures: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  figure: { flexBasis: "47%", flexGrow: 1, borderRadius: RADIUS.md, padding: 12, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconButton: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
});
