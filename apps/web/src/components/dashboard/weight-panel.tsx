"use client";

import { logWeight, type WeightEntry } from "@nutritrack/api-client";
import { isoDaysBefore, summariseWeights } from "@nutritrack/core";
import { weightEntrySchema } from "@nutritrack/schemas";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage, toNumber } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";
import { Panel, PanelError, PanelSkeleton } from "./panel";
import { WeightTrendChart } from "./weight-trend-chart";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const shortDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`));

type Props =
  | { status: "loading" }
  | { status: "error"; error: unknown; onRetry: () => void }
  | {
      status: "ready";
      recent: WeightEntry[];
      latest: WeightEntry | null;
      targetKg: number | null;
      today: string;
      windowDays: number;
      onChanged: () => Promise<void>;
    };

/** Current and target weight, recent change, a small trend and a quick weigh-in form. */
export function WeightPanel(props: Props) {
  return (
    <Panel
      title="Weight"
      titleId="weight-title"
      action={
        <Link
          href="/progress"
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Progress
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      }
    >
      {props.status === "loading" ? (
        <PanelSkeleton lines={4} />
      ) : props.status === "error" ? (
        <PanelError error={props.error} onRetry={props.onRetry} />
      ) : (
        <WeightSummaryView {...props} />
      )}
    </Panel>
  );
}

function WeightSummaryView({
  recent,
  latest,
  targetKg,
  today,
  windowDays,
  onChanged,
}: Extract<Props, { status: "ready" }>) {
  const points = latest && !recent.some((r) => r.id === latest.id) ? [latest, ...recent] : recent;
  const summary = summariseWeights(points, isoDaysBefore(today, windowDays), targetKg);

  return (
    <div className="flex flex-col gap-4">
      {summary ? (
        <>
          <dl className="grid grid-cols-3 gap-2">
            <Stat label="Current" value={`${nf.format(summary.current.weight_kg)} kg`} />
            <Stat label="Target" value={targetKg === null ? "—" : `${nf.format(targetKg)} kg`} />
            <Stat
              label={`${windowDays} days`}
              value={
                summary.change === null
                  ? "—"
                  : `${summary.change > 0 ? "+" : summary.change < 0 ? "−" : ""}${nf.format(Math.abs(summary.change))} kg`
              }
            />
          </dl>
          {recent.length > 1 ? (
            <WeightTrendChart entries={recent} targetKg={targetKg} compact />
          ) : (
            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Last weigh-in {shortDate(summary.current.measured_on)}. Log another to start your
              trend.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No weigh-ins yet.</p>
      )}
      <WeighInForm today={today} onChanged={onChanged} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function WeighInForm({
  today,
  onChanged,
}: {
  today: string;
  onChanged: () => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = weightEntrySchema(today).safeParse({
      weightKg: toNumber(value),
      measuredOn: today,
    });
    if (!parsed.success) {
      setStatus({
        kind: "error",
        text: parsed.error.issues[0]?.message ?? "Enter your weight in kg",
      });
      return;
    }
    setPending(true);
    setStatus(null);
    try {
      await logWeight(getSupabase(), parsed.data, today);
      await onChanged();
      setValue("");
      setStatus({
        kind: "success",
        text: `Saved ${nf.format(parsed.data.weightKg)} kg for today.`,
      });
    } catch (err) {
      setStatus({ kind: "error", text: errorMessage(err) });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
      <div className="flex gap-2">
        <label htmlFor="weigh-in" className="sr-only">
          Today&apos;s weight in kilograms
        </label>
        <Input
          id="weigh-in"
          inputMode="decimal"
          placeholder="Today's weight (kg)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={status?.kind === "error" || undefined}
          className="h-9"
        />
        <Button type="submit" className="h-9" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {status && (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={
            status.kind === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {status.text}
        </p>
      )}
    </form>
  );
}
