import { Camera, MessageSquareText, PenLine, Search, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "cn";

type Action = {
  label: string;
  hint: string;
  icon: LucideIcon;
  prominent?: boolean;
  /** Set when the feature exists; otherwise the action is shown disabled as "Soon". */
  href?: string;
};

const ACTIONS: Action[] = [
  { label: "Snap your meal", hint: "Photo recognition", icon: Camera, prominent: true },
  { label: "Search food", hint: "Nigerian food database", icon: Search, href: "/food" },
  { label: "Describe your meal", hint: "Type what you ate", icon: MessageSquareText },
  { label: "Quick entry", hint: "Enter it yourself", icon: PenLine },
];

/**
 * Ways to log food. Search works (Stage 04); logging itself arrives in Stage 05 and photo
 * recognition in Stage 11, so those actions are disabled and say so rather than going nowhere.
 */
export function QuickActions() {
  return (
    <section aria-labelledby="log-food-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="log-food-title" className="text-lg font-semibold">
          Log food
        </h2>
        <p id="log-food-status" className="text-sm text-muted-foreground">
          Food logging is coming soon
        </p>
      </div>
      <ul className="grid grid-cols-3 gap-3 lg:grid-cols-4">
        {ACTIONS.map((a) => {
          const className = cn(
            "flex h-full w-full gap-3 rounded-2xl border p-4 text-left",
            a.prominent ? "items-center" : "flex-col items-start sm:flex-row sm:items-center",
            a.prominent
              ? "border-transparent bg-forest text-on-forest"
              : "border-border/80 bg-card",
            a.href
              ? "transition hover:border-primary/40 hover:bg-surface/60"
              : "cursor-not-allowed",
          );
          const content: ReactNode = (
            <>
              <span
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-xl",
                  a.prominent ? "bg-lime text-lime-foreground" : "bg-primary-soft text-primary",
                )}
                aria-hidden="true"
              >
                <a.icon className="size-5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold">{a.label}</span>
                <span
                  className={cn(
                    "text-xs",
                    !a.prominent && "hidden sm:inline",
                    a.prominent ? "text-on-forest/75" : "text-muted-foreground",
                  )}
                >
                  {a.href ? a.hint : `${a.hint} · Soon`}
                </span>
              </span>
            </>
          );
          return (
            <li key={a.label} className={cn(a.prominent && "col-span-3 lg:col-span-1")}>
              {a.href ? (
                <Link href={a.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-describedby="log-food-status"
                  className={className}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
