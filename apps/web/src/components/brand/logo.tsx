import { APP_NAME } from "@nutritrack/core";
import Link from "next/link";
import { cn } from "cn";

/** The NutriTrack mark: a progress ring around a leaf. Decorative; the wordmark carries the name. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <circle
        cx="16"
        cy="16"
        r="9.5"
        fill="none"
        strokeWidth="2.6"
        className="stroke-primary-foreground/20"
      />
      <circle
        cx="16"
        cy="16"
        r="9.5"
        fill="none"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="44.8 59.7"
        transform="rotate(-90 16 16)"
        className="stroke-lime"
      />
      <path
        d="M12.4 19.6C12.4 15.2 15.1 12.4 19.6 12.4C19.6 16.9 16.9 19.6 12.4 19.6Z"
        className="fill-primary-foreground"
      />
      <path
        d="M12.9 19.1L18.2 13.8"
        strokeWidth="0.9"
        strokeLinecap="round"
        className="stroke-primary"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  size = "md",
}: {
  href?: string;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg font-heading font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        size === "lg" ? "text-2xl" : "text-xl",
        className,
      )}
    >
      <LogoMark className={size === "lg" ? "size-10" : undefined} />
      <span>{APP_NAME}</span>
    </Link>
  );
}
