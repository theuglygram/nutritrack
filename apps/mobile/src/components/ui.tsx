import { useId, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONTS, RADIUS, TOUCH_TARGET, useColors } from "@/lib/theme";

/** Scrollable, keyboard-aware page with safe-area padding and a readable max width. */
export function Screen({
  children,
  edges,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  edges?: ("top" | "bottom")[];
  /** Enables pull-to-refresh when both are given. */
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const c = useColors();
  return (
    <SafeAreaView
      edges={edges ?? ["top", "bottom"]}
      style={[styles.flex, { backgroundColor: c.background }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.screen}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor={c.primary}
                colors={[c.primary]}
              />
            ) : undefined
          }
        >
          <View style={styles.column}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Heading({ children, level = 1 }: { children: ReactNode; level?: 1 | 2 }) {
  const c = useColors();
  return (
    <Text
      accessibilityRole="header"
      style={[level === 1 ? styles.h1 : styles.h2, { color: c.foreground }]}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
  center,
}: {
  children: ReactNode;
  muted?: boolean;
  center?: boolean;
}) {
  const c = useColors();
  return (
    <Text style={[styles.body, { color: muted ? c.muted : c.foreground }, center && styles.center]}>
      {children}
    </Text>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {children}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "link";
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  loadingLabel,
  disabled,
}: ButtonProps) {
  const c = useColors();
  const isDisabled = Boolean(disabled || loading);
  const text = loading && loadingLabel ? loadingLabel : label;
  const color = variant === "primary" ? c.primaryForeground : c.foreground;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && { backgroundColor: c.primary },
        variant === "outline" && { borderWidth: 1, borderColor: c.border },
        variant === "link" && styles.linkButton,
        (pressed || isDisabled) && { opacity: 0.6 },
      ]}
    >
      {loading && <ActivityIndicator color={color} />}
      <Text style={[styles.buttonText, { color }, variant === "link" && styles.underline]}>
        {text}
      </Text>
    </Pressable>
  );
}

type TextFieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string | undefined;
  description?: string;
};

/** Labelled input; description and error are read out with the field. */
export function TextField({ label, error, description, ...inputProps }: TextFieldProps) {
  const c = useColors();
  const hint = [description, error].filter(Boolean).join(". ");
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint || undefined}
        placeholderTextColor={c.muted}
        style={[
          styles.input,
          { color: c.foreground, borderColor: error ? c.destructive : c.border },
        ]}
        {...inputProps}
      />
      {description && <Text style={[styles.small, { color: c.muted }]}>{description}</Text>}
      {error && (
        <Text accessibilityLiveRegion="polite" style={[styles.small, { color: c.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

export type Choice<T extends string> = { value: T; label: string; description?: string };

/** Single-choice question announced as a radio group. */
export function ChoiceGroup<T extends string>({
  legend,
  choices,
  value,
  onChange,
  error,
}: {
  legend: string;
  choices: Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  error?: string | undefined;
}) {
  const c = useColors();
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={legend}>
      <Text style={[styles.label, { color: c.foreground }]}>{legend}</Text>
      {choices.map((choice) => {
        const checked = choice.value === value;
        return (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityState={{ checked }}
            accessibilityLabel={
              choice.description ? `${choice.label}. ${choice.description}` : choice.label
            }
            onPress={() => onChange(choice.value)}
            style={[
              styles.choice,
              {
                borderColor: checked ? c.primary : c.border,
                backgroundColor: checked ? c.surface : "transparent",
              },
            ]}
          >
            <View style={[styles.radio, { borderColor: checked ? c.primary : c.muted }]}>
              {checked && <View style={[styles.radioDot, { backgroundColor: c.primary }]} />}
            </View>
            <View style={styles.flex}>
              <Text style={[styles.choiceLabel, { color: c.foreground }]}>{choice.label}</Text>
              {choice.description && (
                <Text style={[styles.small, { color: c.muted }]}>{choice.description}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
      {error && (
        <Text accessibilityLiveRegion="polite" style={[styles.small, { color: c.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | undefined;
}) {
  const c = useColors();
  return (
    <View style={styles.field}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        onPress={() => onChange(!checked)}
        style={styles.checkboxRow}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: error ? c.destructive : c.muted,
              backgroundColor: checked ? c.primary : "transparent",
            },
          ]}
        >
          {checked && <Text style={{ color: c.primaryForeground, fontWeight: "700" }}>✓</Text>}
        </View>
        <Text style={[styles.body, styles.flex, { color: c.foreground }]}>{label}</Text>
      </Pressable>
      {error && (
        <Text accessibilityLiveRegion="polite" style={[styles.small, { color: c.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

/** Form-level error or success message, announced to screen readers. */
export function FormAlert({
  kind,
  message,
}: {
  kind: "error" | "success";
  message: string | null;
}) {
  const c = useColors();
  if (!message) return null;
  const color = kind === "error" ? c.destructive : c.success;
  return (
    <View
      accessibilityRole={kind === "error" ? "alert" : "summary"}
      accessibilityLiveRegion="assertive"
      style={[styles.alert, { borderColor: color }]}
    >
      <Text style={[styles.body, { color }]}>{message}</Text>
    </View>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const c = useColors();
  const id = useId();
  return (
    <View
      nativeID={id}
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      style={[styles.centerFill, { backgroundColor: c.background }]}
    >
      <ActivityIndicator color={c.foreground} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Screen>
      <FormAlert kind="error" message={message} />
      <Button label="Try again" variant="outline" onPress={onRetry} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flexGrow: 1, padding: 16, alignItems: "center" },
  column: { width: "100%", maxWidth: 480, gap: 16 },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  h1: { fontSize: 28, lineHeight: 32, fontFamily: FONTS.heading, letterSpacing: -0.5 },
  h2: { fontSize: 20, lineHeight: 24, fontFamily: FONTS.headingSemibold, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 23, fontFamily: FONTS.body },
  small: { fontSize: 14, lineHeight: 19, fontFamily: FONTS.body },
  label: { fontSize: 15, fontFamily: FONTS.bodySemibold },
  card: { borderWidth: 1, borderRadius: RADIUS.lg, padding: 18, gap: 12 },
  field: { gap: 6 },
  input: {
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  button: {
    minHeight: TOUCH_TARGET,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  linkButton: { alignSelf: "center" },
  buttonText: { fontSize: 16, fontFamily: FONTS.bodySemibold },
  underline: { textDecorationLine: "underline", fontFamily: FONTS.bodyMedium },
  choice: {
    minHeight: TOUCH_TARGET,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  choiceLabel: { fontSize: 16, fontFamily: FONTS.bodyMedium },
  radio: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  checkboxRow: { minHeight: TOUCH_TARGET, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  alert: { borderWidth: 1, borderRadius: RADIUS.md, padding: 12 },
});
