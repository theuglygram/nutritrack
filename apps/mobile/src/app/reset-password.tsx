import { resetPassword, toUserMessage } from "@nutritrack/api-client";
import { firstErrorPerField, resetPasswordSchema, type FieldErrors } from "@nutritrack/schemas";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Body, Button, Card, FormAlert, Heading, Screen, TextField } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const parsed = resetPasswordSchema.safeParse({ email, code, password });
    setFormError(null);
    if (!parsed.success) return setErrors(firstErrorPerField(parsed.error));
    setErrors({});
    setSubmitting(true);
    try {
      await resetPassword(supabase, parsed.data);
      router.replace("/");
    } catch (error) {
      setFormError(toUserMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Heading>Choose a new password</Heading>
        <Body muted>Enter the 6-digit code we emailed you and your new password.</Body>
        <FormAlert kind="error" message={formError} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />
        <TextField
          label="Reset code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          error={errors.code}
        />
        <TextField
          label="New password"
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
          label="Save new password"
          loadingLabel="Saving…"
          loading={submitting}
          onPress={onSubmit}
        />
        <Button
          label="Didn't get a code? Send another"
          variant="link"
          onPress={() => router.back()}
        />
      </Card>
    </Screen>
  );
}
