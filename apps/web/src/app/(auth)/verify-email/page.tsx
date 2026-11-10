"use client";

import { resendSignUpCode, verifySignUpCode } from "@nutritrack/api-client";
import { otpCodeSchema } from "@nutritrack/schemas";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormAlert } from "@/components/form-alert";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmail />
    </Suspense>
  );
}

function VerifyEmail() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [codeError, setCodeError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <AuthCard
        title="Confirm your email"
        footer={
          <Link className="underline" href="/sign-up">
            Back to sign up
          </Link>
        }
      >
        <FormAlert
          kind="error"
          message="We don't know which email to confirm. Please sign up or sign in again."
        />
      </AuthCard>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = otpCodeSchema.safeParse(new FormData(event.currentTarget).get("code"));
    setFormError(null);
    setNotice(null);
    if (!parsed.success) return setCodeError(parsed.error.issues[0]?.message);
    setCodeError(undefined);
    setSubmitting(true);
    try {
      await verifySignUpCode(getSupabase(), { email, code: parsed.data });
      router.replace("/onboarding");
      router.refresh();
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  async function onResend() {
    setResending(true);
    setFormError(null);
    try {
      await resendSignUpCode(getSupabase(), email);
      setNotice("We've sent a new code.");
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthCard
      title="Confirm your email"
      description={
        <>
          We sent a 6-digit code to <strong>{email}</strong>. It expires in 30 minutes.
        </>
      }
      footer={
        <Button variant="link" onClick={onResend} disabled={resending}>
          {resending ? "Sending…" : "Send a new code"}
        </Button>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormAlert kind="error" message={formError} />
        <FormAlert kind="success" message={notice} />
        <TextField
          label="Confirmation code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          error={codeError}
        />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Confirming…" : "Confirm email"}
        </Button>
      </form>
    </AuthCard>
  );
}
