import { progressToward } from "@nutritrack/core";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { FONTS, useColors } from "@/lib/theme";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });
const kcalFmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/** Calories against target as a ring. The numbers are also text, read out as one summary. */
export function CalorieRing({
  consumed,
  target,
  size = 200,
}: {
  consumed: number;
  target: number;
  size?: number;
}) {
  const c = useColors();
  const p = progressToward(consumed, target);
  const over = p.over > 0;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        over
          ? `${kcalFmt.format(p.over)} calories over your ${kcalFmt.format(target)} calorie target`
          : `${kcalFmt.format(p.remaining)} calories left of ${kcalFmt.format(target)}`
      }
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.surface}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={over ? c.carbs : c.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - p.fraction)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={[styles.ringValue, { color: c.foreground, fontSize: size / 4.4 }]}>
        {kcalFmt.format(over ? p.over : p.remaining)}
      </Text>
      <Text style={[styles.small, { color: c.muted }]}>{over ? "kcal over" : "kcal left"}</Text>
    </View>
  );
}

export function CalorieFigures({ consumed, target }: { consumed: number; target: number }) {
  const c = useColors();
  const p = progressToward(consumed, target);
  const items = [
    { label: "Eaten", value: `${kcalFmt.format(consumed)} kcal` },
    { label: "Target", value: `${kcalFmt.format(target)} kcal` },
    { label: "Of target", value: `${p.percent}%` },
  ];
  return (
    <View style={styles.figures}>
      {items.map((item) => (
        <View key={item.label} style={styles.figure}>
          <Text style={[styles.overline, { color: c.muted }]}>{item.label.toUpperCase()}</Text>
          <Text style={[styles.figureValue, { color: c.foreground }]}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function ProgressBar({
  fraction,
  color,
  label,
  valueText,
  height = 8,
}: {
  fraction: number;
  color: string;
  label: string;
  valueText: string;
  height?: number;
}) {
  const c = useColors();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100), text: valueText }}
      style={{ height, borderRadius: height, backgroundColor: c.surface, overflow: "hidden" }}
    >
      <View
        style={{
          width: `${fraction * 100}%`,
          height,
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

type MacroValue = { consumed: number; target: number };

export function MacroProgress({
  protein,
  carbs,
  fat,
}: {
  protein: MacroValue;
  carbs: MacroValue;
  fat: MacroValue;
}) {
  const c = useColors();
  const macros = [
    { label: "Protein", color: c.protein, ...protein },
    { label: "Carbs", color: c.carbs, ...carbs },
    { label: "Fat", color: c.fat, ...fat },
  ];
  return (
    <View style={{ gap: 16 }}>
      {macros.map((m) => {
        const p = progressToward(m.consumed, m.target);
        return (
          <View key={m.label} style={{ gap: 6 }}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: m.color }]} />
                <Text style={[styles.label, { color: c.foreground }]}>{m.label}</Text>
              </View>
              <Text style={[styles.small, { color: c.muted }]}>
                <Text style={{ color: c.foreground, fontFamily: FONTS.bodySemibold }}>
                  {nf.format(m.consumed)}
                </Text>{" "}
                / {nf.format(m.target)} g
              </Text>
            </View>
            <ProgressBar
              fraction={p.fraction}
              color={m.color}
              label={`${m.label} eaten`}
              valueText={`${nf.format(m.consumed)} of ${nf.format(m.target)} grams, ${p.percent}%`}
            />
            <View style={styles.rowBetween}>
              <Text style={[styles.tiny, { color: c.muted }]}>
                {p.over > 0 ? `${nf.format(p.over)} g over` : `${nf.format(p.remaining)} g left`}
              </Text>
              <Text style={[styles.tiny, { color: c.muted }]}>{p.percent}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ringValue: { fontFamily: FONTS.heading, letterSpacing: -1 },
  small: { fontSize: 14, fontFamily: FONTS.body },
  tiny: { fontSize: 12, fontFamily: FONTS.body },
  label: { fontSize: 15, fontFamily: FONTS.bodyMedium },
  overline: { fontSize: 11, fontFamily: FONTS.bodyMedium, letterSpacing: 0.8 },
  figures: { flexDirection: "row", gap: 20, justifyContent: "center" },
  figure: { gap: 2 },
  figureValue: { fontSize: 17, fontFamily: FONTS.headingSemibold },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
