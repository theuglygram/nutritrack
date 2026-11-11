"use client";

import {
  DASHBOARD_WEIGHT_DAYS,
  type Goal,
  type LogEntry,
  type Profile,
} from "@nutritrack/api-client";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  NOT_MEDICAL_ADVICE,
  dailyTip,
  firstName,
  greetingFor,
  groupByMealSlot,
  sumLoggedNutrients,
  sumWaterMl,
} from "@nutritrack/core";
import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MealsPanel } from "@/components/dashboard/meals-panel";
import { Panel, PanelError, PanelSkeleton } from "@/components/dashboard/panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { WaterPanel } from "@/components/dashboard/water-panel";
import { WeightPanel } from "@/components/dashboard/weight-panel";
import { CalorieFigures, CalorieRing } from "@/components/nutrition/calorie-ring";
import { MacroProgress } from "@/components/nutrition/macro-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "@/lib/account";
import { useDashboard, type DashboardState } from "@/lib/dashboard";

const dateFmt = new Intl.DateTimeFormat("en-NG", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default function HomePage() {
  const { state } = useAccount();
  if (state.status !== "ready") return null; // The shell shows loading and error states.
  return <Dashboard profile={state.profile} goal={state.goal} />;
}

function Dashboard({ profile, goal }: { profile: Profile; goal: Goal | null }) {
  const { state, reload, today } = useDashboard();
  const [now] = useState(() => new Date());
  const retry = () => void reload();
  const loading = state.status === "loading";
  const data = state.status === "ready" ? state.data : null;
  const log = data?.log.ok ? data.log.data : null;
  const totals = sumLoggedNutrients(log ?? []);

  if (!goal) {
    return (
      <div className="flex flex-col gap-4">
        <Header profile={profile} now={now} message="Let's set up your daily targets first." />
        <Panel title="No targets yet">
          <p className="text-muted-foreground">
            Your dashboard needs daily targets.{" "}
            <Link
              href="/onboarding"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Set them up
            </Link>
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <Header
        profile={profile}
        now={now}
        message={contextMessage(now.getHours(), log?.length ?? null)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="calories-title"
          className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgb(28_31_26/0.04)] sm:p-7 lg:col-span-2 lg:row-span-2"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="calories-title" className="text-lg font-semibold">
              Calories today
            </h2>
            <Link href="/profile" className="text-sm font-semibold text-primary hover:underline">
              {goal.is_override ? "Your own targets" : "Edit targets"}
            </Link>
          </div>
          {data && !data.log.ok ? (
            <PanelError error={data.log.error} onRetry={retry} />
          ) : (
            <div className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-10">
              <div className="flex flex-col items-center gap-5">
                {loading ? (
                  <Skeleton className="size-56 rounded-full" />
                ) : (
                  <CalorieRing consumed={totals.energyKcal} target={goal.calorie_target} />
                )}
                <CalorieFigures consumed={totals.energyKcal} target={goal.calorie_target} />
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Macros
                </h3>
                {loading ? (
                  <PanelSkeleton lines={6} />
                ) : (
                  <MacroProgress
                    protein={{ consumed: totals.proteinG, target: goal.protein_g }}
                    carbs={{ consumed: totals.carbsG, target: goal.carbs_g }}
                    fat={{ consumed: totals.fatG, target: goal.fat_g }}
                  />
                )}
              </div>
            </div>
          )}
          {log && <MealBreakdown entries={log} />}
          {totals.hasUnknownValues && (
            <p className="text-sm text-muted-foreground">
              Some foods you logged have missing nutrient values, so these totals may be lower than
              what you ate.
            </p>
          )}
        </section>

        <TipPanel state={state} goal={goal} now={now} />

        <WaterPanel
          {...(!data
            ? { status: "loading" as const }
            : data.water.ok
              ? {
                  status: "ready" as const,
                  entries: data.water.data,
                  targetMl: goal.water_ml,
                  onChanged: reload,
                }
              : { status: "error" as const, error: data.water.error, onRetry: retry })}
        />
      </div>

      <QuickActions />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MealsPanel
            {...(!data
              ? { status: "loading" as const }
              : data.log.ok
                ? { status: "ready" as const, entries: data.log.data, onChanged: reload }
                : { status: "error" as const, error: data.log.error, onRetry: retry })}
          />
        </div>
        <WeightPanel
          {...(!data
            ? { status: "loading" as const }
            : data.weights.ok && data.latestWeight.ok
              ? {
                  status: "ready" as const,
                  recent: data.weights.data,
                  latest: data.latestWeight.data,
                  targetKg: goal.target_weight_kg,
                  today,
                  windowDays: DASHBOARD_WEIGHT_DAYS,
                  onChanged: reload,
                }
              : {
                  status: "error" as const,
                  error: data.weights.ok
                    ? data.latestWeight.ok
                      ? null
                      : data.latestWeight.error
                    : data.weights.error,
                  onRetry: retry,
                })}
        />
      </div>

      <p className="text-xs text-muted-foreground">{NOT_MEDICAL_ADVICE}</p>
    </div>
  );
}

const kcalFmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

/** Calories per meal slot, from the same snapshots as the totals above. */
function MealBreakdown({ entries }: { entries: LogEntry[] }) {
  const groups = groupByMealSlot(entries);
  return (
    <div className="mt-auto flex flex-col gap-3 border-t border-border/70 pt-5">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        By meal
      </h3>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MEAL_SLOTS.map((slot) => (
          <div key={slot} className="flex flex-col gap-0.5 rounded-xl bg-surface/60 px-4 py-3">
            <dt className="text-sm text-muted-foreground">{MEAL_SLOT_LABELS[slot]}</dt>
            <dd className="font-heading text-lg font-semibold tabular-nums">
              {kcalFmt.format(sumLoggedNutrients(groups[slot]).energyKcal)}{" "}
              <span className="text-sm font-normal text-muted-foreground">kcal</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function contextMessage(hour: number, entries: number | null): string {
  if (entries === null || entries === 0) {
    return hour < 12 ? "Ready to make today count?" : "There's still plenty of day to make count.";
  }
  return `You've logged ${entries} ${entries === 1 ? "item" : "items"} today. Keep it going.`;
}

function Header({ profile, now, message }: { profile: Profile; now: Date; message: string }) {
  const name = firstName(profile.display_name);
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{dateFmt.format(now)}</p>
        <h1 className="text-3xl font-bold sm:text-4xl">
          {greetingFor(now.getHours())}
          {name ? `, ${name}` : ""}
        </h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <Link
        href="/profile"
        aria-label="Your profile"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-primary font-heading text-lg font-semibold text-primary-foreground ring-4 ring-primary-soft transition hover:opacity-90"
      >
        <span aria-hidden="true">{(name ?? "?").charAt(0).toUpperCase()}</span>
      </Link>
    </header>
  );
}

/** A rule-based note from today's own numbers (packages/core dailyTip). Not AI. */
function TipPanel({ state, goal, now }: { state: DashboardState; goal: Goal; now: Date }) {
  const data = state.status === "ready" ? state.data : null;
  const ready = data?.log.ok && data.water.ok;
  const tip =
    data && data.log.ok && data.water.ok
      ? dailyTip({
          hour: now.getHours(),
          entryCount: data.log.data.length,
          totals: sumLoggedNutrients(data.log.data),
          targets: { calorieTarget: goal.calorie_target, proteinG: goal.protein_g },
          waterMl: sumWaterMl(data.water.data),
          waterTargetMl: goal.water_ml,
        })
      : null;
  return (
    <section
      aria-labelledby="tip-title"
      className="flex flex-col gap-3 rounded-2xl bg-forest p-5 text-on-forest sm:p-6"
    >
      <div className="flex items-center gap-2">
        <span
          className="grid size-8 place-items-center rounded-lg bg-lime text-lime-foreground"
          aria-hidden="true"
        >
          <Lightbulb className="size-4" />
        </span>
        <h2 id="tip-title" className="font-semibold">
          Today&apos;s note
        </h2>
      </div>
      {tip ? (
        <p aria-live="polite" className="text-lg leading-snug">
          {tip.message}
        </p>
      ) : !data ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          <div className="h-4 w-full animate-pulse rounded bg-on-forest/15" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-on-forest/15" />
        </div>
      ) : (
        !ready && <p>Your note will appear once today&apos;s data loads.</p>
      )}
      <p className="text-xs text-on-forest/70">
        Based on your own logs and targets. Personalised AI insights are coming later.
      </p>
    </section>
  );
}
