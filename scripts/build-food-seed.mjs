// Builds supabase/seed.sql (the global food catalogue) from curated selections and USDA data.
//
//   node scripts/build-food-seed.mjs            regenerate supabase/seed.sql
//   node scripts/build-food-seed.mjs --find yam list USDA SR Legacy foods matching "yam"
//
// Inputs (committed, reviewed by humans):
//   supabase/food-data/usda-foods.json   which USDA foods to import, display names, local names
//   supabase/food-data/recipes.json      composite dishes from documented recipes (ADR-013)
// USDA FoodData Central SR Legacy (public domain, CC0) is downloaded once into .cache/usda.
// Output is deterministic (stable ids and ordering) so seed.sql diffs are reviewable.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// Imported by path: Node strips TypeScript types itself (not from inside node_modules).
import { recipePer100g } from "../packages/core/src/recipes.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CACHE = join(ROOT, ".cache", "usda");
const USDA_ZIP_URL =
  "https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip";

export const USDA_SOURCE = {
  name: "USDA FoodData Central — SR Legacy (April 2018)",
  citation:
    "U.S. Department of Agriculture, Agricultural Research Service. FoodData Central: SR Legacy, 2018. fdc.nal.usda.gov",
  url: "https://fdc.nal.usda.gov/",
  licence: "CC0 1.0 (public domain)",
  notes:
    "General ingredient values, not Nigerian-specific analyses. Imported by scripts/build-food-seed.mjs.",
};

// USDA nutrient ids → our per-100 g columns (ADR-011: missing stays null).
const NUTRIENTS = {
  1008: "energy_kcal",
  1003: "protein_g",
  1005: "carbs_g",
  1004: "fat_g",
  1079: "fibre_g",
  2000: "sugar_g",
  1093: "sodium_mg",
};

// Column order for SQL inserts. (Never use Object.values(NUTRIENTS): JavaScript orders numeric
// keys ascending, which would put values in the wrong columns.)
const COLUMNS = ["energy_kcal", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g", "sodium_mg"];

/**
 * Energy should roughly match 4 kcal/g protein and available carbs and 9 kcal/g fat. A big mismatch means
 * a mapping or data error, so the build stops. (Fibre, alcohol and USDA's specific factors
 * explain small differences, hence the generous tolerance.)
 */
function assertEnergyPlausible(label, n) {
  const { energy_kcal: kcal, protein_g: p, carbs_g: c, fat_g: f } = n;
  if ([kcal, p, c, f].some((v) => v === undefined || v === null)) return;
  // Fibre is counted in USDA carbohydrate "by difference" but provides little energy.
  const fromMacros = 4 * p + 4 * (c - (n.fibre_g ?? 0)) + 9 * f;
  if (Math.abs(kcal - fromMacros) > 20 + 0.2 * fromMacros) {
    throw new Error(
      `${label}: energy ${kcal} kcal doesn't match macros (≈${Math.round(fromMacros)} kcal)`,
    );
  }
}

// USDA portion "modifier" text → our serving unit names. Anything else is skipped.
const PORTION_UNITS = {
  cup: "cup",
  tbsp: "tablespoon",
  tablespoon: "tablespoon",
  tsp: "teaspoon",
  teaspoon: "teaspoon",
  slice: "slice",
  slices: "slice",
  piece: "piece",
  pieces: "piece",
  small: "small",
  medium: "medium",
  large: "large",
  fillet: "fillet",
};

/** Minimal RFC 4180 CSV parser (quoted fields, doubled quotes). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body
    .filter((r) => r.length > 1)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

function usdaDir() {
  const existing =
    existsSync(CACHE) && readdirSync(CACHE).find((d) => d.startsWith("FoodData_Central"));
  if (existing) return join(CACHE, existing);
  mkdirSync(CACHE, { recursive: true });
  const zip = join(CACHE, "sr.zip");
  console.log(`Downloading USDA SR Legacy (≈6 MB) to ${CACHE} …`);
  execFileSync("curl", ["-sSfL", "-o", zip, USDA_ZIP_URL], { stdio: "inherit" });
  // Windows ships bsdtar (reads zip); elsewhere use unzip.
  if (process.platform === "win32") {
    const tar = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
    execFileSync(tar, ["-xf", "sr.zip"], { cwd: CACHE, stdio: "inherit" });
  } else {
    execFileSync("unzip", ["-q", "-o", "sr.zip"], { cwd: CACHE, stdio: "inherit" });
  }
  const dir = readdirSync(CACHE).find((d) => d.startsWith("FoodData_Central"));
  if (!dir) throw new Error("USDA archive did not contain the expected folder");
  return join(CACHE, dir);
}

const read = (dir, file) => parseCsv(readFileSync(join(dir, file), "utf8"));

/** Stable UUID (v5-style layout) from a key, so re-running the build never changes ids. */
function stableId(key) {
  const h = createHash("sha1").update(`nutritrack:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const sql = (v) =>
  v === null || v === undefined
    ? "null"
    : typeof v === "number"
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;

const round2 = (n) => Math.round(n * 100) / 100;

function loadUsda() {
  const dir = usdaDir();
  const foods = new Map(read(dir, "food.csv").map((f) => [f.fdc_id, f]));
  const nutrients = new Map();
  for (const n of read(dir, "food_nutrient.csv")) {
    const column = NUTRIENTS[n.nutrient_id];
    if (!column) continue;
    if (!nutrients.has(n.fdc_id)) nutrients.set(n.fdc_id, {});
    nutrients.get(n.fdc_id)[column] = Number(n.amount);
  }
  const portions = new Map();
  for (const p of read(dir, "food_portion.csv")) {
    if (!portions.has(p.fdc_id)) portions.set(p.fdc_id, []);
    portions.get(p.fdc_id).push(p);
  }
  return { foods, nutrients, portions };
}

/** Lists USDA foods matching each "|"-separated term (one parse for many terms). */
function find(terms) {
  const { foods, nutrients } = loadUsda();
  for (const term of terms
    .split("|")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)) {
    console.log(`## ${term}`);
    let shown = 0;
    for (const f of foods.values()) {
      if (!f.description.toLowerCase().includes(term) || shown >= 6) continue;
      shown++;
      const kcal = nutrients.get(f.fdc_id)?.energy_kcal;
      console.log(`${f.fdc_id}\t${kcal ?? "?"} kcal\t${f.description}`);
    }
  }
}

function build() {
  const selection = JSON.parse(
    readFileSync(join(ROOT, "supabase/food-data/usda-foods.json"), "utf8"),
  );
  const recipes = JSON.parse(readFileSync(join(ROOT, "supabase/food-data/recipes.json"), "utf8"));
  const { foods, nutrients, portions } = loadUsda();
  const usdaSourceId = stableId("source:usda-sr-legacy-2018");
  const out = [
    "-- GENERATED by scripts/build-food-seed.mjs — do not edit by hand.",
    "-- Edit supabase/food-data/*.json and re-run: node scripts/build-food-seed.mjs",
    "-- Every food has a data source. Nothing is marked verified until the dietitian reviews it (ADR-013).",
    "",
    "begin;",
    "",
    `insert into public.data_sources (id, name, citation, url, licence, notes) values (${[
      usdaSourceId,
      USDA_SOURCE.name,
      USDA_SOURCE.citation,
      USDA_SOURCE.url,
      USDA_SOURCE.licence,
      USDA_SOURCE.notes,
    ]
      .map(sql)
      .join(", ")}) on conflict (id) do nothing;`,
    "",
  ];
  const per100gById = new Map();
  const seenNames = new Set();
  let count = 0;

  for (const item of selection.foods) {
    const usda = foods.get(String(item.fdcId));
    if (!usda) throw new Error(`USDA food ${item.fdcId} (${item.name}) not found`);
    const n = nutrients.get(String(item.fdcId)) ?? {};
    if (n.energy_kcal === undefined) throw new Error(`USDA food ${item.fdcId} has no energy value`);
    assertEnergyPlausible(`${item.name} (USDA ${item.fdcId})`, n);
    const key = item.name.toLowerCase();
    if (seenNames.has(key)) throw new Error(`Duplicate food name: ${item.name}`);
    seenNames.add(key);
    const id = stableId(`usda:${item.fdcId}`);
    per100gById.set(`usda:${item.fdcId}`, { id, n });
    const notes = [`USDA FDC ${item.fdcId}: ${usda.description}.`, item.notes]
      .filter(Boolean)
      .join(" ");
    out.push(`-- ${item.name} ← USDA ${item.fdcId}`);
    out.push(
      `insert into public.foods (id, name, category, cooking_method_id, data_source_id, verification_status, notes) values (${sql(id)}, ${sql(item.name)}, ${sql(item.category)}, ${item.cookingMethod ? `(select id from public.cooking_methods where lower(name) = ${sql(item.cookingMethod.toLowerCase())})` : "null"}, ${sql(usdaSourceId)}, 'unverified', ${sql(notes)}) on conflict (id) do nothing;`,
    );
    out.push(
      `insert into public.food_nutrients (food_id, ${COLUMNS.join(", ")}) values (${sql(id)}, ${COLUMNS.map(
        (col) => sql(n[col] === undefined ? null : round2(n[col])),
      ).join(", ")}) on conflict (food_id) do nothing;`,
    );
    for (const [alias, language] of item.aliases ?? []) {
      out.push(
        `insert into public.food_aliases (food_id, alias, language) values (${sql(id)}, ${sql(alias)}, ${sql(language)}) on conflict do nothing;`,
      );
    }
    const units = new Set();
    for (const p of (portions.get(String(item.fdcId)) ?? []).sort(
      (a, b) => Number(a.seq_num) - Number(b.seq_num),
    )) {
      const word = p.modifier.toLowerCase().split(/[ ,(]/)[0];
      const unit = PORTION_UNITS[word];
      const amount = Number(p.amount);
      if (!unit || units.has(unit) || !(amount > 0)) continue;
      units.add(unit);
      out.push(
        `insert into public.food_servings (food_id, serving_unit_id, grams, is_estimate, data_source_id, notes) values (${sql(id)}, (select id from public.serving_units where lower(name) = ${sql(unit)}), ${round2(Number(p.gram_weight) / amount)}, false, ${sql(usdaSourceId)}, ${sql(`USDA portion: ${p.amount} ${p.modifier}`)}) on conflict do nothing;`,
      );
    }
    out.push("");
    count++;
  }

  for (const recipe of recipes.recipes) {
    const sourceId = stableId(`source:${recipe.source.name}`);
    const ingredients = recipe.ingredients.map((ing) => {
      const found = per100gById.get(ing.food);
      if (!found) throw new Error(`Recipe ${recipe.name}: unknown ingredient ${ing.food}`);
      return { foodId: found.id, grams: ing.grams, per100g: found.n };
    });
    const per100 = recipePer100g(
      ingredients.map((i) => ({
        grams: i.grams,
        per100g: {
          energyKcal: i.per100g.energy_kcal ?? null,
          proteinG: i.per100g.protein_g ?? null,
          carbsG: i.per100g.carbs_g ?? null,
          fatG: i.per100g.fat_g ?? null,
          fibreG: i.per100g.fibre_g ?? null,
          sugarG: i.per100g.sugar_g ?? null,
          sodiumMg: i.per100g.sodium_mg ?? null,
        },
      })),
      recipe.yieldGrams,
    );
    const id = stableId(`recipe:${recipe.name}`);
    out.push(`-- Recipe: ${recipe.name}`);
    out.push(
      `insert into public.data_sources (id, name, citation, url, licence) values (${[sourceId, recipe.source.name, recipe.source.citation, recipe.source.url ?? null, recipe.source.licence ?? null].map(sql).join(", ")}) on conflict (id) do nothing;`,
    );
    out.push(
      `insert into public.foods (id, name, category, is_composite, recipe_yield_grams, data_source_id, verification_status) values (${sql(id)}, ${sql(recipe.name)}, ${sql(recipe.category)}, true, ${recipe.yieldGrams}, ${sql(sourceId)}, 'unverified') on conflict (id) do nothing;`,
    );
    for (const ing of ingredients) {
      out.push(
        `insert into public.recipe_ingredients (recipe_food_id, ingredient_food_id, grams) values (${sql(id)}, ${sql(ing.foodId)}, ${ing.grams}) on conflict do nothing;`,
      );
    }
    out.push(
      `insert into public.food_nutrients (food_id, energy_kcal, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg) values (${sql(id)}, ${[per100.energyKcal, per100.proteinG, per100.carbsG, per100.fatG, per100.fibreG, per100.sugarG, per100.sodiumMg].map(sql).join(", ")}) on conflict (food_id) do nothing;`,
    );
    out.push("");
    count++;
  }

  out.push("commit;", "");
  writeFileSync(join(ROOT, "supabase/seed.sql"), out.join("\n"));
  console.log(`Wrote supabase/seed.sql: ${count} foods (${recipes.recipes.length} recipes).`);
}

const findIndex = process.argv.indexOf("--find");
if (findIndex !== -1) find(process.argv.slice(findIndex + 1).join(" "));
else build();
