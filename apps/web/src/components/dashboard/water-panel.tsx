"use client";

import { addWater, deleteWater, type WaterEntry } from "@nutritrack/api-client";
import { WATER_PORTIONS, formatLitres, progressToward, sumWaterMl } from "@nutritrack/core";
import { waterEntrySchema } from "@nutritrack/schemas";
import { Droplet, Undo2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage, toNumber } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";
import { Panel, PanelError, PanelSkeleton } from "./panel";

type Props =
  | { status: "loading" }
  | { status: "error"; error: unknown; onRetry: () => void }
  | { status: "ready"; entries: WaterEntry[]; targetMl: number; onChanged: () => Promise<void> };

/** Water drunk today against the target, with one-tap cups, sachets and bottles. */
export function WaterPanel(props: Props) {
  return (
    <Panel title="Water" titleId="water-title">
      {props.status === "loading" ? (
        <PanelSkeleton lines={3} />
      ) : props.status === "error" ? (
        <PanelError error={props.error} onRetry={props.onRetry} />
      ) : (
        <WaterTracker {...props} />
      )}
    </Panel>
  );
}

function WaterTracker({
  entries,
  targetMl,
  onChanged,
}: {
  entries: WaterEntry[];
  targetMl: number;
  onChanged: () => Promise<void>;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [custom, setCustom] = useState("");
  const drunk = sumWaterMl(entries);
  const p = progressToward(drunk, targetMl);
  const last = entries.at(-1);

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setPending(key);
    setStatus(null);
    try {
      await action();
      await onChanged();
      setStatus({ kind: "success", text: success });
    } catch (e) {
      setStatus({ kind: "error", text: errorMessage(e) });
    } finally {
      setPending(null);
    }
  }

  function addCustom(e: FormEvent) {
    e.preventDefault();
    const parsed = waterEntrySchema.safeParse({ amountMl: toNumber(custom) });
    if (!parsed.success) {
      setStatus({
        kind: "error",
        text: parsed.error.issues[0]?.message ?? "Enter an amount in ml",
      });
      return;
    }
    void run(
      "custom",
      () => addWater(getSupabase(), { amountMl: parsed.data.amountMl, unitLabel: "ml" }),
      `Added ${parsed.data.amountMl} ml.`,
    ).then(() => setCustom(""));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <p>
          <span className="font-heading text-3xl font-bold tabular-nums">
            {formatLitres(drunk)}
          </span>
          <span className="text-muted-foreground"> of {formatLitres(targetMl)}</span>
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          {p.remaining > 0 ? `${formatLitres(p.remaining)} to go` : "Target reached"}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Water drunk today"
        aria-valuemin={0}
        aria-valuemax={targetMl}
        aria-valuenow={Math.min(drunk, targetMl)}
        aria-valuetext={`${formatLitres(drunk)} of ${formatLitres(targetMl)}, ${p.percent}%`}
        className="h-3 overflow-hidden rounded-full bg-surface"
      >
        <div
          className="bar-progress h-full rounded-full bg-water"
          style={{ width: `${p.fraction * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {WATER_PORTIONS.map((portion) => (
          <Button
            key={portion.id}
            variant="outline"
            className="h-auto flex-col gap-0.5 py-2.5"
            disabled={pending !== null}
            onClick={() =>
              run(
                portion.id,
                () => addWater(getSupabase(), { amountMl: portion.ml, unitLabel: portion.label }),
                `Added a ${portion.label.toLowerCase()} (${portion.ml} ml).`,
              )
            }
          >
            <span className="flex items-center gap-1 font-semibold">
              <Droplet className="size-3.5 text-water" aria-hidden="true" />
              {pending === portion.id ? "Adding…" : portion.label}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{portion.ml} ml</span>
          </Button>
        ))}
      </div>
      <form onSubmit={addCustom} className="flex gap-2">
        <label htmlFor="water-custom" className="sr-only">
          Other amount in millilitres
        </label>
        <Input
          id="water-custom"
          inputMode="numeric"
          placeholder="Other amount (ml)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="h-9"
        />
        <Button type="submit" variant="secondary" className="h-9" disabled={pending !== null}>
          Add
        </Button>
      </form>
      <div className="flex min-h-8 items-center justify-between gap-2">
        <p
          role={status?.kind === "error" ? "alert" : "status"}
          className={
            status?.kind === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {status?.text ?? (entries.length === 0 ? "No water logged yet today." : "")}
        </p>
        {last && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending !== null}
            onClick={() =>
              run(
                "undo",
                () => deleteWater(getSupabase(), last.id),
                `Removed ${last.amount_ml} ml.`,
              )
            }
          >
            <Undo2 aria-hidden="true" />
            Undo last
          </Button>
        )}
      </div>
    </div>
  );
}
