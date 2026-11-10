import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type SessionStatus = "loading" | "signedIn" | "signedOut";

const SessionContext = createContext<SessionStatus>("loading");

/** Tracks whether a user is signed in, so navigation can show the right screens. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    // The session is read from on-device storage; the server verifies it on every request.
    void supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "signedIn" : "signedOut");
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "signedIn" : "signedOut");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <SessionContext value={status}>{children}</SessionContext>;
}

export function useSessionStatus(): SessionStatus {
  return use(SessionContext);
}
