import { router } from "expo-router";
import { Check, type LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Button, Heading, Screen } from "@/components/ui";
import { FONTS, RADIUS, useColors } from "@/lib/theme";

/** An honest screen for a tab that isn't built yet: what it will do, no pretend controls. */
export function ComingSoon({
  title,
  description,
  icon: Icon,
  planned,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  planned: string[];
}) {
  const c = useColors();
  return (
    <Screen edges={["top"]}>
      <Heading>{title}</Heading>
      <Text style={[styles.body, { color: c.muted }]}>{description}</Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={[styles.icon, { backgroundColor: c.primarySoft }]}>
          <Icon color={c.primary} size={32} />
        </View>
        <View style={[styles.pill, { backgroundColor: c.surface }]}>
          <View style={[styles.dot, { backgroundColor: c.carbs }]} />
          <Text style={[styles.pillText, { color: c.foreground }]}>Coming soon</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.h2, { color: c.foreground }]}>
          What you&apos;ll be able to do
        </Text>
        {planned.map((item) => (
          <View key={item} style={styles.item}>
            <Check color={c.primary} size={20} />
            <Text style={[styles.body, { flex: 1, color: c.foreground }]}>{item}</Text>
          </View>
        ))}
      </View>
      <Button label="Back to today" variant="outline" onPress={() => router.navigate("/")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: RADIUS.lg + 4, padding: 20, gap: 14 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontSize: 14, fontFamily: FONTS.bodySemibold },
  dot: { width: 8, height: 8, borderRadius: 4 },
  h2: { fontSize: 20, fontFamily: FONTS.headingSemibold },
  body: { fontSize: 16, lineHeight: 23, fontFamily: FONTS.body },
  item: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
});
