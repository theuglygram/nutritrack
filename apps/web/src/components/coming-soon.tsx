import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";

/**
 * An honest page for a navigation destination that isn't built yet: what it will do and that
 * it's coming, with no pretend controls.
 */
export function ComingSoon({
  title,
  description,
  art,
  planned,
}: {
  title: string;
  description: string;
  art: ReactNode;
  planned: string[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={title} description={description} />
      <section className="grid items-center gap-8 overflow-hidden rounded-2xl border border-border/80 bg-card p-6 sm:grid-cols-[1fr_auto] sm:p-8">
        <div className="flex flex-col gap-4">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-semibold">
            <span aria-hidden="true" className="size-2 rounded-full bg-carbs" />
            Coming soon
          </p>
          <h2 className="text-2xl font-semibold">What you&apos;ll be able to do</h2>
          <ul className="flex flex-col gap-3">
            {planned.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/home"
            className="mt-2 inline-flex w-fit items-center gap-2 font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to today
          </Link>
        </div>
        <div className="mx-auto w-48 sm:w-56" aria-hidden="true">
          {art}
        </div>
      </section>
    </div>
  );
}
