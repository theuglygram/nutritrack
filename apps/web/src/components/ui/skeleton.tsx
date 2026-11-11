import { cn } from "cn";

/** Placeholder block shown while content loads. Hidden from screen readers; pair with a status. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg bg-surface", className)}
      {...props}
    />
  );
}

export { Skeleton };
