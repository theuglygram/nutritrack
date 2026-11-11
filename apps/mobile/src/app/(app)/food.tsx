import { UtensilsCrossed } from "lucide-react-native";
import { ComingSoon } from "@/components/coming-soon";

export default function FoodScreen() {
  return (
    <ComingSoon
      title="Food"
      description="Search the Nigerian food database and log your meals."
      icon={UtensilsCrossed}
      planned={[
        "Search Nigerian dishes by English, Yoruba, Igbo, Hausa or Pidgin names",
        "Log by familiar portions: wraps, cups, ladles and pieces",
        "Describe a meal in your own words and confirm the suggestions",
        "Save recent and favourite meals for quicker logging",
      ]}
    />
  );
}
