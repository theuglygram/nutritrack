import { signUp, toUserMessage } from "@nutritrack/api-client";
import { APP_NAME } from "@nutritrack/core";
import { firstErrorPerField, signUpSchema, type FieldErrors } from "@nutritrack/schemas";
import { router } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, FormAlert, Heading, Screen, TextField } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = signUpSchema.safeParse({ email, password });
    setFormError(null);
    if (!parsed.success) return setErrors(firstErrorPerField(parsed.error));
    setErrors({});
    setSubmitting(true);
    try {
      await signUp(supabase, parsed.data);
      router.push({ pathname: "/verify-email", params: { email: parsed.data.email } });
    } catch (error) {
      setFormError(toUserMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Body center>{APP_NAME}</Body>
      <Card>
        <Heading>Create your account</Heading>
        <Body muted>Track Nigerian meals, calories and macros.</Body>
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
          autoComplete="new-password"
          textContentType="newPassword"
          description="At least 8 characters, with letters and numbers."
          error={errors.password}
          onSubmitEditing={onSubmit}
        />
        <Button
          label="Create account"
          loadingLabel="Creating account…"
          loading={submitting}
          onPress={onSubmit}
        />
        <Button
          label="Already have an account? Sign in"
          variant="link"
          onPress={() => router.back()}
        />
      </Card>
    </Screen>
  );
}
