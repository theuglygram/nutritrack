import { isOnboarded } from "@nutritrack/api-client";
import { APP_NAME } from "@nutritrack/core";
import { Redirect, Stack, router } from "expo-router";
import { Pressable, Text } from "react-native";
import { ErrorState, LoadingState } from "@/components/ui";
import { AccountProvider, useAccount } from "@/lib/account";
import { TOUCH_TARGET, useColors } from "@/lib/theme";

export default function SignedInLayout() {
  return (
    <AccountProvider>
      <Gate />
    </AccountProvider>
  );
}

function Gate() {
  const { state, reload } = useAccount();
  const c = useColors();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={reload} />;
  if (!isOnboarded(state.profile)) return <Redirect href="/onboarding" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.foreground,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: APP_NAME,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push("/settings")}
              style={{ minHeight: TOUCH_TARGET, justifyContent: "center", paddingHorizontal: 8 }}
            >
              <Text style={{ color: c.foreground, fontSize: 16 }}>Settings</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}
