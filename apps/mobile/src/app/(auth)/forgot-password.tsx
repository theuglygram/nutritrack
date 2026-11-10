import { requestPasswordReset, toUserMessage } from "@nutritrack/api-client";
import { requestPasswordResetSchema } from "@nutritrack/schemas";
import { router } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, FormAlert, Heading, Screen, TextField } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = requestPasswordResetSchema.safeParse({ email });
    setFormError(null);
    if (!parsed.success) return setEmailError(parsed.error.issues[0]?.message);
    setEmailError(undefined);
    setSubmitting(true);
    try {
      await requestPasswordReset(supabase, parsed.data);
      router.push({ pathname: "/reset-password", params: { email: parsed.data.email } });
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Heading>Reset your password</Heading>
        <Body muted>Enter your email and we’ll send you a 6-digit code.</Body>
        <FormAlert kind="error" message={formError} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={emailError}
          onSubmitEditing={onSubmit}
        />
        <Button label="Send code" loadingLabel="Sending…" loading={submitting} onPress={onSubmit} />
        <Button label="Back to sign in" variant="link" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}
