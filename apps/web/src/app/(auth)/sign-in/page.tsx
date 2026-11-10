"use client";

import { ApiError, resendSignUpCode, signIn } from "@nutritrack/api-client";
import { signInSchema } from "@nutritrack/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormAlert } from "@/components/form-alert";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { errorMessage, fieldErrors, type FieldErrors } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

export default function SignInPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
    });
    setFormError(null);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    const client = getSupabase();
    try {
      await signIn(client, parsed.data);
      router.replace("/");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "email_not_confirmed") {
        // Unconfirmed account: send a fresh code and continue confirmation.
        await resendSignUpCode(client, parsed.data.email).catch(() => undefined);
        router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
        return;
      }
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      footer={
        <>
          <Link className="underline underline-offset-4" href="/forgot-password">
            Forgot your password?
          </Link>
          <p>
            New to NutriTrack?{" "}
            <Link className="font-medium underline underline-offset-4" href="/sign-up">
              Create an account
            </Link>
          </p>
        </>
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
          error={errors.email}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}
