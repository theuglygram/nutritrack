import { resendSignUpCode, toUserMessage, verifySignUpCode } from "@nutritrack/api-client";
import { otpCodeSchema } from "@nutritrack/schemas";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, FormAlert, Heading, Screen, TextField } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function VerifyEmailScreen() {
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    return (
      <Screen>
        <FormAlert
          kind="error"
          message="We don't know which email to confirm. Please sign up or sign in again."
        />
        <Button
          label="Back to sign in"
          variant="outline"
          onPress={() => router.replace("/sign-in")}
        />
      </Screen>
    );
  }

  async function onSubmit() {
    const parsed = otpCodeSchema.safeParse(code);
    setFormError(null);
    setNotice(null);
    if (!parsed.success) return setCodeError(parsed.error.issues[0]?.message);
    setCodeError(undefined);
    setSubmitting(true);
    try {
      await verifySignUpCode(supabase, { email, code: parsed.data });
      // Signed in now: navigation moves to onboarding automatically.
    } catch (error) {
      setFormError(toUserMessage(error));
      setSubmitting(false);
    }
  }

  async function onResend() {
    setResending(true);
    setFormError(null);
    try {
      await resendSignUpCode(supabase, email);
      setNotice("We've sent a new code.");
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Heading>Confirm your email</Heading>
        <Body muted>We sent a 6-digit code to {email}. It expires in 30 minutes.</Body>
        <FormAlert kind="error" message={formError} />
        <FormAlert kind="success" message={notice} />
        <TextField
          label="Confirmation code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          error={codeError}
          onSubmitEditing={onSubmit}
        />
        <Button
          label="Confirm email"
          loadingLabel="Confirming…"
          loading={submitting}
          onPress={onSubmit}
        />
        <Button
          label="Send a new code"
          loadingLabel="Sending…"
          variant="link"
          loading={resending}
          onPress={onResend}
        />
      </Card>
    </Screen>
  );
}
