import type { Metadata } from "next";
import { FoodArt } from "@/components/brand/food-art";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Food" };

export default function FoodPage() {
  return (
    <ComingSoon
      title="Food"
      description="Search the Nigerian food database and log your meals."
      art={<FoodArt food="egusi" />}
      planned={[
        "Search Nigerian dishes by English, Yoruba, Igbo, Hausa or Pidgin names",
        "Log by familiar portions: wraps, cups, ladles and pieces",
        "Describe a meal in your own words and confirm the suggestions",
        "Save recent and favourite meals for quicker logging",
      ]}
    />
  );
}
