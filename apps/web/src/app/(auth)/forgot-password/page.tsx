"use client";

import { requestPasswordReset } from "@nutritrack/api-client";
import { requestPasswordResetSchema } from "@nutritrack/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormAlert } from "@/components/form-alert";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = requestPasswordResetSchema.safeParse({
      email: new FormData(event.currentTarget).get("email"),
    });
    setFormError(null);
    if (!parsed.success) return setEmailError(parsed.error.issues[0]?.message);
    setEmailError(undefined);
    setSubmitting(true);
    try {
      await requestPasswordReset(getSupabase(), parsed.data);
      router.push(`/reset-password?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email and we'll send you a 6-digit code."
      footer={
        <Link className="underline underline-offset-4" href="/sign-in">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert kind="error" message={formError} />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={emailError}
        />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Sending…" : "Send code"}
        </Button>
      </form>
    </AuthCard>
  );
}
