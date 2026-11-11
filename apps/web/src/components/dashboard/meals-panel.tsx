"use client";

import { deleteLogEntry, type LogEntry } from "@nutritrack/api-client";
import {
  MEAL_SLOTS,
  MEAL_SLOT_LABELS,
  groupByMealSlot,
  sumLoggedNutrients,
  type MealSlot,
} from "@nutritrack/core";
import { Coffee, Cookie, Moon, Plus, Sun, Trash2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";
import { Panel, PanelError, PanelSkeleton } from "./panel";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });
const SLOT_ICONS: Record<MealSlot, LucideIcon> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

type Props =
  | { status: "loading" }
  | { status: "error"; error: unknown; onRetry: () => void }
  | { status: "ready"; entries: LogEntry[]; onChanged: () => Promise<void> };

/** Today's meals by slot: entries with serving and calories, slot totals, delete. */
export function MealsPanel(props: Props) {
  return (
    <Panel title="Today's meals" titleId="meals-title">
      {props.status === "loading" ? (
        <PanelSkeleton lines={6} />
      ) : props.status === "error" ? (
        <PanelError error={props.error} onRetry={props.onRetry} />
      ) : (
        <MealTimeline entries={props.entries} onChanged={props.onChanged} />
      )}
    </Panel>
  );
}

function MealTimeline({
  entries,
  onChanged,
}: {
  entries: LogEntry[];
  onChanged: () => Promise<void>;
}) {
  const groups = groupByMealSlot(entries);
  return (
    <ol className="flex flex-col">
      {MEAL_SLOTS.map((slot, i) => {
        const items = groups[slot];
        const total = sumLoggedNutrients(items).energyKcal;
        const Icon = SLOT_ICONS[slot];
        const name = MEAL_SLOT_LABELS[slot];
        return (
          <li key={slot} className="relative flex gap-4 pb-6 last:pb-0">
            {i < MEAL_SLOTS.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute top-12 bottom-1 left-[1.375rem] w-px bg-border"
              />
            )}
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-primary"
            >
              <Icon className="size-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{name}</h3>
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <span className="text-sm font-semibold tabular-nums">
                      {nf.format(total)} kcal
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    aria-label={`Add food to ${name.toLowerCase()} (coming soon)`}
                  >
                    <Plus aria-hidden="true" />
                    Add
                  </Button>
                </div>
              </div>
              {items.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  Nothing logged for {name.toLowerCase()} yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {items.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} onChanged={onChanged} />
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EntryRow({ entry, onChanged }: { entry: LogEntry; onChanged: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serving = entry.serving_unit_name
    ? `${nf.format(entry.quantity)} ${entry.serving_unit_name} · ${nf.format(entry.grams)} g`
    : `${nf.format(entry.grams)} g`;

  async function remove() {
    setPending(true);
    setError(null);
    try {
      await deleteLogEntry(getSupabase(), entry.id);
      await onChanged();
    } catch (e) {
      setError(errorMessage(e));
      setPending(false);
    }
  }

  return (
    <li className="flex flex-col gap-1 rounded-xl bg-surface/60 p-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-card font-heading font-semibold text-primary"
        >
          {entry.food_name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{entry.food_name}</p>
          <p className="text-sm text-muted-foreground">{serving}</p>
        </div>
        <span className="text-sm font-semibold tabular-nums">
          {entry.energy_kcal === null ? "Unknown kcal" : `${nf.format(entry.energy_kcal)} kcal`}
        </span>
        {confirming ? (
          <span className="flex gap-1">
            <Button variant="destructive" size="sm" disabled={pending} onClick={remove}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setConfirming(false)}
            >
              Keep
            </Button>
          </span>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${entry.food_name}`}
            onClick={() => setConfirming(true)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}
