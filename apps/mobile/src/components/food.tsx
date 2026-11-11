import {
  CUSTOM_FOOD_LABEL,
  VERIFICATION_LABELS,
  scaleNutrients,
  type NutrientProfile,
} from "@nutritrack/core";
import { BadgeCheck, CircleDashed, UserRound } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { FONTS, useColors } from "@/lib/theme";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

/** How trustworthy a food's values are, always shown with the food (ADR-013). */
export function VerificationBadge({
  status,
  isCustom,
}: {
  status: keyof typeof VERIFICATION_LABELS;
  isCustom: boolean;
}) {
  const c = useColors();
  const { label } = isCustom ? CUSTOM_FOOD_LABEL : VERIFICATION_LABELS[status];
  const Icon = isCustom ? UserRound : status === "verified" ? BadgeCheck : CircleDashed;
  const bg = isCustom ? c.surface : status === "verified" ? c.primarySoft : c.surface;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Icon color={status === "verified" && !isCustom ? c.primary : c.foreground} size={13} />
      <Text style={[styles.badgeText, { color: c.foreground }]}>{label}</Text>
    </View>
  );
}

const ROWS: { key: keyof NutrientProfile; label: string; unit: string; sub?: boolean }[] = [
  { key: "energyKcal", label: "Calories", unit: "kcal" },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "carbsG", label: "Carbohydrates", unit: "g" },
  { key: "fibreG", label: "of which fibre", unit: "g", sub: true },
  { key: "sugarG", label: "of which sugar", unit: "g", sub: true },
  { key: "fatG", label: "Fat", unit: "g" },
  { key: "sodiumMg", label: "Sodium", unit: "mg" },
];

/** Nutrients for a portion, scaled by packages/core. Unknown values say so, never "0". */
export function NutrientTable({ per100g, grams }: { per100g: NutrientProfile; grams: number }) {
  const c = useColors();
  const values = scaleNutrients(per100g, grams);
  return (
    <View>
      {ROWS.map((row, i) => {
        const value = values[row.key];
        const text = value === null ? "Unknown" : `${nf.format(value)} ${row.unit}`;
        return (
          <View
            key={row.key}
            accessible
            accessibilityLabel={`${row.label}: ${text}`}
            style={[
              styles.row,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
            ]}
          >
            <Text
              style={{
                paddingLeft: row.sub ? 14 : 0,
                color: row.sub ? c.muted : c.foreground,
                fontFamily: row.sub ? FONTS.body : FONTS.bodyMedium,
                fontSize: 15,
              }}
            >
              {row.label}
            </Text>
            <Text
              style={{
                color: value === null ? c.muted : c.foreground,
                fontFamily: i === 0 ? FONTS.heading : FONTS.body,
                fontSize: i === 0 ? 18 : 15,
              }}
            >
              {text}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 12, fontFamily: FONTS.bodySemibold },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
});
