import { ApiError, resendSignUpCode, signIn, toUserMessage } from "@nutritrack/api-client";
import { APP_NAME } from "@nutritrack/core";
import { firstErrorPerField, signInSchema, type FieldErrors } from "@nutritrack/schemas";
import { router } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, FormAlert, Heading, Screen, TextField } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = signInSchema.safeParse({ email, password });
    setFormError(null);
    if (!parsed.success) return setErrors(firstErrorPerField(parsed.error));
    setErrors({});
    setSubmitting(true);
    try {
      await signIn(supabase, parsed.data);
      // The session change moves navigation to the signed-in screens.
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ApiError && error.code === "email_not_confirmed") {
        await resendSignUpCode(supabase, parsed.data.email).catch(() => undefined);
        router.push({ pathname: "/verify-email", params: { email: parsed.data.email } });
        return;
      }
      setFormError(toUserMessage(error));
    }
  }

  return (
    <Screen>
      <Body center>{APP_NAME}</Body>
      <Card>
        <Heading>Sign in</Heading>
        <FormAlert kind="error" message={formError} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          error={errors.password}
          onSubmitEditing={onSubmit}
        />
        <Button
          label="Sign in"
          loadingLabel="Signing in…"
          loading={submitting}
          onPress={onSubmit}
        />
        <Button
          label="Forgot your password?"
          variant="link"
          onPress={() => router.push("/forgot-password")}
        />
        <Button
          label="New to NutriTrack? Create an account"
          variant="link"
          onPress={() => router.push("/sign-up")}
        />
      </Card>
    </Screen>
  );
}
