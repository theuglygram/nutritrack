"use client";

import { loadDashboard, localIsoDate, type DashboardData } from "@nutritrack/api-client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./supabase";

export type DashboardState = { status: "loading" } | { status: "ready"; data: DashboardData };

/**
 * Today's log, water and weigh-ins. Sections load independently (see loadDashboard), so a
 * failure in one card shows that card's error state and the rest still render.
 */
export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [today] = useState(() => localIsoDate());

  const fetchData = useCallback(() => loadDashboard(getSupabase(), localIsoDate(), new Date()), []);

  const reload = useCallback(async () => {
    setState({ status: "ready", data: await fetchData() });
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    void fetchData().then((data) => {
      if (!cancelled) setState({ status: "ready", data });
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  return { state, reload, today };
}
