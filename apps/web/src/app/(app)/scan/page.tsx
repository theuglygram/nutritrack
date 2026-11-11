import type { Metadata } from "next";
import { FoodArt } from "@/components/brand/food-art";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Scan" };

export default function ScanPage() {
  return (
    <ComingSoon
      title="Scan your meal"
      description="Take a photo and let NutriTrack suggest what's on your plate."
      art={<FoodArt food="jollof" />}
      planned={[
        "Photograph your plate and get suggested foods and portions",
        "Adjust anything that's wrong before it's saved",
        "Nothing is logged until you confirm it",
        "Photos are stored privately and deleted after 30 days",
      ]}
    />
  );
}
