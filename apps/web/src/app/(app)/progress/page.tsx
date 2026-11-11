"use client";

import {
  deleteWater,
  deleteWeight,
  getWaterForDay,
  getWeightHistory,
  localIsoDate,
  type WaterEntry,
  type WeightEntry,
} from "@nutritrack/api-client";
import { formatLitres, isoDaysBefore, summariseWeights, sumWaterMl } from "@nutritrack/core";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Panel, PanelError, PanelSkeleton } from "@/components/dashboard/panel";
import { WeighInForm } from "@/components/dashboard/weight-panel";
import { WeightTrendChart } from "@/components/dashboard/weight-trend-chart";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/account";
import { errorMessage } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";
import { cn } from "cn";

const RANGES = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
] as const;

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });
const dayFmt = new Intl.DateTimeFormat("en-NG", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const timeFmt = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" });

type Load<T> =
  { status: "loading" } | { status: "error"; error: unknown } | { status: "ready"; data: T };

export default function ProgressPage() {
  const { state: account } = useAccount();
  const [today] = useState(() => localIsoDate());
  const [days, setDays] = useState<number>(90);
  const [weights, setWeights] = useState<Load<WeightEntry[]>>({ status: "loading" });
  const [water, setWater] = useState<Load<WaterEntry[]>>({ status: "loading" });

  const fetchWeights = useCallback(
    () =>
      getWeightHistory(getSupabase(), today, days).then(
        (data) => ({ status: "ready", data }) as const,
        (error: unknown) => ({ status: "error", error }) as const,
      ),
    [today, days],
  );
  const fetchWater = useCallback(
    () =>
      getWaterForDay(getSupabase(), new Date()).then(
        (data) => ({ status: "ready", data }) as const,
        (error: unknown) => ({ status: "error", error }) as const,
      ),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchWeights().then((next) => !cancelled && setWeights(next));
    return () => {
      cancelled = true;
    };
  }, [fetchWeights]);

  useEffect(() => {
    let cancelled = false;
    void fetchWater().then((next) => !cancelled && setWater(next));
    return () => {
      cancelled = true;
    };
  }, [fetchWater]);

  const reloadWeights = async () => setWeights(await fetchWeights());
  const reloadWater = async () => setWater(await fetchWater());

  if (account.status !== "ready") return null;
  const goal = account.goal;
  const targetKg = goal?.target_weight_kg ?? null;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader title="Progress" description="Your weigh-ins and today's water." />

      <Panel
        title="Weight trend"
        titleId="trend-title"
        action={
          <div role="group" aria-label="Time range" className="flex rounded-lg bg-surface p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                aria-pressed={days === r.days}
                onClick={() => {
                  setWeights({ status: "loading" });
                  setDays(r.days);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition",
                  "aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      >
        {weights.status === "loading" ? (
          <PanelSkeleton lines={5} />
        ) : weights.status === "error" ? (
          <PanelError error={weights.error} onRetry={() => void reloadWeights()} />
        ) : (
          <WeightOverview entries={weights.data} targetKg={targetKg} today={today} days={days} />
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Log a weigh-in" titleId="weigh-in-title">
          <p className="text-sm text-muted-foreground">
            One weigh-in per day. Saving again today replaces today&apos;s entry. For a fair
            comparison, weigh yourself at the same time of day.
          </p>
          <WeighInForm today={today} onChanged={reloadWeights} />
          {weights.status === "ready" && weights.data.length > 0 && (
            <ul className="flex flex-col divide-y divide-border/70">
              {[...weights.data]
                .reverse()
                .slice(0, 10)
                .map((w) => (
                  <DeletableRow
                    key={w.id}
                    label={dayFmt.format(new Date(`${w.measured_on}T00:00:00Z`))}
                    value={`${nf.format(w.weight_kg)} kg`}
                    deleteLabel={`Delete weigh-in from ${w.measured_on}`}
                    onDelete={async () => {
                      await deleteWeight(getSupabase(), w.id);
                      await reloadWeights();
                    }}
                  />
                ))}
            </ul>
          )}
        </Panel>

        <Panel title="Water today" titleId="water-today-title">
          {water.status === "loading" ? (
            <PanelSkeleton lines={4} />
          ) : water.status === "error" ? (
            <PanelError error={water.error} onRetry={() => void reloadWater()} />
          ) : water.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No water logged yet today. Add some from your Home dashboard.
            </p>
          ) : (
            <>
              <p>
                <span className="font-heading text-3xl font-bold tabular-nums">
                  {formatLitres(sumWaterMl(water.data))}
                </span>
                {goal && (
                  <span className="text-muted-foreground"> of {formatLitres(goal.water_ml)}</span>
                )}
              </p>
              <ul className="flex flex-col divide-y divide-border/70">
                {[...water.data].reverse().map((w) => (
                  <DeletableRow
                    key={w.id}
                    label={`${timeFmt.format(new Date(w.logged_at))}${w.unit_label && w.unit_label !== "ml" ? ` · ${w.unit_label}` : ""}`}
                    value={`${w.amount_ml} ml`}
                    deleteLabel={`Delete ${w.amount_ml} ml logged at ${timeFmt.format(new Date(w.logged_at))}`}
                    onDelete={async () => {
                      await deleteWater(getSupabase(), w.id);
                      await reloadWater();
                    }}
                  />
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

function WeightOverview({
  entries,
  targetKg,
  today,
  days,
}: {
  entries: WeightEntry[];
  targetKg: number | null;
  today: string;
  days: number;
}) {
  const summary = summariseWeights(entries, isoDaysBefore(today, days), targetKg);
  if (!summary) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-muted-foreground">
        No weigh-ins in this period. Log one below to start your trend.
      </p>
    );
  }
  const change = summary.change;
  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Figure label="Current" value={`${nf.format(summary.current.weight_kg)} kg`} />
        <Figure
          label="Target"
          value={targetKg === null ? "Not set" : `${nf.format(targetKg)} kg`}
        />
        <Figure
          label="Change"
          value={
            change === null
              ? "—"
              : `${change > 0 ? "+" : change < 0 ? "−" : ""}${nf.format(Math.abs(change))} kg`
          }
        />
        <Figure
          label="To target"
          value={summary.toTarget === null ? "—" : `${nf.format(summary.toTarget)} kg`}
        />
      </dl>
      {entries.length > 1 ? (
        <WeightTrendChart entries={entries} targetKg={targetKg} />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-muted-foreground">
          One weigh-in so far. Your trend line appears after your next one.
        </p>
      )}
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-surface/60 p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function DeletableRow({
  label,
  value,
  deleteLabel,
  onDelete,
}: {
  label: string;
  value: string;
  deleteLabel: string;
  onDelete: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <li className="flex flex-col py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{value}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={deleteLabel}
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              try {
                await onDelete();
              } catch (e) {
                setError(errorMessage(e));
                setPending(false);
              }
            }}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}
