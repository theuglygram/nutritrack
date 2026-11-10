"use client";

import { NOT_MEDICAL_ADVICE } from "@nutritrack/core";
import Link from "next/link";
import { TargetsSummary } from "@/components/targets-summary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount } from "@/lib/account";

export default function TodayPage() {
  const { state } = useAccount();
  if (state.status !== "ready") return null; // The shell shows loading and error states.
  const { profile, goal } = state;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Hello{profile.display_name ? `, ${profile.display_name}` : ""}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Your daily targets</h2>
          </CardTitle>
          <CardDescription>
            {goal?.is_override
              ? "You've set these targets yourself."
              : "Calculated from your profile and goal."}{" "}
            <Link href="/settings" className="underline underline-offset-4">
              Change
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            <p className="text-muted-foreground">
              You don’t have targets yet.{" "}
              <Link href="/onboarding" className="underline underline-offset-4">
                Set them up
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Food logging arrives in the next update. {NOT_MEDICAL_ADVICE}
      </p>
    </div>
  );
}
