import type { ReactNode } from "react";
import { AccountProvider } from "@/lib/account";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <AccountProvider>{children}</AccountProvider>;
}
