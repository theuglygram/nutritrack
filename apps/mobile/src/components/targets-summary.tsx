import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/lib/theme";

type Targets = {
  calorieTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
};

const nf = new Intl.NumberFormat("en-NG");

/** Daily targets: calories prominent, then macros and water (same layout as web). */
export function TargetsSummary({ targets }: { targets: Targets }) {
  const c = useColors();
  const items = [
    { label: "Protein", value: `${nf.format(targets.proteinG)} g` },
    { label: "Carbs", value: `${nf.format(targets.carbsG)} g` },
    { label: "Fat", value: `${nf.format(targets.fatG)} g` },
    { label: "Water", value: `${(targets.waterMl / 1000).toFixed(1)} L` },
  ];
  return (
    <View style={styles.wrap}>
      <Text
        accessibilityLabel={`${nf.format(targets.calorieTarget)} kilocalories a day`}
        style={{ color: c.foreground }}
      >
        <Text style={styles.kcal}>{nf.format(targets.calorieTarget)}</Text>
        <Text style={{ color: c.muted }}> kcal a day</Text>
      </Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <View
            key={item.label}
            accessible
            accessibilityLabel={`${item.label} ${item.value}`}
            style={[styles.tile, { borderColor: c.border }]}
          >
            <Text style={[styles.tileLabel, { color: c.muted }]}>{item.label}</Text>
            <Text style={[styles.tileValue, { color: c.foreground }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  kcal: { fontSize: 36, fontWeight: "700", fontVariant: ["tabular-nums"] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { flexBasis: "47%", flexGrow: 1, borderWidth: 1, borderRadius: 10, padding: 12 },
  tileLabel: { fontSize: 14 },
  tileValue: { fontSize: 18, fontWeight: "600", fontVariant: ["tabular-nums"] },
});
