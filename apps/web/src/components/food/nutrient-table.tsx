import { scaleNutrients, type NutrientProfile } from "@nutritrack/core";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

const ROWS: { key: keyof NutrientProfile; label: string; unit: string; strong?: boolean }[] = [
  { key: "energyKcal", label: "Calories", unit: "kcal", strong: true },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "carbsG", label: "Carbohydrates", unit: "g" },
  { key: "fibreG", label: "of which fibre", unit: "g" },
  { key: "sugarG", label: "of which sugar", unit: "g" },
  { key: "fatG", label: "Fat", unit: "g" },
  { key: "sodiumMg", label: "Sodium", unit: "mg" },
];

/** Nutrients for a portion, scaled by packages/core. Unknown values say so, never "0". */
export function NutrientTable({ per100g, grams }: { per100g: NutrientProfile; grams: number }) {
  const values = scaleNutrients(per100g, grams);
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Nutrients in {nf.format(grams)} g</caption>
      <tbody className="divide-y divide-border/70">
        {ROWS.map((row) => {
          const value = values[row.key];
          return (
            <tr key={row.key}>
              <th
                scope="row"
                className={
                  row.label.startsWith("of which")
                    ? "py-2.5 pl-4 text-left font-normal text-muted-foreground"
                    : "py-2.5 text-left font-medium"
                }
              >
                {row.label}
              </th>
              <td
                className={
                  row.strong
                    ? "py-2.5 text-right font-heading text-lg font-semibold tabular-nums"
                    : "py-2.5 text-right tabular-nums"
                }
              >
                {value === null ? (
                  <span className="text-muted-foreground">Unknown</span>
                ) : (
                  `${nf.format(value)} ${row.unit}`
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
