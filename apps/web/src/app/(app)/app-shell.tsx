"use client";

import { isOnboarded } from "@nutritrack/api-client";
import { APP_NAME } from "@nutritrack/core";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorState, LoadingState } from "@/components/account-status";
import { SignOutButton } from "@/components/sign-out-button";
import { useAccount } from "@/lib/account";

const NAV = [
  { href: "/", label: "Today" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { state, reload } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const needsOnboarding = state.status === "ready" && !isOnboarded(state.profile);

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight">
            {APP_NAME}
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="rounded-md px-3 py-2 text-sm hover:bg-muted aria-[current=page]:font-semibold"
              >
                {item.label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        {state.status === "loading" || needsOnboarding ? (
          <LoadingState />
        ) : state.status === "error" ? (
          <ErrorState message={state.message} onRetry={reload} />
        ) : (
          children
        )}
      </main>
    </>
  );
}
