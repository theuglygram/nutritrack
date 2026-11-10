"use client";

import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/form-alert";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 items-center justify-center p-12">
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <FormAlert kind="error" message={message} />
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
