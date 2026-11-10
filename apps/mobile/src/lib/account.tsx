import {
  loadAccount as fetchAccount,
  localIsoDate,
  toUserMessage,
  type Goal,
  type Profile,
} from "@nutritrack/api-client";
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type AccountState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: Profile; goal: Goal | null };

type AccountContextValue = { state: AccountState; reload: () => Promise<void> };

const AccountContext = createContext<AccountContextValue | null>(null);

async function loadAccount(): Promise<AccountState> {
  try {
    const { profile, goal } = await fetchAccount(supabase, localIsoDate());
    return { status: "ready", profile, goal };
  } catch (error) {
    return { status: "error", message: toUserMessage(error) };
  }
}

/** Loads the signed-in user's profile and active goal (same data as the web app). */
export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountState>({ status: "loading" });

  const reload = useCallback(async () => {
    setState(await loadAccount());
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadAccount().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <AccountContext value={{ state, reload }}>{children}</AccountContext>;
}

export function useAccount(): AccountContextValue {
  const value = use(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
