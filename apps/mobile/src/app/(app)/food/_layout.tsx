import { Stack } from "expo-router";
import { FONTS, useColors } from "@/lib/theme";

/** Food tab: search, food detail and "add your own food" stacked inside the tab. */
export default function FoodLayout() {
  const c = useColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.foreground,
        headerTitleStyle: { fontFamily: FONTS.bodySemibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Food" }} />
      <Stack.Screen name="new" options={{ title: "Add your own food" }} />
    </Stack>
  );
}
