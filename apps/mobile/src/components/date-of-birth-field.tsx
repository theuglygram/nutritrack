import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { TOUCH_TARGET, useColors } from "@/lib/theme";

/**
 * Date of birth as Day / Month / Year (the order Nigerian users write dates), producing an ISO
 * YYYY-MM-DD string for validation. No native date-picker dependency needed.
 */
export function DateOfBirthField({
  value,
  onChange,
  error,
  description,
}: {
  value: string;
  onChange: (iso: string) => void;
  error?: string | undefined;
  description?: string;
}) {
  const c = useColors();
  const [initialY, initialM, initialD] = value ? value.split("-") : ["", "", ""];
  const [day, setDay] = useState(initialD ?? "");
  const [month, setMonth] = useState(initialM ?? "");
  const [year, setYear] = useState(initialY ?? "");

  function update(d: string, m: string, y: string) {
    setDay(d);
    setMonth(m);
    setYear(y);
    // Incomplete input becomes "", which validation reports as "Enter a valid date".
    const complete = d.length > 0 && m.length > 0 && y.length === 4;
    onChange(complete ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "");
  }

  const input = [
    styles.input,
    { color: c.foreground, borderColor: error ? c.destructive : c.border },
  ];
  const hint = [description, error].filter(Boolean).join(". ") || undefined;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.foreground }]}>Date of birth</Text>
      <View style={styles.row}>
        <TextInput
          accessibilityLabel="Day of birth"
          accessibilityHint={hint}
          placeholder="DD"
          placeholderTextColor={c.muted}
          keyboardType="number-pad"
          maxLength={2}
          value={day}
          onChangeText={(t) => update(t.replace(/\D/g, ""), month, year)}
          style={input}
        />
        <TextInput
          accessibilityLabel="Month of birth"
          placeholder="MM"
          placeholderTextColor={c.muted}
          keyboardType="number-pad"
          maxLength={2}
          value={month}
          onChangeText={(t) => update(day, t.replace(/\D/g, ""), year)}
          style={input}
        />
        <TextInput
          accessibilityLabel="Year of birth"
          placeholder="YYYY"
          placeholderTextColor={c.muted}
          keyboardType="number-pad"
          maxLength={4}
          value={year}
          onChangeText={(t) => update(day, month, t.replace(/\D/g, ""))}
          style={[input, styles.year]}
        />
      </View>
      {description && <Text style={[styles.small, { color: c.muted }]}>{description}</Text>}
      {error && (
        <Text accessibilityLiveRegion="polite" style={[styles.small, { color: c.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: "center",
  },
  year: { flex: 1.5 },
  small: { fontSize: 14, lineHeight: 19 },
});
