"use client";

import { isOnboarded } from "@nutritrack/api-client";
import {
  House,
  LineChart,
  ScanLine,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorState, LoadingState } from "@/components/account-status";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { useAccount } from "@/lib/account";
import { cn } from "cn";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  prominent?: boolean;
  /** Not built yet: the page explains when it arrives. */
  soon?: boolean;
};

/** The same five destinations as the mobile app's tab bar (ADR-033). */
export const APP_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/food", label: "Food", icon: UtensilsCrossed, soon: true },
  { href: "/scan", label: "Scan", icon: ScanLine, prominent: true, soon: true },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { state, reload } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const needsOnboarding = state.status === "ready" && !isOnboarded(state.profile);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  return (
    <div className="flex min-h-dvh flex-1">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/70 bg-card px-4 py-6 lg:flex">
        <Logo href="/home" className="px-2" />
        <nav aria-label="Main" className="mt-10 flex flex-col gap-1">
          {APP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-xl px-3 font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground",
                "aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary",
              )}
            >
              <item.icon className="size-5" aria-hidden="true" />
              {item.label}
              {item.soon && (
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-border/70 pt-4">
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/70 bg-background/85 px-4 backdrop-blur-md lg:hidden">
          <Logo href="/home" />
        </header>

        <main
          id="content"
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12"
        >
          {state.status === "loading" || needsOnboarding ? (
            <LoadingState />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={reload} />
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile bottom navigation, reachable one-handed */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {APP_NAV.map((item) => (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className="group flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground aria-[current=page]:text-primary"
              >
                {item.prominent ? (
                  <span className="-mt-6 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition group-active:scale-95">
                    <item.icon className="size-6" aria-hidden="true" />
                  </span>
                ) : (
                  <item.icon className="size-5" aria-hidden="true" />
                )}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
