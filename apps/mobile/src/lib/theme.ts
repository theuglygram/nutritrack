import { BRAND_COLORS, BRAND_RADIUS } from "@nutritrack/core";
import { useColorScheme } from "react-native";

/**
 * Colours follow the system light/dark setting and come from the shared brand tokens in
 * packages/core (the web app mirrors the same values as CSS variables).
 */
function palette(mode: "light" | "dark") {
  const b = BRAND_COLORS[mode];
  return {
    background: b.background,
    card: b.card,
    surface: b.surface,
    foreground: b.foreground,
    muted: b.muted,
    border: b.border,
    primary: b.primary,
    primaryForeground: b.primaryForeground,
    primarySoft: b.primarySoft,
    accent: b.accent,
    accentForeground: b.accentForeground,
    destructive: b.destructive,
    success: b.primary,
    protein: b.protein,
    carbs: b.carbs,
    fat: b.fat,
    water: b.water,
    forest: b.forest,
    onForest: b.onForest,
  };
}

const light = palette("light");
const dark = palette("dark");

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

/** Minimum touch target (WCAG / platform guidance). */
export const TOUCH_TARGET = 48;

export const RADIUS = BRAND_RADIUS;

/**
 * Loaded in the root layout. React Native picks a font file by family name, so each weight is
 * its own family; don't combine these with fontWeight (Android would synthesise bold).
 */
export const FONTS = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  heading: "BricolageGrotesque_700Bold",
  headingSemibold: "BricolageGrotesque_600SemiBold",
} as const;
