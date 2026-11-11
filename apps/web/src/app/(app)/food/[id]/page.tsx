"use client";

import { deleteCustomFood, getFood, type FoodDetail } from "@nutritrack/api-client";
import { FOOD_LANGUAGE_LABELS, VERIFICATION_LABELS, CUSTOM_FOOD_LABEL } from "@nutritrack/core";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PanelError, PanelSkeleton } from "@/components/dashboard/panel";
import { VerificationBadge } from "@/components/food/food-badges";
import { NutrientTable } from "@/components/food/nutrient-table";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";
import { cn } from "cn";

const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 });

type State =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "missing" }
  | { status: "ready"; food: FoodDetail };

/** The food id comes from the URL, which is only known at request time, so it sits in Suspense. */
export default function FoodDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <FoodDetailContent />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <span className="sr-only">Loading food…</span>
      <PanelSkeleton lines={8} />
    </div>
  );
}

function FoodDetailContent() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getFood(getSupabase(), id).then(
      (food) => !cancelled && setState(food ? { status: "ready", food } : { status: "missing" }),
      (error: unknown) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/food"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to search
      </Link>
      {state.status === "loading" ? (
        <div role="status" className="flex flex-col gap-4">
          <span className="sr-only">Loading food…</span>
          <PanelSkeleton lines={8} />
        </div>
      ) : state.status === "error" ? (
        <PanelError
          error={state.error}
          onRetry={() => {
            setState({ status: "loading" });
            setAttempt((a) => a + 1);
          }}
        />
      ) : state.status === "missing" ? (
        <div className="rounded-2xl border border-dashed border-border p-6">
          <h1 className="text-2xl font-bold">Food not found</h1>
          <p className="mt-2 text-muted-foreground">
            It may have been removed, or it belongs to someone else.
          </p>
        </div>
      ) : (
        <Detail food={state.food} />
      )}
    </div>
  );
}

function Detail({ food }: { food: FoodDetail }) {
  const portions = [{ label: "100 g", grams: 100 }].concat(
    food.servings.map((s) => ({
      label: `1 ${s.unitName} (${nf.format(s.grams)} g)`,
      grams: s.grams,
    })),
  );
  const [portion, setPortion] = useState(0);
  const [customGrams, setCustomGrams] = useState("");
  const custom = Number(customGrams);
  const grams =
    portion === -1 && custom > 0 && custom <= 10000 ? custom : (portions[portion]?.grams ?? 100);
  const status = food.isCustom ? CUSTOM_FOOD_LABEL : VERIFICATION_LABELS[food.verificationStatus];

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <VerificationBadge status={food.verificationStatus} isCustom={food.isCustom} />
        <h1 className="text-3xl font-bold sm:text-4xl">{food.name}</h1>
        <p className="text-muted-foreground">
          {[food.category, food.cookingMethod].filter(Boolean).join(" · ")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section
          aria-labelledby="nutrients-title"
          className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 sm:p-6"
        >
          <h2 id="nutrients-title" className="text-lg font-semibold">
            Nutrition
          </h2>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm text-muted-foreground">Show values for</legend>
            <div className="flex flex-wrap gap-2">
              {portions.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={portion === i}
                  onClick={() => setPortion(i)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm font-medium aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary"
                >
                  {p.label}
                </button>
              ))}
              <label
                className={cn(
                  "flex items-center gap-1 rounded-full border border-border py-0.5 pr-3 pl-1 text-sm",
                  portion === -1 && "border-primary bg-primary-soft",
                )}
              >
                <span className="sr-only">Other amount in grams</span>
                <input
                  inputMode="decimal"
                  placeholder="Other"
                  value={customGrams}
                  onFocus={() => setPortion(-1)}
                  onChange={(e) => {
                    setCustomGrams(e.target.value);
                    setPortion(-1);
                  }}
                  className="w-16 rounded-full bg-transparent px-2 py-1 outline-none"
                />
                g
              </label>
            </div>
          </fieldset>
          <NutrientTable per100g={food.per100g} grams={grams} />
          <Button disabled className="h-11" aria-describedby="log-soon">
            Log this food
          </Button>
          <p id="log-soon" className="-mt-2 text-center text-xs text-muted-foreground">
            Logging food arrives in the next update.
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="source-title"
            className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-5"
          >
            <h2 id="source-title" className="text-lg font-semibold">
              Where these numbers come from
            </h2>
            <p className="text-sm">
              <span className="font-semibold">{status.label}.</span>{" "}
              <span className="text-muted-foreground">{status.description}</span>
            </p>
            {food.source ? (
              <dl className="flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd className="font-medium">{food.source.name}</dd>
                </div>
                {food.source.licence && (
                  <div>
                    <dt className="text-muted-foreground">Licence</dt>
                    <dd>{food.source.licence}</dd>
                  </div>
                )}
                {food.source.url && (
                  <a
                    href={food.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    Visit source
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </dl>
            ) : null}
            {food.notes && <p className="text-sm text-muted-foreground">{food.notes}</p>}
            {food.servings.some((s) => !s.isEstimate) && (
              <p className="text-sm text-muted-foreground">
                Serving weights are measured by the source.
              </p>
            )}
          </section>

          {food.aliases.length > 0 && (
            <section
              aria-labelledby="names-title"
              className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-5"
            >
              <h2 id="names-title" className="text-lg font-semibold">
                Also known as
              </h2>
              <ul className="flex flex-wrap gap-2">
                {food.aliases.map((a) => (
                  <li key={a.alias} className="rounded-full bg-surface px-3 py-1 text-sm">
                    {a.alias}{" "}
                    <span className="text-muted-foreground">
                      · {FOOD_LANGUAGE_LABELS[a.language]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {food.isCustom && <DeleteFood food={food} />}
        </div>
      </div>
    </article>
  );
}

function DeleteFood({ food }: { food: FoodDetail }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-5">
      {confirming ? (
        <>
          <p className="text-sm">Delete “{food.name}”? This can&apos;t be undone.</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError(null);
                try {
                  await deleteCustomFood(getSupabase(), food.id);
                  router.replace("/food");
                } catch (e) {
                  setError(errorMessage(e));
                  setPending(false);
                }
              }}
            >
              {pending ? "Deleting…" : "Delete food"}
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </div>
        </>
      ) : (
        <Button variant="ghost" className="w-fit" onClick={() => setConfirming(true)}>
          <Trash2 aria-hidden="true" />
          Delete this food
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
