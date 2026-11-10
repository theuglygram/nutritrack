import { APP_NAME, APP_TAGLINE } from "@nutritrack/core";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const isDark = useColorScheme() === "dark";
  const foreground = isDark ? "#EDEDED" : "#171717";
  const muted = isDark ? "#A1A1AA" : "#52525B";

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? "#0A0A0A" : "#FFFFFF" }]}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: foreground }]}>
          {APP_NAME}
        </Text>
        <Text style={[styles.tagline, { color: muted }]}>{APP_TAGLINE}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: { fontSize: 32, fontWeight: "700" },
  tagline: { fontSize: 17, lineHeight: 24, textAlign: "center", maxWidth: 360 },
});
