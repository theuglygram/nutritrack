"use client";

import {
  listMyFoods,
  searchFoods,
  type FoodSearchResult,
  type MyFood,
} from "@nutritrack/api-client";
import { FOOD_LANGUAGE_LABELS } from "@nutritrack/core";
import { ChevronRight, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PanelError, PanelSkeleton } from "@/components/dashboard/panel";
import { VerificationBadge } from "@/components/food/food-badges";
import { PageHeader } from "@/components/page-header";
import { getSupabase } from "@/lib/supabase";
import { cn } from "cn";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

type Results =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "error"; query: string; error: unknown }
  | { status: "ready"; query: string; items: FoodSearchResult[] };

const EXAMPLES = ["ewa", "dodo", "isu", "shinkafa", "groundnut", "palm oil"];

export default function FoodPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);
  const term = query.trim();

  // Search as the user types, 250 ms after they pause; stale responses are ignored.
  useEffect(() => {
    if (term.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setResults({ status: "loading", query: term });
      searchFoods(getSupabase(), term).then(
        (items) => !cancelled && setResults({ status: "ready", query: term, items }),
        (error: unknown) => !cancelled && setResults({ status: "error", query: term, error }),
      );
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, attempt]);

  const showing = term.length < 2 ? { status: "idle" as const } : results;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Food"
        description="Search Nigerian foods and ingredients by English or local names."
        action={
          <Link
            href="/food/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-surface"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add your own food
          </Link>
        }
      />

      <search role="search" className="relative">
        <label htmlFor="food-search" className="sr-only">
          Search foods
        </label>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id="food-search"
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          autoFocus
          placeholder="Try “ewa”, “dodo” or “rice”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 w-full rounded-2xl border border-border bg-card pr-12 pl-12 text-lg shadow-[0_1px_2px_rgb(28_31_26/0.04)] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-surface"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </search>

      <div aria-live="polite" className="flex flex-col gap-3">
        {showing.status === "idle" ? (
          <Idle onExample={setQuery} />
        ) : showing.status === "loading" ? (
          <div className="rounded-2xl border border-border/80 bg-card p-5">
            <span className="sr-only">Searching…</span>
            <PanelSkeleton lines={5} />
          </div>
        ) : showing.status === "error" ? (
          <PanelError error={showing.error} onRetry={() => setAttempt((a) => a + 1)} />
        ) : showing.items.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border p-6">
            <p className="font-semibold">No foods match “{showing.query}”.</p>
            <p className="text-muted-foreground">
              Our Nigerian food database is still growing. You can add this food yourself — only you
              will see it.
            </p>
            <Link href="/food/new" className="font-semibold text-primary hover:underline">
              Add “{showing.query}” as your own food
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {showing.items.length} {showing.items.length === 1 ? "food" : "foods"} for “
              {showing.query}”
            </p>
            <ul className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
              {showing.items.map((food) => (
                <li key={food.id} className="border-b border-border/70 last:border-b-0">
                  <ResultRow food={food} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function ResultRow({ food }: { food: FoodSearchResult }) {
  return (
    <Link
      href={`/food/${food.id}`}
      className="flex items-center gap-4 px-5 py-4 transition hover:bg-surface/60 focus-visible:bg-surface/60 focus-visible:outline-none"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-semibold">{food.name}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {food.matchedAlias && (
            <span>
              “{food.matchedAlias.alias}” · {FOOD_LANGUAGE_LABELS[food.matchedAlias.language]}
            </span>
          )}
          {food.category && <span>{food.category}</span>}
          <VerificationBadge status={food.verificationStatus} isCustom={food.isCustom} />
        </span>
      </div>
      <span className="text-right">
        <span className="block font-heading text-lg font-semibold tabular-nums">
          {food.energyKcal === null ? "—" : nf.format(food.energyKcal)}
        </span>
        <span className="text-xs text-muted-foreground">kcal / 100 g</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

function Idle({ onExample }: { onExample: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Try a local name</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => onExample(ex)}
              className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:bg-surface"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
      <MyFoods />
      <p className="text-sm text-muted-foreground">
        Values come from documented sources and are labelled until our dietitian has reviewed them.
        Nigerian dishes like jollof and egusi soup will be added once their recipes are sourced.
        Logging food arrives in the next update.
      </p>
    </div>
  );
}

function MyFoods() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; error: unknown }
    | { status: "ready"; items: MyFood[] }
  >({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listMyFoods(getSupabase()).then(
      (items) => !cancelled && setState({ status: "ready", items }),
      (error: unknown) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <section aria-labelledby="my-foods-title" className="flex flex-col gap-3">
      <h2 id="my-foods-title" className="text-lg font-semibold">
        Your foods
      </h2>
      {state.status === "loading" ? (
        <PanelSkeleton lines={2} />
      ) : state.status === "error" ? (
        <PanelError
          error={state.error}
          onRetry={() => {
            setState({ status: "loading" });
            setAttempt((a) => a + 1);
          }}
        />
      ) : state.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Foods you add yourself appear here.
        </p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card">
          {state.items.map((f) => (
            <li key={f.id} className="border-b border-border/70 last:border-b-0">
              <Link
                href={`/food/${f.id}`}
                className={cn(
                  "flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface/60",
                )}
              >
                <span className="font-medium">{f.name}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {f.energyKcal === null ? "—" : `${nf.format(f.energyKcal)} kcal / 100 g`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
