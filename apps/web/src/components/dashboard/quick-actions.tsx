import { Camera, MessageSquareText, PenLine, Search, type LucideIcon } from "lucide-react";
import { cn } from "cn";

const ACTIONS: { label: string; hint: string; icon: LucideIcon; prominent?: boolean }[] = [
  { label: "Snap your meal", hint: "Photo recognition", icon: Camera, prominent: true },
  { label: "Search food", hint: "Nigerian food database", icon: Search },
  { label: "Describe your meal", hint: "Type what you ate", icon: MessageSquareText },
  { label: "Quick entry", hint: "Enter it yourself", icon: PenLine },
];

/**
 * Ways to log food. Logging isn't built yet (food database and logging are Stages 04–05, photo
 * recognition Stage 11), so these are shown disabled and say so, rather than going nowhere.
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
        {ACTIONS.map((a) => (
          <li key={a.label} className={cn(a.prominent && "col-span-3 lg:col-span-1")}>
            <button
              type="button"
              disabled
              aria-describedby="log-food-status"
              className={cn(
                "flex h-full w-full cursor-not-allowed gap-3 rounded-2xl border p-4 text-left",
                a.prominent ? "items-center" : "flex-col items-start sm:flex-row sm:items-center",
                a.prominent
                  ? "border-transparent bg-forest text-on-forest"
                  : "border-border/80 bg-card",
              )}
            >
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
                  {a.hint} · Soon
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
