"use client";

import { signUp } from "@nutritrack/api-client";
import { signUpSchema } from "@nutritrack/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth-card";
import { FormAlert } from "@/components/form-alert";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { errorMessage, fieldErrors, type FieldErrors } from "@/lib/forms";
import { getSupabase } from "@/lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = signUpSchema.safeParse({
      email: data.get("email"),
      password: data.get("password"),
    });
    setFormError(null);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSubmitting(true);
    try {
      await signUp(getSupabase(), parsed.data);
      router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    } catch (error) {
      setFormError(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="Track Nigerian meals, calories and macros."
      footer={
        <p>
          Already have an account?{" "}
          <Link className="font-medium underline underline-offset-4" href="/sign-in">
            Sign in
          </Link>
        </p>
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
          autoComplete="new-password"
          required
          description="At least 8 characters, with letters and numbers."
          error={errors.password}
        />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
