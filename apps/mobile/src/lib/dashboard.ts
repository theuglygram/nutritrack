import { loadDashboard, localIsoDate, type DashboardData } from "@nutritrack/api-client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export type DashboardState = { status: "loading" } | { status: "ready"; data: DashboardData };

/** Same data as the web dashboard; each section can fail on its own. */
export function useDashboard() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [today] = useState(() => localIsoDate());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(() => loadDashboard(supabase, localIsoDate(), new Date()), []);

  const reload = useCallback(async () => {
    setState({ status: "ready", data: await fetchData() });
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    void fetchData().then((data) => {
      if (!cancelled) setState({ status: "ready", data });
    });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  return { state, reload, refresh, refreshing, today };
}
