import { ScanLine } from "lucide-react-native";
import { ComingSoon } from "@/components/coming-soon";

export default function ScanScreen() {
  return (
    <ComingSoon
      title="Scan your meal"
      description="Take a photo and let NutriTrack suggest what's on your plate."
      icon={ScanLine}
      planned={[
        "Photograph your plate and get suggested foods and portions",
        "Adjust anything that's wrong before it's saved",
        "Nothing is logged until you confirm it",
        "Photos are stored privately and deleted after 30 days",
      ]}
    />
  );
}
