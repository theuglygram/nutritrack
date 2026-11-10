import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** Form-level error or success message, announced to screen readers. */
export function FormAlert({
  kind,
  message,
}: {
  kind: "error" | "success";
  message: string | null;
}) {
  if (!message) return null;
  return (
    <Alert
      variant={kind === "error" ? "destructive" : "default"}
      role={kind === "error" ? "alert" : "status"}
    >
      {kind === "error" ? <CircleAlert aria-hidden /> : <CircleCheck aria-hidden />}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
