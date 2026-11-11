import { progressToward } from "@nutritrack/core";
import { cn } from "cn";

const nf = new Intl.NumberFormat("en-NG");
const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Calories eaten against the daily target. The ring is decorative; the same numbers are
 * always shown as text, so screen readers get them without parsing a graphic.
 */
export function CalorieRing({
  consumed,
  target,
  className,
  size = "lg",
}: {
  consumed: number;
  target: number;
  className?: string;
  size?: "md" | "lg";
}) {
  const p = progressToward(consumed, target);
  const over = p.over > 0;
  const offset = CIRCUMFERENCE * (1 - p.fraction);
  return (
    <div
      className={cn(
        "relative grid place-items-center",
        size === "lg" ? "size-56" : "size-40",
        className,
      )}
    >
      <svg
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="9" className="stroke-surface" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ ["--ring-from" as string]: CIRCUMFERENCE }}
          className={cn("ring-progress", over ? "stroke-carbs" : "stroke-primary")}
        />
      </svg>
      <div className="relative flex flex-col items-center text-center">
        <span
          className={cn(
            "font-heading font-bold tabular-nums leading-none tracking-tight",
            size === "lg" ? "text-5xl" : "text-3xl",
          )}
        >
          {nf.format(over ? p.over : p.remaining)}
        </span>
        <span className="mt-1.5 text-sm text-muted-foreground">
          {over ? "kcal over" : "kcal left"}
        </span>
      </div>
    </div>
  );
}

/** Eaten / target / percent, as plain text next to the ring. */
export function CalorieFigures({ consumed, target }: { consumed: number; target: number }) {
  const p = progressToward(consumed, target);
  const items = [
    { label: "Eaten", value: `${nf.format(consumed)} kcal` },
    { label: "Target", value: `${nf.format(target)} kcal` },
    { label: "Of target", value: `${p.percent}%` },
  ];
  return (
    <dl className="grid grid-cols-3 gap-x-6 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {item.label}
          </dt>
          <dd className="font-heading text-lg font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
