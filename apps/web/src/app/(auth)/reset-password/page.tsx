"use client";

import { resetPassword } from "@nutritrack/api-client";
import { resetPasswordSchema } from "@nutritrack/schemas";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormAlert } from "@/components/form-alert";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { errorMessage, fieldErrors, type FieldErrors } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPassword />
    </Suspense>
  );
}

function ResetPassword() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      email: data.get("email"),
      code: data.get("code"),
      password: data.get("password"),
    });
    setFormError(null);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    try {
      await resetPassword(getSupabase(), parsed.data);
      router.replace("/");
      router.refresh();
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="Enter the 6-digit code we emailed you and your new password."
      footer={
        <Link className="underline underline-offset-4" href="/forgot-password">
          Didn’t get a code? Send another
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
          defaultValue={email}
          required
          error={errors.email}
        />
        <TextField
          label="Reset code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          error={errors.code}
        />
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          description="At least 8 characters, with letters and numbers."
          error={errors.password}
        />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </AuthCard>
  );
}
