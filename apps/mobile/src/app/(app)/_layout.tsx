import { isOnboarded } from "@nutritrack/api-client";
import { Redirect, Tabs } from "expo-router";
import { House, LineChart, ScanLine, UserRound, UtensilsCrossed } from "lucide-react-native";
import { View } from "react-native";
import { ErrorState, LoadingState } from "@/components/ui";
import { AccountProvider, useAccount } from "@/lib/account";
import { FONTS, useColors } from "@/lib/theme";

export default function SignedInLayout() {
  return (
    <AccountProvider>
      <Gate />
    </AccountProvider>
  );
}

/** Five destinations, matching the web sidebar (ADR-033). Scan is raised for one-handed reach. */
function Gate() {
  const { state, reload } = useAccount();
  const c = useColors();
  if (state.status === "loading") return <LoadingState />;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={reload} />;
  if (!isOnboarded(state.profile)) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.background },
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontFamily: FONTS.bodyMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border, minHeight: 64 },
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color }) => <House color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: "Food",
          tabBarIcon: ({ color }) => <UtensilsCrossed color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarAccessibilityLabel: "Scan your meal",
          tabBarIcon: () => (
            <View
              style={{
                marginTop: -22,
                width: 56,
                height: 56,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: c.primary,
                borderWidth: 4,
                borderColor: c.card,
              }}
            >
              <ScanLine color={c.primaryForeground} size={24} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color }) => <LineChart color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <UserRound color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
