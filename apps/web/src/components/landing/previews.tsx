import { Camera, Check, MessageSquareText, Minus, Plus, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { FoodArt } from "@/components/brand/food-art";
import { CalorieFigures, CalorieRing } from "@/components/nutrition/calorie-ring";
import { MacroProgress } from "@/components/nutrition/macro-progress";
import { cn } from "cn";

/**
 * Marketing previews built from the real dashboard components. The numbers are illustrative
 * (round example values for a sample day) and every preview is captioned as such. No food here
 * shows a calorie value, because nutrition values must come from the verified database.
 */
export const EXAMPLE_DAY = {
  target: 2100,
  consumed: 1240,
  protein: { consumed: 78, target: 130 },
  carbs: { consumed: 142, target: 236 },
  fat: { consumed: 41, target: 58 },
};

export function PreviewCaption({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      {children ?? "Illustrative preview with example numbers."}
    </p>
  );
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgb(28_31_26/0.04),0_12px_32px_-12px_rgb(28_31_26/0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardPreview({ className }: { className?: string }) {
  return (
    <Frame className={cn("flex flex-col gap-5", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Today</p>
          <p className="font-heading text-lg font-semibold">Good afternoon, Tolu</p>
        </div>
        <span
          aria-hidden="true"
          className="grid size-9 place-items-center rounded-full bg-primary-soft font-semibold text-primary"
        >
          T
        </span>
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <CalorieRing
          consumed={EXAMPLE_DAY.consumed}
          target={EXAMPLE_DAY.target}
          size="md"
          className="shrink-0"
        />
        <MacroProgress
          protein={EXAMPLE_DAY.protein}
          carbs={EXAMPLE_DAY.carbs}
          fat={EXAMPLE_DAY.fat}
          className="w-full flex-1 gap-3 [&_p]:hidden"
        />
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-surface/70 p-3">
        <FoodArt food="jollof" className="size-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">Jollof rice with plantain</p>
          <p className="text-sm text-muted-foreground">Lunch · 1 plate</p>
        </div>
        <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" aria-hidden="true" />
        </span>
      </div>
    </Frame>
  );
}

export function NutritionPreview() {
  return (
    <Frame className="grid gap-8 p-6 sm:grid-cols-[auto_1fr] sm:items-center sm:p-8">
      <div className="flex flex-col items-center gap-5">
        <CalorieRing consumed={EXAMPLE_DAY.consumed} target={EXAMPLE_DAY.target} />
        <CalorieFigures consumed={EXAMPLE_DAY.consumed} target={EXAMPLE_DAY.target} />
      </div>
      <MacroProgress
        protein={EXAMPLE_DAY.protein}
        carbs={EXAMPLE_DAY.carbs}
        fat={EXAMPLE_DAY.fat}
      />
    </Frame>
  );
}

const WEIGHTS = [84.2, 84.0, 83.9, 83.4, 83.6, 83.1, 82.8, 82.9, 82.4, 82.1, 81.9, 81.6];

/** A static SVG line chart with example weigh-ins (the app uses Recharts with real data). */
export function WeightPreview() {
  const w = 320;
  const h = 150;
  const min = 80;
  const max = 85;
  const x = (i: number) => 12 + (i / (WEIGHTS.length - 1)) * (w - 24);
  const y = (v: number) => 12 + ((max - v) / (max - min)) * (h - 24);
  const line = WEIGHTS.map(
    (v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`,
  ).join(" ");
  const goalY = y(80.5);
  return (
    <Frame className="flex flex-col gap-4 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current weight</p>
          <p className="font-heading text-4xl font-bold tabular-nums">
            81.6 <span className="text-lg font-medium text-muted-foreground">kg</span>
          </p>
        </div>
        <p className="rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
          −2.6 kg in 12 weeks
        </p>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            x2={w}
            y1={12 + (i * (h - 24)) / 3}
            y2={12 + (i * (h - 24)) / 3}
            className="stroke-border"
            strokeDasharray="2 4"
          />
        ))}
        <line
          x1="0"
          x2={w}
          y1={goalY}
          y2={goalY}
          className="stroke-lime"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        <path
          d={`${line} L${x(WEIGHTS.length - 1)} ${h} L${x(0)} ${h}Z`}
          className="fill-primary/8"
        />
        <path
          d={line}
          fill="none"
          className="stroke-primary"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {WEIGHTS.map((v, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(v)}
            r={i === WEIGHTS.length - 1 ? 5 : 2.5}
            className={i === WEIGHTS.length - 1 ? "fill-primary stroke-card" : "fill-primary"}
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 rounded bg-lime" /> Goal 80.5 kg
        </span>
        <span>12 weeks</span>
      </div>
    </Frame>
  );
}

function StepCard({
  step,
  icon,
  title,
  body,
  children,
  tag,
}: {
  step: number;
  icon: ReactNode;
  title: string;
  body: string;
  children: ReactNode;
  tag?: string;
}) {
  return (
    <li
      className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5"
      data-reveal
      data-reveal-delay={step * 80}
    >
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </span>
        {tag && (
          <span className="flex items-center gap-1 rounded-full bg-lime/30 px-2.5 py-1 text-xs font-semibold text-foreground">
            <Sparkles className="size-3" aria-hidden="true" />
            {tag}
          </span>
        )}
      </div>
      <div className="min-h-36 rounded-xl bg-surface/70 p-3" aria-hidden="true">
        {children}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

/** Four ways to log a meal, each with a miniature of the interface. */
export function LoggingSteps() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StepCard
        step={1}
        icon={<Search className="size-5" />}
        title="Search"
        body="Find Nigerian dishes by the names you use, including Yoruba, Igbo, Hausa and Pidgin."
      >
        <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm">
          <Search className="size-4 text-muted-foreground" />
          <span>egus</span>
          <span className="h-4 w-px animate-pulse bg-foreground" />
        </div>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {["Egusi soup", "Egusi soup with spinach", "Egusi (melon seeds)"].map((name, i) => (
            <li
              key={name}
              className={cn("rounded-md px-2 py-1.5", i === 0 && "bg-card font-medium")}
            >
              {name}
            </li>
          ))}
        </ul>
      </StepCard>
      <StepCard
        step={2}
        icon={<MessageSquareText className="size-5" />}
        title="Describe"
        body="Type what you ate in plain words. NutriTrack suggests the foods for you to check."
        tag="AI-assisted"
      >
        <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          2 wraps of eba and egusi with assorted meat
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Eba · 2 wraps", "Egusi soup · 1 ladle", "Assorted meat"].map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium"
            >
              {c}
            </span>
          ))}
        </div>
      </StepCard>
      <StepCard
        step={3}
        icon={<Camera className="size-5" />}
        title="Snap"
        body="Take a photo of your plate. NutriTrack suggests what it sees and estimates the portion."
        tag="AI-assisted"
      >
        <div className="relative mx-auto size-32">
          <FoodArt food="jollof" className="size-full" />
          <span className="absolute top-3 -left-2 rounded-md bg-card px-2 py-0.5 text-xs font-semibold shadow-sm">
            Jollof rice?
          </span>
          <span className="absolute -right-3 bottom-5 rounded-md bg-card px-2 py-0.5 text-xs font-semibold shadow-sm">
            Plantain?
          </span>
          <span className="pointer-events-none absolute inset-2 rounded-full border-2 border-dashed border-lime" />
        </div>
      </StepCard>
      <StepCard
        step={4}
        icon={<Check className="size-5" />}
        title="Review and confirm"
        body="Adjust the food and the portion. Nothing is saved until you confirm it."
      >
        <p className="text-sm font-medium">Jollof rice</p>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-card p-1.5">
          <span className="grid size-7 place-items-center rounded-md bg-surface">
            <Minus className="size-4" />
          </span>
          <span className="text-sm font-semibold tabular-nums">1.5 cups</span>
          <span className="grid size-7 place-items-center rounded-md bg-surface">
            <Plus className="size-4" />
          </span>
        </div>
        <span className="mt-3 flex h-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          Confirm
        </span>
      </StepCard>
    </ol>
  );
}
