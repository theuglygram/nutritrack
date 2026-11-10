import { useColorScheme } from "react-native";

/** Colours follow the system light/dark setting, matching the web app's palette. */
const light = {
  background: "#FFFFFF",
  card: "#FFFFFF",
  foreground: "#171717",
  muted: "#52525B",
  border: "#E4E4E7",
  primary: "#171717",
  primaryForeground: "#FAFAFA",
  destructive: "#DC2626",
  success: "#15803D",
  surface: "#F4F4F5",
};

const dark: typeof light = {
  background: "#0A0A0A",
  card: "#171717",
  foreground: "#EDEDED",
  muted: "#A1A1AA",
  border: "#3F3F46",
  primary: "#EDEDED",
  primaryForeground: "#171717",
  destructive: "#F87171",
  success: "#4ADE80",
  surface: "#27272A",
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

/** Minimum touch target (WCAG / platform guidance). */
export const TOUCH_TARGET = 48;
