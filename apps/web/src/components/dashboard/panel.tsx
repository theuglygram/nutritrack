import { RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/forms";
import { cn } from "cn";

/** The dashboard's card surface: a titled section with an optional action. */
export function Panel({
  title,
  action,
  children,
  className,
  titleId,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  titleId?: string;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_2px_rgb(28_31_26/0.04)] sm:p-6",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** A section that failed to load, with a retry. */
export function PanelError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-destructive/8 p-4">
      <p className="text-sm text-destructive">{errorMessage(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

/** Skeleton lines matching a panel's rough shape. */
export function PanelSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn("h-4", i === 0 ? "w-1/2" : i % 2 ? "w-full" : "w-4/5")} />
      ))}
    </div>
  );
}
