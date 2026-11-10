import type { ReactNode } from "react";
import { AppShell } from "./app-shell";
import { AccountProvider } from "@/lib/account";

export default function SignedInLayout({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <AppShell>{children}</AppShell>
    </AccountProvider>
  );
}
