// Keeps the web CSS variables in step with the shared brand tokens in packages/core, and checks
// that every text/background pair meets WCAG AA contrast. Run: pnpm --filter @nutritrack/web test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
// Imported by path: Node strips TypeScript types itself, but not from inside node_modules.
import { BRAND_COLORS } from "../../../packages/core/src/brand.ts";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

/** camelCase token → --brand-kebab-case CSS variable. */
const cssVar = (name) => `--brand-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

function block(selectorStart) {
  const start = css.indexOf(selectorStart);
  assert.notEqual(start, -1, `globals.css is missing ${selectorStart}`);
  return css.slice(start, css.indexOf("}", start));
}

for (const [mode, selector] of [
  ["light", ":root {"],
  ["dark", "/* dark-brand */"],
]) {
  test(`globals.css ${mode} brand variables match packages/core`, () => {
    const body = block(selector);
    for (const [name, value] of Object.entries(BRAND_COLORS[mode])) {
      const match = new RegExp(`${cssVar(name)}:[ ]*(#[0-9a-fA-F]{6})`).exec(body);
      assert.ok(match, `${cssVar(name)} missing in ${mode} block`);
      assert.equal(match[1].toUpperCase(), value.toUpperCase(), `${cssVar(name)} (${mode})`);
    }
  });
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT_PAIRS = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "surface"],
  ["muted", "background"],
  ["muted", "card"],
  ["muted", "surface"],
  ["primary", "background"],
  ["primary", "card"],
  ["primaryForeground", "primary"],
  ["accentForeground", "accent"],
  ["destructive", "card"],
  ["onForest", "forest"],
];

for (const mode of ["light", "dark"]) {
  test(`${mode} text colours meet WCAG AA (4.5:1)`, () => {
    const p = BRAND_COLORS[mode];
    for (const [fg, bg] of TEXT_PAIRS) {
      const ratio = contrast(p[fg], p[bg]);
      assert.ok(ratio >= 4.5, `${fg} on ${bg} (${mode}) is ${ratio.toFixed(2)}:1`);
    }
  });

  test(`${mode} chart colours are visible against cards (3:1, WCAG 1.4.11)`, () => {
    const p = BRAND_COLORS[mode];
    for (const name of ["primary", "protein", "carbs", "fat", "water"]) {
      const ratio = contrast(p[name], p.card);
      assert.ok(ratio >= 3, `${name} on card (${mode}) is ${ratio.toFixed(2)}:1`);
    }
  });
}
