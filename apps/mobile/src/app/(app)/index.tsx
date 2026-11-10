import { NOT_MEDICAL_ADVICE } from "@nutritrack/core";
import { router } from "expo-router";
import { TargetsSummary } from "@/components/targets-summary";
import { Body, Button, Card, Heading, Screen } from "@/components/ui";
import { useAccount } from "@/lib/account";

export default function TodayScreen() {
  const { state } = useAccount();
  if (state.status !== "ready") return null; // The layout shows loading and error states.
  const { profile, goal } = state;

  return (
    <Screen edges={["bottom"]}>
      <Heading>Hello{profile.display_name ? `, ${profile.display_name}` : ""}</Heading>
      <Card>
        <Heading level={2}>Your daily targets</Heading>
        <Body muted>
          {goal?.is_override
            ? "You've set these targets yourself."
            : "Calculated from your profile and goal."}
        </Body>
        {goal ? (
          <TargetsSummary
            targets={{
              calorieTarget: goal.calorie_target,
              proteinG: goal.protein_g,
              carbsG: goal.carbs_g,
              fatG: goal.fat_g,
              waterMl: goal.water_ml,
            }}
          />
        ) : (
          <Body muted>You don’t have targets yet.</Body>
        )}
        <Button label="Change targets" variant="outline" onPress={() => router.push("/settings")} />
      </Card>
      <Body muted>Food logging arrives in the next update. {NOT_MEDICAL_ADVICE}</Body>
    </Screen>
  );
}
