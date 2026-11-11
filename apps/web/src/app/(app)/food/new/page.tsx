"use client";

import { createCustomFood } from "@nutritrack/api-client";
import { CUSTOM_FOOD_SERVING_UNITS, customFoodSchema } from "@nutritrack/schemas";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert } from "@/components/form-alert";
import { PageHeader } from "@/components/page-header";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { errorMessage, fieldErrors, toNumber, type FieldErrors } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

const EMPTY = {
  name: "",
  category: "",
  energyKcal: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  fibreG: "",
  sugarG: "",
  sodiumMg: "",
  servingUnit: "",
  servingGrams: "",
};

export default function NewFoodPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const candidate = {
      name: form.name,
      category: form.category.trim() || undefined,
      energyKcal: toNumber(form.energyKcal),
      proteinG: toNumber(form.proteinG),
      carbsG: toNumber(form.carbsG),
      fatG: toNumber(form.fatG),
      fibreG: toNumber(form.fibreG),
      sugarG: toNumber(form.sugarG),
      sodiumMg: toNumber(form.sodiumMg),
      serving:
        form.servingUnit || form.servingGrams
          ? { unit: form.servingUnit || "serving", grams: toNumber(form.servingGrams) }
          : undefined,
    };
    const parsed = customFoodSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const id = await createCustomFood(getSupabase(), parsed.data);
      router.replace(`/food/${id}`);
    } catch (err) {
      setMessage(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link
        href="/food"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to search
      </Link>
      <PageHeader
        title="Add your own food"
        description="Only you will see it. Copy the values from a food label, per 100 g."
      />
      <form
        onSubmit={submit}
        noValidate
        className="flex flex-col gap-6 rounded-2xl border border-border/80 bg-card p-5 sm:p-6"
      >
        <FormAlert kind="error" message={message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" value={form.name} onChange={set("name")} error={errors.name} />
          <TextField
            label="Category (optional)"
            value={form.category}
            onChange={set("category")}
            error={errors.category}
            placeholder="e.g. Snacks"
          />
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-semibold">Per 100 g</legend>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <TextField
              label="Calories (kcal)"
              inputMode="decimal"
              value={form.energyKcal}
              onChange={set("energyKcal")}
              error={errors.energyKcal}
            />
            <TextField
              label="Protein (g)"
              inputMode="decimal"
              value={form.proteinG}
              onChange={set("proteinG")}
              error={errors.proteinG}
            />
            <TextField
              label="Carbs (g)"
              inputMode="decimal"
              value={form.carbsG}
              onChange={set("carbsG")}
              error={errors.carbsG}
            />
            <TextField
              label="Fat (g)"
              inputMode="decimal"
              value={form.fatG}
              onChange={set("fatG")}
              error={errors.fatG}
            />
            <TextField
              label="Fibre (g, optional)"
              inputMode="decimal"
              value={form.fibreG}
              onChange={set("fibreG")}
              error={errors.fibreG}
            />
            <TextField
              label="Sugar (g, optional)"
              inputMode="decimal"
              value={form.sugarG}
              onChange={set("sugarG")}
              error={errors.sugarG}
            />
            <TextField
              label="Sodium (mg, optional)"
              inputMode="decimal"
              value={form.sodiumMg}
              onChange={set("sodiumMg")}
              error={errors.sodiumMg}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Leave optional values empty if the label doesn&apos;t show them — they&apos;ll be marked
            unknown, not zero.
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 font-semibold">Serving size (optional)</legend>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="serving-unit" className="text-sm font-medium">
                Unit
              </label>
              <select
                id="serving-unit"
                value={form.servingUnit}
                onChange={set("servingUnit")}
                aria-invalid={Boolean(errors["serving.unit"]) || undefined}
                className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="">None</option>
                {CUSTOM_FOOD_SERVING_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              label="Weight of one (g)"
              inputMode="decimal"
              value={form.servingGrams}
              onChange={set("servingGrams")}
              error={errors["serving.grams"]}
            />
          </div>
        </fieldset>

        <Button type="submit" className="h-11" disabled={pending}>
          {pending ? "Saving…" : "Save food"}
        </Button>
      </form>
    </div>
  );
}
