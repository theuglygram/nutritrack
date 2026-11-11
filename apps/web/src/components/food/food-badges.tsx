import { CUSTOM_FOOD_LABEL, VERIFICATION_LABELS } from "@nutritrack/core";
import { BadgeCheck, CircleDashed, UserRound } from "lucide-react";
import { cn } from "cn";

type Status = keyof typeof VERIFICATION_LABELS;

/** How trustworthy a food's values are, always visible next to the food (ADR-013). */
export function VerificationBadge({
  status,
  isCustom,
  className,
}: {
  status: Status;
  isCustom: boolean;
  className?: string;
}) {
  const { label, description } = isCustom ? CUSTOM_FOOD_LABEL : VERIFICATION_LABELS[status];
  const Icon = isCustom ? UserRound : status === "verified" ? BadgeCheck : CircleDashed;
  return (
    <span
      title={description}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        isCustom
          ? "bg-surface text-foreground"
          : status === "verified"
            ? "bg-primary-soft text-primary"
            : "bg-carbs/15 text-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
