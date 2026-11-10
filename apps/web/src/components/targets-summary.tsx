type Targets = {
  calorieTarget: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
};

const nf = new Intl.NumberFormat("en-NG");

/** Daily targets: calories prominent, then macros and water. */
export function TargetsSummary({ targets }: { targets: Targets }) {
  const items = [
    { label: "Protein", value: `${nf.format(targets.proteinG)} g` },
    { label: "Carbs", value: `${nf.format(targets.carbsG)} g` },
    { label: "Fat", value: `${nf.format(targets.fatG)} g` },
    { label: "Water", value: `${(targets.waterMl / 1000).toFixed(1)} L` },
  ];
  return (
    <div className="flex flex-col gap-4">
      <p>
        <span className="text-4xl font-bold tabular-nums">{nf.format(targets.calorieTarget)}</span>{" "}
        <span className="text-muted-foreground">kcal a day</span>
      </p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border p-3">
            <dt className="text-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
