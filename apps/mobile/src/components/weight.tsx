import { logWeight, toUserMessage, type WeightEntry } from "@nutritrack/api-client";
import { weightEntrySchema } from "@nutritrack/schemas";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { FONTS, RADIUS, TOUCH_TARGET, useColors } from "@/lib/theme";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

/** Weigh-ins as a line with the target as a dashed line. Needs at least two entries. */
export function WeightTrend({
  entries,
  targetKg,
  width,
  height = 120,
}: {
  entries: WeightEntry[];
  targetKg: number | null;
  width: number;
  height?: number;
}) {
  const c = useColors();
  if (entries.length < 2 || width <= 0) return null;
  const values = entries.map((e) => e.weight_kg).concat(targetKg ?? []);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const pad = 8;
  const x = (i: number) => pad + (i / (entries.length - 1)) * (width - pad * 2);
  const y = (v: number) => pad + ((max - v) / (max - min)) * (height - pad * 2);
  const d = entries
    .map((e, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(e.weight_kg).toFixed(1)}`)
    .join(" ");
  const first = entries[0] as WeightEntry;
  const last = entries[entries.length - 1] as WeightEntry;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Weight trend: ${entries.length} weigh-ins, from ${nf.format(first.weight_kg)} kg on ${first.measured_on} to ${nf.format(last.weight_kg)} kg on ${last.measured_on}${targetKg ? `. Target ${nf.format(targetKg)} kg` : ""}.`}
    >
      <Svg width={width} height={height}>
        {targetKg !== null && (
          <Line
            x1={0}
            x2={width}
            y1={y(targetKg)}
            y2={y(targetKg)}
            stroke={c.carbs}
            strokeWidth={1.5}
            strokeDasharray="6 5"
          />
        )}
        <Path d={d} stroke={c.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        {entries.map((e, i) => (
          <Circle
            key={e.id}
            cx={x(i)}
            cy={y(e.weight_kg)}
            r={i === entries.length - 1 ? 4.5 : 2.5}
            fill={c.primary}
          />
        ))}
      </Svg>
    </View>
  );
}

/** Today's weigh-in. Saving again the same day replaces the entry. */
export function WeighInForm({ today, onSaved }: { today: string; onSaved: () => Promise<void> }) {
  const c = useColors();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function submit() {
    const parsed = weightEntrySchema(today).safeParse({
      weightKg: value.trim() === "" ? undefined : Number(value.replace(",", ".")),
      measuredOn: today,
    });
    if (!parsed.success) {
      setStatus({
        kind: "error",
        text: parsed.error.issues[0]?.message ?? "Enter your weight in kg",
      });
      return;
    }
    setPending(true);
    setStatus(null);
    try {
      await logWeight(supabase, parsed.data, today);
      await onSaved();
      setValue("");
      setStatus({
        kind: "success",
        text: `Saved ${nf.format(parsed.data.weightKg)} kg for today.`,
      });
    } catch (e) {
      setStatus({ kind: "error", text: toUserMessage(e) });
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          accessibilityLabel="Today's weight in kilograms"
          placeholder="Today's weight (kg)"
          placeholderTextColor={c.muted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          style={{
            flex: 1,
            minHeight: TOUCH_TARGET,
            borderWidth: 1,
            borderColor: status?.kind === "error" ? c.destructive : c.border,
            borderRadius: RADIUS.md,
            paddingHorizontal: 12,
            fontSize: 16,
            fontFamily: FONTS.body,
            color: c.foreground,
          }}
        />
        <Button label="Save" loading={pending} loadingLabel="Saving…" onPress={submit} />
      </View>
      {status && (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            fontSize: 14,
            fontFamily: FONTS.body,
            color: status.kind === "error" ? c.destructive : c.muted,
          }}
        >
          {status.text}
        </Text>
      )}
    </View>
  );
}
