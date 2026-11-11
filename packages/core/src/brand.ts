/**
 * NutriTrack brand tokens, the single source of truth for both apps (ADR-033).
 * Mobile reads these directly; the web app mirrors them as CSS variables in
 * apps/web/src/app/globals.css, and brand.test.ts fails if the two drift apart.
 *
 * Text/background pairs are chosen to meet WCAG AA (4.5:1) — see brand.test.ts.
 */
export const BRAND_COLORS = {
  light: {
    background: "#FAF7F0", // warm cream
    card: "#FFFFFF",
    surface: "#F1ECE0",
    foreground: "#1C1F1A", // charcoal
    muted: "#596155",
    border: "#E4DDCC",
    primary: "#14532D", // deep forest green
    primaryForeground: "#FAF7F0",
    primarySoft: "#E2EDDF",
    accent: "#A3E635", // fresh lime
    accentForeground: "#1C1F1A",
    destructive: "#B42318",
    protein: "#1F7A4C",
    carbs: "#A87308",
    fat: "#C2410C",
    water: "#1D7FA6",
    forest: "#14532D", // feature panels stay deep green in both modes
    onForest: "#FAF7F0",
  },
  dark: {
    background: "#0E1410",
    card: "#161D18",
    surface: "#1E2620",
    foreground: "#ECEFE8",
    muted: "#A4AD9F",
    border: "#2B342D",
    primary: "#8FD3A2",
    primaryForeground: "#0E1410",
    primarySoft: "#1D3325",
    accent: "#BEF264",
    accentForeground: "#0E1410",
    destructive: "#F97066",
    protein: "#6FCF97",
    carbs: "#F2C14E",
    fat: "#F4895E",
    water: "#6CC3E8",
    forest: "#163D27",
    onForest: "#FAF7F0",
  },
} as const;

export type BrandColorName = keyof (typeof BRAND_COLORS)["light"];
export type BrandPalette = Record<BrandColorName, string>;

/** Corner radii in px. Kept small: cards are softly rounded, not pill-shaped. */
export const BRAND_RADIUS = { sm: 8, md: 12, lg: 16, xl: 24 } as const;

/** Font families: a characterful display face for headings, a neutral face for reading. */
export const BRAND_FONTS = {
  heading: "Bricolage Grotesque",
  body: "Inter",
} as const;
