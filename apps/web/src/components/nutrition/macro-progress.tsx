import { progressToward } from "@nutritrack/core";
import { cn } from "cn";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

type Macro = { key: "protein" | "carbs" | "fat"; label: string; consumed: number; target: number };

const BAR: Record<Macro["key"], string> = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
};

/** Protein, carbs and fat against their targets: amount, target, remaining and percent. */
export function MacroProgress({
  protein,
  carbs,
  fat,
  className,
}: {
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fat: { consumed: number; target: number };
  className?: string;
}) {
  const macros: Macro[] = [
    { key: "protein", label: "Protein", ...protein },
    { key: "carbs", label: "Carbs", ...carbs },
    { key: "fat", label: "Fat", ...fat },
  ];
  return (
    <ul className={cn("flex flex-col gap-5", className)}>
      {macros.map((m) => {
        const p = progressToward(m.consumed, m.target);
        return (
          <li key={m.key} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 font-medium">
                <span aria-hidden="true" className={cn("size-2.5 rounded-full", BAR[m.key])} />
                {m.label}
              </span>
              <span className="text-sm tabular-nums">
                <span className="font-semibold">{nf.format(m.consumed)}</span>
                <span className="text-muted-foreground"> / {nf.format(m.target)} g</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${m.label} eaten`}
              aria-valuemin={0}
              aria-valuemax={m.target}
              aria-valuenow={Math.min(m.consumed, m.target)}
              aria-valuetext={`${nf.format(m.consumed)} of ${nf.format(m.target)} grams, ${p.percent}%`}
              className="h-2 overflow-hidden rounded-full bg-surface"
            >
              <div
                className={cn("bar-progress h-full rounded-full", BAR[m.key])}
                style={{ width: `${p.fraction * 100}%` }}
              />
            </div>
            <p className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>
                {p.over > 0 ? `${nf.format(p.over)} g over` : `${nf.format(p.remaining)} g left`}
              </span>
              <span>{p.percent}%</span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
